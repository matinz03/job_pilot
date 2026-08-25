"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const companyResearchData = [
  { day: "Mon", researches: 2 },
  { day: "Tue", researches: 5 },
  { day: "Wed", researches: 3 },
  { day: "Thu", researches: 8 },
  { day: "Fri", researches: 12 },
  { day: "Sat", researches: 4 },
  { day: "Sun", researches: 1 },
];

const jobsFoundData = [
  { day: "Mon", jobs: 12 },
  { day: "Tue", jobs: 45 },
  { day: "Wed", jobs: 32 },
  { day: "Thu", jobs: 60 },
  { day: "Fri", jobs: 85 },
  { day: "Sat", jobs: 40 },
  { day: "Sun", jobs: 10 },
];

const scoreDistributionData = [
  { score: "50–60%", jobs: 5 },
  { score: "60–70%", jobs: 15 },
  { score: "70–80%", jobs: 45 },
  { score: "80–90%", jobs: 85 },
  { score: "90–100%", jobs: 35 },
];

const axisTick = { fill: "var(--color-text-muted)", fontSize: 12 };
const gridStroke = "var(--color-border)";

export function CompanyResearchChart() {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={companyResearchData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" vertical={false} />
        <XAxis axisLine={false} dataKey="day" tick={axisTick} tickLine={false} />
        <YAxis allowDecimals={false} axisLine={false} tick={axisTick} tickLine={false} />
        <Bar dataKey="researches" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function JobsFoundChart() {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <AreaChart data={jobsFoundData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="jobsFoundGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" vertical={false} />
        <XAxis axisLine={false} dataKey="day" tick={axisTick} tickLine={false} />
        <YAxis axisLine={false} tick={axisTick} tickLine={false} />
        <Area dataKey="jobs" fill="url(#jobsFoundGradient)" stroke="var(--color-accent)" strokeWidth={3} type="monotone" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MatchScoreChart() {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={scoreDistributionData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" vertical={false} />
        <XAxis axisLine={false} dataKey="score" tick={axisTick} tickLine={false} />
        <YAxis axisLine={false} tick={axisTick} tickLine={false} />
        <Bar dataKey="jobs" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
