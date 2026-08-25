import Link from "next/link";
import { CompanyIcon } from "@/components/find-jobs/icons";
import { matchBarClassName } from "@/lib/match-score";
import type { JobListItem } from "@/types";

type JobsTableProps = { jobs: JobListItem[]; emptyMessage: string };

const headerCellClassName = "px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-text-secondary";

// The design's five columns, rebalanced to fit Location. Company and Role give up the width,
// since they are the two that were widest to begin with.
const columnWidths = ["w-[19%]", "w-[24%]", "w-[16%]", "w-[15%]", "w-[14%]", "w-[12%]"] as const;

function MatchScore({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="block h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <span className={`block h-full rounded-full ${matchBarClassName(score)}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </span>
      <span className="text-sm font-semibold text-text-primary">{score}%</span>
    </span>
  );
}

export function JobsTable({ emptyMessage, jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className={`${headerCellClassName} ${columnWidths[0]}`} scope="col">Company</th>
          <th className={`${headerCellClassName} ${columnWidths[1]}`} scope="col">Role</th>
          <th className={`${headerCellClassName} ${columnWidths[2]}`} scope="col">Location</th>
          <th className={`${headerCellClassName} ${columnWidths[3]}`} scope="col">Match Score</th>
          <th className={`${headerCellClassName} ${columnWidths[4]}`} scope="col">Salary Est.</th>
          <th className={`${headerCellClassName} ${columnWidths[5]}`} scope="col">Date Found</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-secondary" key={job.id}>
            <td className="px-6 py-4">
              <span className="flex items-center gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-secondary">
                  <CompanyIcon />
                </span>
                <Link className="text-sm font-semibold text-text-primary hover:text-accent" href={`/find-jobs/${job.id}`}>
                  {job.company}
                </Link>
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-text-primary">{job.role}</td>
            <td className="px-6 py-4 text-sm text-text-secondary">{job.location}</td>
            <td className="px-6 py-4"><MatchScore score={job.matchScore} /></td>
            <td className="px-6 py-4 text-sm text-text-primary">{job.salary}</td>
            <td className="px-6 py-4 text-sm text-text-secondary">{job.foundAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
