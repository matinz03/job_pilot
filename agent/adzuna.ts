import { DEFAULT_JOBS_PER_LOCATION, MAX_LOCATIONS, formatSalary, parseLocations, searchJobs, type AdzunaJob, type JobsPerLocation } from "@/lib/adzuna";
import type { createInsforgeServer } from "@/lib/insforge-server";
import type { ProfileFormValues } from "@/lib/profile";
import { scoreJob } from "@/agent/matcher";
import type { DiscoveryResult, JobMatch, SavedJobSummary } from "@/agent/types";
import { HIGH_MATCH_SCORE } from "@/lib/match-score";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type DiscoveryInput = {
  insforge: InsforgeServer;
  userId: string;
  profile: ProfileFormValues;
  jobTitle: string;
  location: string;
  jobsPerLocation?: JobsPerLocation;
};

// A "strong match" and the High Match filter are the same threshold, owned by lib/match-score.
export { HIGH_MATCH_SCORE as STRONG_MATCH_SCORE } from "@/lib/match-score";

// Measured against the gateway: ten concurrent scoring calls take 131s for ten jobs, five take
// 13.9s, three take 24.3s. It queues past five, so the pool is a throughput fix, not a politeness
// one — a ten-job run went from over two minutes to under fifteen seconds.
const SCORING_CONCURRENCY = 5;

async function scoreWithPool<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const output: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await run(items[index]);
    }
  }));
  return output;
}

function jobKey(company: string, title: string): string {
  return `${company.trim().toLowerCase()}|${title.trim().toLowerCase()}`;
}

// Logging must never take the run down with it, so failures here are swallowed after a console line.
async function log(
  insforge: InsforgeServer,
  entry: { userId: string; runId: string | null; message: string; level: string; jobId?: string },
): Promise<void> {
  try {
    const { error } = await insforge.database.from("agent_logs").insert([{
      run_id: entry.runId,
      user_id: entry.userId,
      message: entry.message,
      level: entry.level,
      job_id: entry.jobId ?? null,
    }]);
    if (error) console.error("[agent/adzuna] agent log", error);
  } catch (error) {
    console.error("[agent/adzuna] agent log", error);
  }
}

export function summariseRun(jobsFound: number, jobsSaved: number, duplicates: number, strongMatches: number): string {
  if (jobsFound === 0) {
    return "No jobs found for that search. Try a broader job title or a different location.";
  }

  const found = `Found ${jobsFound} ${jobsFound === 1 ? "job" : "jobs"}`;
  const alreadyHave = duplicates > 0
    ? ` ${duplicates} ${duplicates === 1 ? "was" : "were"} already in your list.`
    : "";

  if (jobsSaved === 0) {
    return duplicates > 0
      ? `${found}, all of which you already have.`
      : `${found}, but none could be saved.`;
  }

  // "Saved 0 strong matches" reads as though nothing was saved at all, so the saved count leads
  // and the strong count qualifies it.
  const strong = strongMatches > 0
    ? `, including ${strongMatches} strong ${strongMatches === 1 ? "match" : "matches"}`
    : `, though none scored ${HIGH_MATCH_SCORE} or above`;

  return `${found} and saved ${jobsSaved}${strong}.${alreadyHave}`;
}

function toJobRow(job: AdzunaJob, match: JobMatch, userId: string, runId: string) {
  return {
    run_id: runId,
    user_id: userId,
    source: "search" as const,
    source_url: job.redirect_url ?? null,
    external_apply_url: job.redirect_url ?? null,
    title: job.title,
    company: job.company?.display_name ?? "Unknown company",
    location: job.location?.display_name ?? null,
    salary: formatSalary(job),
    job_type: job.contract_type ?? null,
    about_role: job.description ?? null,
    match_score: match.matchScore,
    match_reason: match.matchReason || null,
    matched_skills: match.matchedSkills,
    missing_skills: match.missingSkills,
    ...(job.created ? { found_at: job.created } : {}),
  };
}

