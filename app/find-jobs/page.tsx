import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  HIGH_MATCH_SCORE,
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

  let query = insforge.database
    .from("jobs")
    .select("id, company, title, match_score, salary, source, found_at", { count: "exact" })
    .eq("user_id", user.id);

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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const jobs: JobListItem[] = ((rows as JobRow[] | null) ?? []).map((row) => ({
    id: String(row.id),
    company: row.company ?? "Unknown company",
    role: row.title ?? "Untitled role",
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
      </main>
    </div>
  );
}
