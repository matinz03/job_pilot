import Link from "next/link";
import { CompanyIcon } from "@/components/find-jobs/icons";
import type { JobListItem } from "@/types";

type JobsTableProps = { jobs: JobListItem[] };

const headerCellClassName = "px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-text-secondary";

// Column proportions are taken from the design so the five columns line up the same way.
const columnWidths = ["w-[22%]", "w-[29%]", "w-[17%]", "w-[18%]", "w-[14%]"] as const;

// The design bands the bar by score: green from 90, blue from 80, orange below.
function scoreClassName(score: number): string {
  if (score >= 90) return "bg-success";
  if (score >= 80) return "bg-info";
  return "bg-warning";
}

function MatchScore({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="block h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <span className={`block h-full rounded-full ${scoreClassName(score)}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </span>
      <span className="text-sm font-semibold text-text-primary">{score}%</span>
    </span>
  );
}

export function JobsTable({ jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm text-text-muted">No jobs yet. Run a search to start matching roles to your profile.</p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className={`${headerCellClassName} ${columnWidths[0]}`} scope="col">Company</th>
          <th className={`${headerCellClassName} ${columnWidths[1]}`} scope="col">Role</th>
          <th className={`${headerCellClassName} ${columnWidths[2]}`} scope="col">Match Score</th>
          <th className={`${headerCellClassName} ${columnWidths[3]}`} scope="col">Salary Est.</th>
          <th className={`${headerCellClassName} ${columnWidths[4]}`} scope="col">Date Found</th>
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
            <td className="px-6 py-4"><MatchScore score={job.matchScore} /></td>
            <td className="px-6 py-4 text-sm text-text-primary">{job.salary}</td>
            <td className="px-6 py-4 text-sm text-text-secondary">{job.foundAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
