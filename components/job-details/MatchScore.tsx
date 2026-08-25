import { CheckIcon, CrossIcon, SparkleIcon } from "@/components/job-details/icons";

type MatchScoreProps = {
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export function MatchScore({ matchReason, matchedSkills, missingSkills }: MatchScoreProps) {
  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success-light text-success-dark">
            <SparkleIcon />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">AI Match Reasoning</h2>
        </div>
        <p className="mt-6 text-base leading-7 text-text-primary">
          {matchReason || "This job has not been scored with a written explanation yet."}
        </p>
      </section>

      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Required Skills vs Your Profile</h2>

          {matchedSkills.length > 0 && (
            <>
              <p className="mt-6 text-sm text-text-muted">You have</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {matchedSkills.map((skill) => (
                  <li className="flex items-center gap-2 rounded-full bg-success-light px-3 py-1.5 text-sm font-medium text-success-dark" key={skill}>
                    <CheckIcon /> {skill}
                  </li>
                ))}
              </ul>
            </>
          )}

          {missingSkills.length > 0 && (
            <>
              <p className="mt-6 text-sm text-text-muted">Gap skills</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <li className="flex items-center gap-2 rounded-full bg-accent-light px-3 py-1.5 text-sm font-medium text-accent" key={skill}>
                    <CrossIcon /> {skill}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}
