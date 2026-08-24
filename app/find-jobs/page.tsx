import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { JobListItem } from "@/types";

// Mock data until Feature 10 wires Adzuna discovery and Feature 11 wires filter, sort and paging.
const mockJobs: JobListItem[] = [
  { id: "1", company: "Vercel", role: "Senior Frontend Engineer", matchScore: 94, salary: "$160k - $200k", source: "search", foundAt: "2 hours ago" },
  { id: "2", company: "Stripe", role: "Staff UI Engineer", matchScore: 88, salary: "$180k - $240k", source: "search", foundAt: "Yesterday" },
  { id: "3", company: "Linear", role: "Product Engineer", matchScore: 96, salary: "$150k - $190k", source: "search", foundAt: "Yesterday" },
  { id: "4", company: "Notion", role: "Frontend Developer", matchScore: 72, salary: "$130k - $170k", source: "search", foundAt: "2 days ago" },
  { id: "5", company: "OpenAI", role: "Design Engineer", matchScore: 91, salary: "$200k - $280k", source: "search", foundAt: "3 days ago" },
  { id: "6", company: "Figma", role: "Software Engineer, Editor", matchScore: 85, salary: "$170k - $220k", source: "url", foundAt: "4 days ago" },
];

export default async function FindJobsPage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeItem="find-jobs" isAuthenticated />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SearchControls resultMessage="Found 8 jobs and saved 4 strong matches." />
        <JobFilters />
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="overflow-x-auto">
            <JobsTable jobs={mockJobs} />
          </div>
          <JobsPagination currentPage={1} from={1} pages={[1, 2, 3, "gap", 8]} to={6} total={24} />
        </section>
      </main>
    </div>
  );
}
