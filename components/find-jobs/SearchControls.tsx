import { SearchIcon, SparkleIcon } from "@/components/find-jobs/icons";

type SearchControlsProps = { resultMessage?: string };

const labelClassName = "text-xs font-semibold uppercase tracking-wide text-text-dark";
const inputClassName = "w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent";

export function SearchControls({ resultMessage }: SearchControlsProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block">
          <span className={labelClassName}>Job Title</span>
          <span className="relative mt-2 block">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-muted">
              <SearchIcon />
            </span>
            <input className={inputClassName} name="jobTitle" placeholder="Frontend Engineer" type="text" />
          </span>
        </label>

        <label className="block">
          <span className={labelClassName}>Location</span>
          <span className="relative mt-2 block">
            <input className={`${inputClassName} pl-4`} name="location" placeholder="Remote, New York..." type="text" />
          </span>
        </label>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover"
          type="button"
        >
          <SearchIcon /> Find Jobs
        </button>
      </div>

      {resultMessage && (
        <p className="mt-5 flex items-center gap-3 rounded-lg bg-success-lightest px-5 py-4 text-sm font-medium text-success-dark">
          <span className="text-success-alt"><SparkleIcon /></span>
          {resultMessage}
        </p>
      )}
    </section>
  );
}
