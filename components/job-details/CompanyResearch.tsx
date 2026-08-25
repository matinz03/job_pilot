import { BuildingIcon, SearchIcon } from "@/components/job-details/icons";

export function CompanyResearch({ company }: { company: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-light text-accent">
            <BuildingIcon />
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">Company Research</h2>
        </div>
        {/* Wired in Feature 13, which is what actually runs the research agent. */}
        <button
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-button"
          disabled
          title="Company research arrives with the research agent."
          type="button"
        >
          <SearchIcon /> Research Company
        </button>
      </div>

      <div className="border-t border-border px-6 py-16 text-center sm:px-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-secondary text-text-muted">
          <BuildingIcon className="h-6 w-6" />
        </span>
        <p className="mt-5 text-base font-medium text-text-primary">No research yet</p>
        <p className="mx-auto mt-2 max-w-[360px] text-base leading-7 text-text-muted">
          Click &ldquo;Research Company&rdquo; to let the AI browse {company}&apos;s public pages and build a dossier.
        </p>
      </div>
    </section>
  );
}
