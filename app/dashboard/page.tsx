import { redirect } from "next/navigation";
import {
  CompanyResearchChart,
  JobsFoundChart,
  MatchScoreChart,
} from "@/components/dashboard/DashboardCharts";
import { Navbar } from "@/components/layout/Navbar";
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard-stats";
import { createInsforgeServer } from "@/lib/insforge-server";

const activity = [
  { title: "Found 8 jobs for Frontend Engineer", time: "10 mins ago", tone: "accent" },
  { title: "Researched Stripe", time: "1 hour ago", tone: "info" },
  { title: "Found 12 jobs for React Developer", time: "2 hours ago", tone: "success" },
  { title: "Researched Vercel", time: "Yesterday", tone: "accent" },
  { title: "Found 10 jobs for Full Stack Engineer", time: "Yesterday", tone: "success" },
] as const;

const trendToneClasses = {
  negative: "text-error",
  neutral: "text-text-muted",
  positive: "text-success-dark",
} as const;

const activityToneClasses = {
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success",
} as const;

export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const {
    data: { user },
    error,
  } = await insforge.auth.getCurrentUser();

  if (!user || error) {
    redirect("/login");
  }

  const dashboardStats = await getDashboardStats(insforge);
  const stats = createStats(dashboardStats);

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeItem="dashboard" isAuthenticated />
      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Dashboard</h1>
        <p className="mt-2 text-base text-text-secondary">Here&apos;s what&apos;s happening with your job search.</p>

        <section aria-label="Job search summary" className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article className="rounded-2xl border border-border bg-surface p-6 shadow-card" key={stat.label}>
              <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-text-primary">{stat.value}</p>
              <p className="mt-3 text-sm text-text-muted">
                {stat.change ? <span className={`font-medium ${trendToneClasses[stat.trendTone]}`}>{stat.change} </span> : null}
                {stat.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
            <ol className="mt-6 space-y-6 border-l border-border pl-5">
              {activity.map((item) => (
                <li className="relative" key={`${item.title}-${item.time}`}>
                  <span className={`absolute -left-[26px] top-1 size-3 rounded-full border-2 border-surface ${activityToneClasses[item.tone]}`} />
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{item.time}</p>
                </li>
              ))}
            </ol>
          </article>

          <ChartCard title="Company Research Activity">
            <CompanyResearchChart />
          </ChartCard>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ChartCard title="Jobs Found Over Time" tall>
            <JobsFoundChart />
          </ChartCard>
          <ChartCard title="Match Score Distribution" tall>
            <MatchScoreChart />
          </ChartCard>
        </section>
      </main>
    </div>
  );
}

function createStats(stats: DashboardStats) {
  return [
    {
      label: "Total Jobs Found",
      value: String(stats.totalJobs),
      ...trend(stats.jobsThisWeek, stats.jobsLastWeek),
    },
    {
      label: "Avg. Match Rate",
      value: stats.averageMatchScore === null ? "—" : `${Math.round(stats.averageMatchScore)}%`,
      ...trend(stats.averageMatchScoreThisWeek, stats.averageMatchScoreLastWeek),
    },
    {
      label: "Companies Researched",
      value: String(stats.companiesResearched),
      ...trend(stats.companiesResearchedThisWeek, stats.companiesResearchedLastWeek),
    },
    {
      label: "Jobs This Week",
      value: String(stats.jobsThisWeek),
      ...trend(stats.jobsThisWeek, stats.jobsLastWeek),
    },
  ];
}

function trend(current: number | null, previous: number | null) {
  if (current === null || previous === null) {
    return { change: null, detail: "No score data yet", trendTone: "neutral" as const };
  }
  if (previous === 0) {
    return current > 0
      ? { change: "New", detail: "this week", trendTone: "positive" as const }
      : { change: null, detail: "No change this week", trendTone: "neutral" as const };
  }
  const percentage = Math.round(((current - previous) / previous) * 100);
  if (percentage === 0) return { change: null, detail: "No change vs last week", trendTone: "neutral" as const };
  return {
    change: `${percentage > 0 ? "+" : "−"}${Math.abs(percentage)}%`,
    detail: "vs last week",
    trendTone: percentage > 0 ? "positive" as const : "negative" as const,
  };
}

function ChartCard({ children, tall = false, title }: { children: React.ReactNode; tall?: boolean; title: string }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      <div className={`mt-6 ${tall ? "h-72" : "h-64"}`}>{children}</div>
    </article>
  );
}
