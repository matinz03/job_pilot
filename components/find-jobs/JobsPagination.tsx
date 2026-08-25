import Link from "next/link";
import { buildJobsHref, buildPageList, type JobSearchParams } from "@/lib/job-filters";

type JobsPaginationProps = {
  from: number;
  to: number;
  total: number;
  totalPages: number;
  params: JobSearchParams;
};

const controlClassName = "min-w-10 rounded-md border px-3.5 py-2 text-center text-sm font-medium transition-colors";
const enabledClassName = "border-border bg-surface text-text-dark hover:bg-surface-secondary";
const disabledClassName = "border-border bg-surface text-text-muted cursor-not-allowed";

function Step({ label, page, params, disabled }: { label: string; page: number; params: JobSearchParams; disabled: boolean }) {
  if (disabled) {
    return <span aria-disabled="true" className={`${controlClassName} ${disabledClassName}`}>{label}</span>;
  }
  return (
    <Link className={`${controlClassName} ${enabledClassName}`} href={buildJobsHref({ ...params, page })} scroll={false}>
      {label}
    </Link>
  );
}

export function JobsPagination({ from, params, to, total, totalPages }: JobsPaginationProps) {
  const pages = buildPageList(params.page, totalPages);

  return (
    <div className="flex flex-col gap-4 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Showing <strong className="font-semibold text-text-primary">{from}</strong> to{" "}
        <strong className="font-semibold text-text-primary">{to}</strong> of{" "}
        <strong className="font-semibold text-text-primary">{total}</strong> results
      </p>

      <nav aria-label="Jobs pagination" className="flex flex-wrap items-center gap-2">
        <Step disabled={params.page <= 1} label="Previous" page={params.page - 1} params={params} />

        {pages.map((page, index) =>
          page === "gap" ? (
            <span className="px-2 text-sm text-text-muted" key={`gap-${index}`}>...</span>
          ) : page === params.page ? (
            <span aria-current="page" className={`${controlClassName} border-accent bg-accent-muted text-accent`} key={page}>
              {page}
            </span>
          ) : (
            <Link
              className={`${controlClassName} ${enabledClassName}`}
              href={buildJobsHref({ ...params, page })}
              key={page}
              scroll={false}
            >
              {page}
            </Link>
          ),
        )}

        <Step disabled={params.page >= totalPages} label="Next" page={params.page + 1} params={params} />
      </nav>
    </div>
  );
}
