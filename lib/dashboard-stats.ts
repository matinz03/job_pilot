type DashboardStatsRow = {
  total_jobs: number | string | null;
  average_match_score: number | string | null;
  companies_researched: number | string | null;
  jobs_this_week: number | string | null;
  jobs_last_week: number | string | null;
  average_match_score_this_week: number | string | null;
  average_match_score_last_week: number | string | null;
  companies_researched_this_week: number | string | null;
  companies_researched_last_week: number | string | null;
};

export type DashboardStats = {
  totalJobs: number;
  averageMatchScore: number | null;
  companiesResearched: number;
  jobsThisWeek: number;
  jobsLastWeek: number;
  averageMatchScoreThisWeek: number | null;
  averageMatchScoreLastWeek: number | null;
  companiesResearchedThisWeek: number;
  companiesResearchedLastWeek: number;
};

function numberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberOrZero(value: number | string | null): number {
  return numberOrNull(value) ?? 0;
}

export async function getDashboardStats(insforge: Awaited<ReturnType<typeof import("@/lib/insforge-server").createInsforgeServer>>): Promise<DashboardStats> {
  const { data, error } = await insforge.database.rpc("dashboard_stats");
  if (error) throw new Error("Could not load dashboard statistics.");

  const row = (Array.isArray(data) ? data[0] : data) as DashboardStatsRow | null;
  if (!row) {
    return {
      totalJobs: 0,
      averageMatchScore: null,
      companiesResearched: 0,
      jobsThisWeek: 0,
      jobsLastWeek: 0,
      averageMatchScoreThisWeek: null,
      averageMatchScoreLastWeek: null,
      companiesResearchedThisWeek: 0,
      companiesResearchedLastWeek: 0,
    };
  }

  return {
    totalJobs: numberOrZero(row.total_jobs),
    averageMatchScore: numberOrNull(row.average_match_score),
    companiesResearched: numberOrZero(row.companies_researched),
    jobsThisWeek: numberOrZero(row.jobs_this_week),
    jobsLastWeek: numberOrZero(row.jobs_last_week),
    averageMatchScoreThisWeek: numberOrNull(row.average_match_score_this_week),
    averageMatchScoreLastWeek: numberOrNull(row.average_match_score_last_week),
    companiesResearchedThisWeek: numberOrZero(row.companies_researched_this_week),
    companiesResearchedLastWeek: numberOrZero(row.companies_researched_last_week),
  };
}
