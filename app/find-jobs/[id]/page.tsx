import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { ApplyNowButton, ViewJobPostButton } from "@/components/job-details/JobActions";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { ChevronLeftIcon } from "@/components/job-details/icons";
import { createInsforgeServer } from "@/lib/insforge-server";
import { companyResearchSchema, type CompanyResearchDossier } from "@/lib/company-research";
import { formatRelativeTime } from "@/lib/utils";

type JobDetailsRow = {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  about_role: string | null;
  match_score: number | null;
  match_reason: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  source_url: string | null;
  external_apply_url: string | null;
  company_research: unknown;
  found_at: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  const { id } = await params;
  // A malformed id would otherwise reach the database as a filter value.
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const { data: row, error: jobError } = await insforge.database
    .from("jobs")
    .select("id, title, company, location, salary, job_type, about_role, match_score, match_reason, matched_skills, missing_skills, source_url, external_apply_url, company_research, found_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobError) {
    console.error("[find-jobs/[id]/page] job load", jobError);
  }

  const job = row as JobDetailsRow | null;
  if (!job) {
    notFound();
  }

  const company = job.company ?? "Unknown company";
  const applyUrl = job.external_apply_url ?? job.source_url ?? "";
  const parsedResearch = companyResearchSchema.safeParse(job.company_research);
  const dossier: CompanyResearchDossier | null = parsedResearch.success ? parsedResearch.data : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeItem="find-jobs" isAuthenticated />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[880px] space-y-6">
          <Link
            className="inline-flex items-center gap-2 text-base font-medium text-text-dark transition-colors hover:text-accent"
            href="/find-jobs"
          >
            <ChevronLeftIcon /> Back to Jobs
          </Link>

          <div className="flex flex-col gap-6">
            <JobInfo
              action={<ViewJobPostButton applyUrl={applyUrl} />}
              company={company}
              foundAt={job.found_at ? formatRelativeTime(job.found_at) : "—"}
              jobType={job.job_type ?? "—"}
              location={job.location ?? "Not listed"}
              matchScore={job.match_score ?? 0}
              salary={job.salary ?? "Not listed"}
              title={job.title ?? "Untitled role"}
            />

            <MatchScore
              matchReason={job.match_reason ?? ""}
              matchedSkills={job.matched_skills ?? []}
              missingSkills={job.missing_skills ?? []}
            />

            <JobDescription description={job.about_role ?? ""} />

            <CompanyResearch company={company} dossier={dossier} jobId={job.id} />

            <ApplyNowButton applyUrl={applyUrl} company={company} />
          </div>
        </div>
      </main>
    </div>
  );
}
