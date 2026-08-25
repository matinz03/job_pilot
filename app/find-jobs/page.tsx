import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { RunScopeNotice } from "@/components/find-jobs/RunScopeNotice";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { DeleteAction } from "@/components/find-jobs/DeleteAction";
import { deleteAllJobs } from "@/actions/jobs";
import { createInsforgeServer } from "@/lib/insforge-server";
import { HIGH_MATCH_SCORE } from "@/lib/match-score";
import {
  PAGE_SIZE,
  emptyMessage,
  parseJobSearchParams,
  sanitiseSearchTerm,
} from "@/lib/job-filters";
import { formatRelativeTime } from "@/lib/utils";
import type { JobListItem, JobSource } from "@/types";

type JobRow = {
  id: string;
  company: string | null;
  title: string | null;
  location: string | null;
  match_score: number | null;
  salary: string | null;
  source: string | null;
  found_at: string | null;
};

type FindJobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindJobsPage({ searchParams }: FindJobsPageProps) {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  const params = parseJobSearchParams(await searchParams);

  // The run is looked up under the current user, so an id belonging to someone else finds nothing.
  const { data: run } = params.run
    ? await insforge.database
      .from("agent_runs")
      .select("job_title_searched, location_searched")
      .eq("id", params.run)
      .eq("user_id", user.id)
      .maybeSingle()
    : { data: null };
  const scopedRun = run as { job_title_searched: string; location_searched: string | null } | null;

  let query = insforge.database
    .from("jobs")
    .select("id, company, title, location, match_score, salary, source, found_at", { count: "exact" })
    .eq("user_id", user.id);

  if (params.run) {
    query = query.eq("run_id", params.run);
  }

  const term = sanitiseSearchTerm(params.query);
  if (term) {
    query = query.or(`company.ilike.*${term}*,title.ilike.*${term}*`);
  }
  if (params.match === "high") {
    query = query.gte("match_score", HIGH_MATCH_SCORE);
  }
  if (params.match === "low") {
    query = query.lt("match_score", HIGH_MATCH_SCORE);
  }

  if (params.sort === "newest") {
    query = query.order("found_at", { ascending: false });
  } else if (params.sort === "oldest") {
    query = query.order("found_at", { ascending: true });
  } else {
    query = query.order("match_score", { ascending: false }).order("found_at", { ascending: false });
  }

  const offset = (params.page - 1) * PAGE_SIZE;
  const { data: rows, count, error: jobsError } = await query.range(offset, offset + PAGE_SIZE - 1);

  if (jobsError) {
    console.error("[find-jobs/page] jobs load", jobsError);
  }

  const total = count ?? 0;

  // The clear-all label must name every saved job, not just the ones this view is showing.
  const { count: savedJobsCount } = params.run || params.query || params.match !== "all"
    ? await insforge.database
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    : { count };
  const savedJobs = savedJobsCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const jobs: JobListItem[] = ((rows as JobRow[] | null) ?? []).map((row) => ({
    id: String(row.id),
    company: row.company ?? "Unknown company",
    role: row.title ?? "Untitled role",
    location: row.location ?? "Not listed",
    matchScore: row.match_score ?? 0,
    salary: row.salary ?? "Not listed",
    source: (row.source === "url" ? "url" : "search") satisfies JobSource,
    foundAt: row.found_at ? formatRelativeTime(row.found_at) : "",
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeItem="find-jobs" isAuthenticated />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SearchControls />
        <JobFilters params={params} />
        {params.run && (
          <RunScopeNotice
            jobTitle={scopedRun?.job_title_searched ?? ""}
            location={scopedRun?.location_searched ?? ""}
            runId={params.run}
            total={total}
          />
        )}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="overflow-x-auto">
            <JobsTable emptyMessage={emptyMessage(params)} jobs={jobs} />
          </div>
          {total > 0 && (
            <JobsPagination
              from={offset + 1}
              params={params}
              to={offset + jobs.length}
              total={total}
              totalPages={totalPages}
            />
          )}
        </section>
        {savedJobs > 0 && (
          <div className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Clearing removes every saved job and its search history. Searches can always be run again.
            </p>
            <DeleteAction
              action={deleteAllJobs}
              count={savedJobs}
              idleLabel={`Clear all ${savedJobs} saved jobs`}
              redirectTo="/find-jobs"
              tone="quiet"
            />
          </div>
        )}
      </main>
    </div>
  );
}
