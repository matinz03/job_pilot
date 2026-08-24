import { detectCountry, formatSalary, searchJobs, type AdzunaJob } from "@/lib/adzuna";
import type { createInsforgeServer } from "@/lib/insforge-server";
import type { ProfileFormValues } from "@/lib/profile";
import { scoreJob } from "@/agent/matcher";
import type { DiscoveryResult, JobMatch, SavedJobSummary } from "@/agent/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type DiscoveryInput = {
  insforge: InsforgeServer;
  userId: string;
  profile: ProfileFormValues;
  jobTitle: string;
  location: string;
};

export const STRONG_MATCH_SCORE = 70;
const RESULTS_PER_PAGE = 10;

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

function summarise(jobsFound: number, jobsSaved: number, duplicates: number, strongMatches: number): string {
  if (jobsFound === 0) {
    return "No jobs found for that search. Try a broader job title or a different location.";
  }

  const parts = [`Found ${jobsFound} ${jobsFound === 1 ? "job" : "jobs"}`];
  parts.push(`saved ${strongMatches} strong ${strongMatches === 1 ? "match" : "matches"}`);
  const sentence = `${parts.join(" and ")}.`;
  if (duplicates > 0) {
    return `${sentence} ${duplicates} ${duplicates === 1 ? "was" : "were"} already in your list.`;
  }
  if (jobsSaved === 0) {
    return `${sentence} Nothing new was saved.`;
  }
  return sentence;
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
  const { insforge, jobTitle, location, profile, userId } = input;

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
    const country = detectCountry(location);
    await log(insforge, { userId, runId, level: "info", message: `Searching ${country.toUpperCase()} for "${jobTitle}"${location ? ` in ${location}` : ""}.` });

    const results = await searchJobs(jobTitle, location, country, RESULTS_PER_PAGE);

    const { data: existing, error: existingError } = await insforge.database
      .from("jobs")
      .select("company, title")
      .eq("user_id", userId);
    if (existingError) {
      console.error("[agent/adzuna] existing jobs", existingError);
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

    // One call per job so a single malformed response costs one job, not the whole run.
    const scored = await Promise.all(
      fresh.map(async (job) => ({ job, match: await scoreJob(profile, job) })),
    );

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

    const strongMatches = savedJobs.filter((job) => job.matchScore >= STRONG_MATCH_SCORE).length;

    const { error: completeError } = await insforge.database
      .from("agent_runs")
      .update({ status: "completed", jobs_found: results.length, completed_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("user_id", userId);
    if (completeError) console.error("[agent/adzuna] complete run", completeError);

    await log(insforge, { userId, runId, level: "success", message: `Saved ${savedJobs.length} of ${results.length} ${results.length === 1 ? "job" : "jobs"}, ${strongMatches} scoring ${STRONG_MATCH_SCORE} or above.` });

    return {
      runId,
      jobsFound: results.length,
      jobsSaved: savedJobs.length,
      duplicates,
      failed,
      strongMatches,
      message: summarise(results.length, savedJobs.length, duplicates, strongMatches),
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
