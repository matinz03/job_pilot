import { ExternalLinkIcon } from "@/components/job-details/icons";

type JobActionsProps = { company: string; applyUrl: string };

export function ViewJobPostButton({ applyUrl }: { applyUrl: string }) {
  if (!applyUrl) return null;

  return (
    <a
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium text-text-dark shadow-button transition-colors hover:bg-surface-secondary"
      href={applyUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ExternalLinkIcon /> View Job Post
    </a>
  );
}

export function ApplyNowButton({ applyUrl, company }: JobActionsProps) {
  if (!applyUrl) return null;

  return (
    <a
      className="block rounded-xl bg-accent px-6 py-4 text-center text-base font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover"
      href={applyUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      Apply Now at {company}
    </a>
  );
}
