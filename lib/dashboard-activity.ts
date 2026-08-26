import type { createInsforgeServer } from "@/lib/insforge-server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type CompletedRunRow = {
  id: string;
  job_title_searched: string | null;
  jobs_found: number | null;
  completed_at: string | null;
};

type ResearchedJobRow = {
  id: string;
  company: string | null;
  researched_at: string | null;
};

export type DashboardActivity = {
  id: string;
  title: string;
  timestamp: string;
  tone: "info" | "success";
};

const ACTIVITY_LIMIT = 10;

export async function getDashboardActivity(insforge: InsforgeServer, userId: string): Promise<DashboardActivity[]> {
  const completedRuns = insforge.database
    .from("agent_runs")
    .select("id, job_title_searched, jobs_found, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(ACTIVITY_LIMIT);
  const researchedJobs = insforge.database
    .from("jobs")
    .select("id, company, researched_at")
    .eq("user_id", userId)
    .not("researched_at", "is", null)
    .order("researched_at", { ascending: false })
    .limit(ACTIVITY_LIMIT);

  const [{ data: runRows, error: runError }, { data: researchRows, error: researchError }] = await Promise.all([
    completedRuns,
    researchedJobs,
  ]);
  if (runError || researchError) throw new Error("Could not load dashboard activity.");

  const runs = ((runRows ?? []) as CompletedRunRow[])
    .filter((run) => run.completed_at)
    .map((run) => ({
      id: `run-${run.id}`,
      title: `Found ${run.jobs_found ?? 0} ${(run.jobs_found ?? 0) === 1 ? "job" : "jobs"} for ${run.job_title_searched || "your search"}`,
      timestamp: run.completed_at!,
      tone: "info" as const,
    }));
  const research = ((researchRows ?? []) as ResearchedJobRow[])
    .filter((job) => job.researched_at)
    .map((job) => ({
      id: `research-${job.id}`,
      title: `Researched ${job.company || "company"}`,
      timestamp: job.researched_at!,
      tone: "success" as const,
    }));

  return [...runs, ...research]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, ACTIVITY_LIMIT);
}

export function formatActivityTime(timestamp: string, now = new Date()): string {
  const elapsedMilliseconds = Math.max(0, now.getTime() - new Date(timestamp).getTime());
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} ${elapsedMinutes === 1 ? "min" : "mins"} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
  if (elapsedHours < 48) return "Yesterday";

  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(timestamp));
}
