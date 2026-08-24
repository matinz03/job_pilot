type JobsPaginationProps = {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  pages: (number | "gap")[];
};

const pageButtonClassName = "min-w-10 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors";

export function JobsPagination({ currentPage, from, pages, to, total }: JobsPaginationProps) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === pages.filter((page): page is number => page !== "gap").at(-1);

  return (
    <div className="flex flex-col gap-4 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Showing <strong className="font-semibold text-text-primary">{from}</strong> to{" "}
        <strong className="font-semibold text-text-primary">{to}</strong> of{" "}
        <strong className="font-semibold text-text-primary">{total}</strong> results
      </p>

      <nav aria-label="Jobs pagination" className="flex flex-wrap items-center gap-2">
        <button
          className={`${pageButtonClassName} border-border bg-surface text-text-dark hover:bg-surface-secondary disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-surface`}
          disabled={isFirstPage}
          type="button"
        >
          Previous
        </button>

        {pages.map((page, index) =>
          page === "gap" ? (
            <span className="px-2 text-sm text-text-muted" key={`gap-${index}`}>...</span>
          ) : (
            <button
              aria-current={page === currentPage ? "page" : undefined}
              className={`${pageButtonClassName} ${
                page === currentPage
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-border bg-surface text-text-dark hover:bg-surface-secondary"
              }`}
              key={page}
              type="button"
            >
              {page}
            </button>
          ),
        )}

        <button
          className={`${pageButtonClassName} border-border bg-surface text-text-dark hover:bg-surface-secondary disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-surface`}
          disabled={isLastPage}
          type="button"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
