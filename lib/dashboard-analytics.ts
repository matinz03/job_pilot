export type DailyChartPoint = {
  day: string;
  value: number;
};

export type ScoreChartPoint = {
  score: string;
  value: number;
};

export type AnalyticsChart<T> = {
  data: T[];
  status: "empty" | "ready" | "unavailable";
};

export type DashboardAnalytics = {
  companyResearch: AnalyticsChart<DailyChartPoint>;
  jobsFound: AnalyticsChart<DailyChartPoint>;
  matchScores: AnalyticsChart<ScoreChartPoint>;
};

const SCORE_BANDS = [
  { key: "band_50", label: "50–60%" },
  { key: "band_60", label: "60–70%" },
  { key: "band_70", label: "70–80%" },
  { key: "band_80", label: "80–90%" },
  { key: "band_90", label: "90–100%" },
] as const;

function queryHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!host) throw new Error("PostHog host is not configured.");
  const url = new URL(host);
  url.hostname = url.hostname.replace(/\.i\.posthog\.com$/, ".posthog.com");
  url.pathname = "";
  url.search = "";
  return url.origin;
}

function escapeHogQlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function queryPostHog(query: string): Promise<unknown[][]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error("PostHog analytics credentials are not configured.");

  const response = await fetch(`${queryHost()}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PostHog analytics query failed: ${response.status}`);

  const payload = await response.json() as { results?: unknown };
  if (!Array.isArray(payload.results)) throw new Error("PostHog analytics returned an invalid response.");
  return payload.results.filter((row): row is unknown[] => Array.isArray(row));
}

function asNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function recentDays(days: number, rows: unknown[][]): DailyChartPoint[] {
  const counts = new Map(rows.map(([day, count]) => [String(day), asNumber(count)]));
  const now = new Date();
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days + 1));

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(firstDay);
    date.setUTCDate(firstDay.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { day: dayLabel(date), value: counts.get(key) ?? 0 };
  });
}

function dailyChart(rows: unknown[][], days: number): AnalyticsChart<DailyChartPoint> {
  const data = recentDays(days, rows);
  return { data, status: data.some((point) => point.value > 0) ? "ready" : "empty" };
}

function unavailableDaily(days: number): AnalyticsChart<DailyChartPoint> {
  return { data: recentDays(days, []), status: "unavailable" };
}

function scoreChart(rows: unknown[][]): AnalyticsChart<ScoreChartPoint> {
  const counts = rows[0] ?? [];
  const data = SCORE_BANDS.map((band, index) => ({ score: band.label, value: asNumber(counts[index]) }));
  return { data, status: data.some((point) => point.value > 0) ? "ready" : "empty" };
}

function unavailableScores(): AnalyticsChart<ScoreChartPoint> {
  return { data: SCORE_BANDS.map((band) => ({ score: band.label, value: 0 })), status: "unavailable" };
}

async function safeChart<T>(query: () => Promise<AnalyticsChart<T>>, fallback: AnalyticsChart<T>): Promise<AnalyticsChart<T>> {
  try {
    return await query();
  } catch (error) {
    console.error("[dashboard analytics]", error);
    return fallback;
  }
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
  const distinctId = escapeHogQlString(userId);
  const jobFoundWhere = `event = 'job_found' AND distinct_id = '${distinctId}'`;
  const researchWhere = `event = 'company_researched' AND distinct_id = '${distinctId}'`;

  const [jobsFound, matchScores, companyResearch] = await Promise.all([
    safeChart(
      async () => dailyChart(await queryPostHog(`
        SELECT toDate(timestamp) AS day, count() AS total
        FROM events
        WHERE ${jobFoundWhere} AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY day
        ORDER BY day
      `), 30),
      unavailableDaily(30),
    ),
    safeChart(
      async () => scoreChart(await queryPostHog(`
        SELECT
          countIf(toFloat(properties.matchScore) >= 50 AND toFloat(properties.matchScore) < 60) AS band_50,
          countIf(toFloat(properties.matchScore) >= 60 AND toFloat(properties.matchScore) < 70) AS band_60,
          countIf(toFloat(properties.matchScore) >= 70 AND toFloat(properties.matchScore) < 80) AS band_70,
          countIf(toFloat(properties.matchScore) >= 80 AND toFloat(properties.matchScore) < 90) AS band_80,
          countIf(toFloat(properties.matchScore) >= 90 AND toFloat(properties.matchScore) <= 100) AS band_90
        FROM events
        WHERE ${jobFoundWhere} AND timestamp >= now() - INTERVAL 30 DAY
      `)),
      unavailableScores(),
    ),
    safeChart(
      async () => dailyChart(await queryPostHog(`
        SELECT toDate(timestamp) AS day, count() AS total
        FROM events
        WHERE ${researchWhere} AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY day
        ORDER BY day
      `), 7),
      unavailableDaily(7),
    ),
  ]);

  return { jobsFound, matchScores, companyResearch };
}
