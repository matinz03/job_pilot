import { DocumentIcon } from "@/components/job-details/icons";

export function JobDescription({ description }: { description: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-secondary text-text-secondary">
          <DocumentIcon />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Job Description</h2>
      </div>
      <p className="mt-6 whitespace-pre-line text-base leading-7 text-text-primary">
        {description || "Adzuna did not provide a description for this posting. Open the job post to read it in full."}
      </p>
    </section>
  );
}