export async function runJobDiscovery(input: DiscoveryInput): Promise<DiscoveryResult> {
  const { insforge, jobTitle, jobsPerLocation = DEFAULT_JOBS_PER_LOCATION, location, profile, userId } = input;

  const { data: run, error: runError } = await insforge.database
    .from("agent_runs")
    .insert([{ user_id: userId, status: "running", job_title_searched: jobTitle, location_searched: location || null }])
    .select("id")
    .single();

  if (runError || !run) {
    console.error("[agent/adzuna] create run", runError);
    throw new Error("Could not start the job search. Please try again.");
  }
  const runId = String(run.id);

  try {
    // The location field is a list of alternatives, so each entry is its own Adzuna search and
    // the results are merged. One entry failing does not take the run down with it.
    const { entries, dropped } = parseLocations(location);
    if (dropped.length > 0) {
      await log(insforge, { userId, runId, level: "warning", message: `Only the first ${MAX_LOCATIONS} locations were searched. Ignored: ${dropped.join(", ")}.` });
    }

    const searches = await Promise.all(entries.map(async (entry) => {
      const where = entry.kind === "remote"
        ? "remote roles"
        : entry.kind === "country"
          ? `${entry.label || entry.country.toUpperCase()} country-wide`
          : entry.label;
      try {
        const jobs = await searchJobs(jobTitle, entry, jobsPerLocation);
        await log(insforge, { userId, runId, level: "info", message: `Searched ${entry.country.toUpperCase()} for "${jobTitle}" — ${where}: ${jobs.length} of up to ${jobsPerLocation} ${jobs.length === 1 ? "job" : "jobs"}.` });
        return { jobs, failed: false };
      } catch (error) {
        console.error("[agent/adzuna] search", where, error);
        await log(insforge, { userId, runId, level: "warning", message: `Could not search ${where}. The other locations were still searched.` });
        return { jobs: [] as AdzunaJob[], failed: true };
      }
    }));

    if (searches.every((search) => search.failed)) {
      throw new Error("Could not reach the job search service. Please try again.");
    }

    // An ad matching two locations is one job, so it is merged before anything is scored.
    const byAdId = new Map<string, AdzunaJob>();
    for (const search of searches) {
      for (const job of search.jobs) {
        const key = String(job.id ?? job.redirect_url ?? `${job.company?.display_name}|${job.title}`);
        if (!byAdId.has(key)) byAdId.set(key, job);
      }
    }
    const results = [...byAdId.values()];

    // Only the companies in this batch are looked up, rather than every job ever saved. A whole
    // table read is both wasteful and capped by the API's default page size, which silently
    // shrank what the duplicate check could see once the list grew.
    const companies = [...new Set(results.map((job) => (job.company?.display_name ?? "").trim()).filter(Boolean))];
    const { data: existing, error: existingError } = companies.length > 0
      ? await insforge.database
        .from("jobs")
        .select("company, title")
        .eq("user_id", userId)
        .in("company", companies)
      : { data: [], error: null };

    if (existingError) {
      // A failed lookup means duplicates get through, so say so rather than failing quietly.
      console.error("[agent/adzuna] existing jobs", existingError);
      await log(insforge, { userId, runId, level: "warning", message: "Could not check which jobs you already have, so this search may have saved duplicates." });
    }

    const seen = new Set(
      ((existing ?? []) as { company: string; title: string }[]).map((job) => jobKey(job.company, job.title)),
    );

    const fresh: AdzunaJob[] = [];
    let duplicates = 0;
    for (const job of results) {
      const key = jobKey(job.company?.display_name ?? "", job.title ?? "");
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      fresh.push(job);
    }

    if (duplicates > 0) {
      await log(insforge, { userId, runId, level: "info", message: `Skipped ${duplicates} ${duplicates === 1 ? "job" : "jobs"} already in your list.` });
    }

    // One call per job so a single malformed response costs one job, not the whole run, but
    // capped at five in flight because the gateway queues beyond that.
    const scored = await scoreWithPool(fresh, SCORING_CONCURRENCY, async (job) => ({
      job,
      match: await scoreJob(profile, job),
    }));

    const rows: ReturnType<typeof toJobRow>[] = [];
    let failed = 0;
    for (const { job, match } of scored) {
      if (!match.success) {
        failed += 1;
        await log(insforge, { userId, runId, level: "warning", message: `Could not score "${job.title}" at ${job.company?.display_name ?? "an unknown company"}. It was not saved.` });
        continue;
      }
      rows.push(toJobRow(job, match.data, userId, runId));
    }

    let savedJobs: SavedJobSummary[] = [];
    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await insforge.database
        .from("jobs")
        .insert(rows)
        .select("id, company, title, match_score");

      if (insertError) {
        console.error("[agent/adzuna] insert jobs", insertError);
        throw new Error("Found jobs but could not save them. Please try again.");
      }

      savedJobs = ((inserted ?? []) as { id: string; company: string; title: string; match_score: number }[]).map((job) => ({
        id: String(job.id),
        company: job.company,
        title: job.title,
        matchScore: job.match_score,
      }));
    }

    const strongMatches = savedJobs.filter((job) => job.matchScore >= HIGH_MATCH_SCORE).length;

    const { error: completeError } = await insforge.database
      .from("agent_runs")
      .update({ status: "completed", jobs_found: results.length, completed_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("user_id", userId);
    if (completeError) console.error("[agent/adzuna] complete run", completeError);

    await log(insforge, { userId, runId, level: "success", message: `Saved ${savedJobs.length} of ${results.length} ${results.length === 1 ? "job" : "jobs"}, ${strongMatches} scoring ${HIGH_MATCH_SCORE} or above.` });

    return {
      runId,
      jobsFound: results.length,
      jobsSaved: savedJobs.length,
      duplicates,
      failed,
      strongMatches,
      message: summariseRun(results.length, savedJobs.length, duplicates, strongMatches),
      savedJobs,
    };
  } catch (error) {
    console.error("[agent/adzuna] run failed", error);
    await insforge.database
      .from("agent_runs")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("user_id", userId);
    await log(insforge, { userId, runId, level: "error", message: error instanceof Error ? error.message : "The job search failed." });
    throw error;
  }
}
