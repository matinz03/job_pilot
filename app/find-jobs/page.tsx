import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { createInsforgeServer } from "@/lib/insforge-server";
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

export default async function FindJobsPage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  const { data: rows, error: jobsError } = await insforge.database
    .from("jobs")
    .select("id, company, title, match_score, salary, source, found_at")
    .eq("user_id", user.id)
    .order("found_at", { ascending: false });

  if (jobsError) {
    console.error("[find-jobs/page] jobs load", jobsError);
  }

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
        <JobFilters />
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="overflow-x-auto">
            <JobsTable jobs={jobs} />
          </div>
          {jobs.length > 0 && (
            <JobsPagination currentPage={1} from={1} pages={[1]} to={jobs.length} total={jobs.length} />
          )}
        </section>
      </main>
    </div>
  );
}
