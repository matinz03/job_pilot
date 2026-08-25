import Link from "next/link";
import { deleteSearchRun } from "@/actions/jobs";
import { DeleteAction } from "@/components/find-jobs/DeleteAction";

type RunScopeNoticeProps = {
  jobTitle: string;
  location: string;
  total: number;
  runId: string;
};

export function RunScopeNotice({ jobTitle, location, runId, total }: RunScopeNoticeProps) {
  const searched = [jobTitle, location].filter(Boolean).join(" in ");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-surface-secondary px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-dark">
        <span className="font-semibold text-text-primary">
          {total} {total === 1 ? "job" : "jobs"}
        </span>{" "}
        {searched ? <>from your search for <span className="font-semibold text-text-primary">{searched}</span>.</> : "from your last search."}{" "}
        Your other saved jobs are hidden.
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Link
          className="shrink-0 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-surface-secondary"
          href="/find-jobs"
        >
          View all jobs
        </Link>
        {total > 0 && (
          <DeleteAction
            action={deleteSearchRun.bind(null, runId)}
            count={total}
            idleLabel="Delete this search"
            redirectTo="/find-jobs"
          />
        )}
      </div>
    </div>
  );
}
