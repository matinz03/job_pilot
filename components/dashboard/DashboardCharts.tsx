"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsChart, DailyChartPoint, ScoreChartPoint } from "@/lib/dashboard-analytics";

const axisTick = { fill: "var(--color-text-muted)", fontSize: 12 };
const gridStroke = "var(--color-border)";
const tooltipContentStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-card)",
};
const tooltipItemStyle = { color: "var(--color-text-primary)" };
const tooltipLabelStyle = { color: "var(--color-text-secondary)" };

function ChartState({ status }: { status: AnalyticsChart<unknown>['status'] }) {
  if (status === "ready") return null;
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-surface-secondary px-5 text-center text-sm text-text-secondary">
      {status === "empty" ? "No data yet" : "Analytics unavailable — try again later."}
    </div>
  );
}

export function CompanyResearchChart({ chart }: { chart: AnalyticsChart<DailyChartPoint> }) {
  if (chart.status !== "ready") return <ChartState status={chart.status} />;
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={chart.data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" vertical={false} />
        <XAxis axisLine={false} dataKey="day" tick={axisTick} tickLine={false} />
        <YAxis allowDecimals={false} axisLine={false} tick={axisTick} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [Number(value).toLocaleString(), "Researches"]} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
        <Bar dataKey="value" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function JobsFoundChart({ chart }: { chart: AnalyticsChart<DailyChartPoint> }) {
  if (chart.status !== "ready") return <ChartState status={chart.status} />;
  return (
    <ResponsiveContainer height="100%" width="100%">
      <AreaChart data={chart.data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="jobsFoundGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" vertical={false} />
        <XAxis axisLine={false} dataKey="day" tick={axisTick} tickLine={false} />
        <YAxis axisLine={false} tick={axisTick} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [Number(value).toLocaleString(), "Jobs found"]} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
        <Area dataKey="value" fill="url(#jobsFoundGradient)" stroke="var(--color-accent)" strokeWidth={3} type="monotone" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MatchScoreChart({ chart }: { chart: AnalyticsChart<ScoreChartPoint> }) {
  if (chart.status !== "ready") return <ChartState status={chart.status} />;
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={chart.data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" vertical={false} />
        <XAxis axisLine={false} dataKey="score" tick={axisTick} tickLine={false} />
        <YAxis axisLine={false} tick={axisTick} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [Number(value).toLocaleString(), "Jobs"]} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
        <Bar dataKey="value" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
