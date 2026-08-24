import { ChevronDownIcon, SearchIcon } from "@/components/find-jobs/icons";

const dropdownClassName = "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary";

export function JobFilters() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:gap-0">
      <label className="relative flex-1">
        <span className="sr-only">Filter by company or role</span>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
          <SearchIcon />
        </span>
        <input
          className="w-full bg-surface py-2.5 pl-11 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted"
          name="jobFilter"
          placeholder="Filter by company or role..."
          type="text"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 sm:border-l sm:border-border sm:pl-4">
        <button className={dropdownClassName} type="button">
          All Matches <ChevronDownIcon />
        </button>
        <button className={dropdownClassName} type="button">
          Match Score <ChevronDownIcon />
        </button>
      </div>
    </section>
  );
}
