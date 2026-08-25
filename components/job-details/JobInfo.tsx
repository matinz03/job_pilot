import type { ReactNode } from "react";
import { matchBadgeClassName } from "@/lib/match-score";
import { BuildingIcon, CalendarIcon, JobTypeIcon, LocationIcon, SalaryIcon } from "@/components/job-details/icons";

type JobInfoProps = {
  title: string;
  company: string;
  matchScore: number;
  salary: string;
  location: string;
  jobType: string;
  foundAt: string;
  action?: ReactNode;
};

function InfoCard({ icon, iconClassName, label, value }: { icon: ReactNode; iconClassName: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-card">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${iconClassName}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-text-primary">{value}</span>
        <span className="block text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      </span>
    </div>
  );
}

export function JobInfo({ action, company, foundAt, jobType, location, matchScore, salary, title }: JobInfoProps) {
  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-surface-secondary text-text-muted">
              <BuildingIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-base text-text-secondary">
                {company}
                <span aria-hidden="true" className="text-text-muted">•</span>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${matchBadgeClassName(matchScore)}`}>
                  {matchScore}% Match Score
                </span>
              </p>
            </div>
          </div>
          {action}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<SalaryIcon />} iconClassName="bg-success-light text-success-dark" label="Salary Est." value={salary} />
        <InfoCard icon={<LocationIcon />} iconClassName="bg-info-light text-info-dark" label="Location" value={location} />
        <InfoCard icon={<JobTypeIcon />} iconClassName="bg-accent-light text-accent" label="Job Type" value={jobType} />
        <InfoCard icon={<CalendarIcon />} iconClassName="bg-surface-secondary text-text-secondary" label="Date Found" value={foundAt} />
      </div>
    </>
  );
}
