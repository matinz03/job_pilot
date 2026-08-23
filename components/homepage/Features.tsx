import Image from "next/image";
import Link from "next/link";

const confidencePoints = [
  {
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what’s missing.",
    title: "Understand your match score",
  },
  {
    description:
      "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
    title: "AI-Powered Job Matching",
  },
  {
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
    title: "Focus on the right roles",
  },
];

export function Features() {
  return (
    <>
      <div className="section-divider" aria-hidden="true" />
      <section className="grid border-x border-b border-border lg:grid-cols-2" aria-labelledby="confidence-heading">
        <div className="flex items-center bg-surface-tertiary p-6 sm:p-10 lg:p-16">
          <Image
            className="h-auto w-full"
            src="/images/agnet-log.png"
            alt="JobPilot agent activity log"
            width={1072}
            height={828}
          />
        </div>
        <div className="bg-surface">
          <div className="min-h-64 border-b border-border p-8 sm:p-12 lg:min-h-[400px] lg:p-16">
            <h2
              id="confidence-heading"
              className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-text-slate sm:text-5xl lg:text-[60px] lg:leading-[1.05]"
            >
              Apply With More Confidence, Every Time
            </h2>
          </div>
          {confidencePoints.map((point, index) => (
            <article
              className={`border-b border-border px-8 py-7 sm:px-12 lg:px-16 ${index === 1 ? "border-l-2 border-l-success" : "border-l-2 border-l-transparent"}`}
              key={point.title}
            >
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-text-slate">
                {point.title}
              </h3>
              <p className="mt-3 max-w-xl text-lg leading-8 text-text-secondary">
                {point.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" />
      <section className="border-x border-b border-border bg-surface px-6 py-20 text-center sm:px-10 lg:px-24 lg:py-28" aria-labelledby="testimonial-heading">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-accent">Success Stories</p>
        <blockquote id="testimonial-heading" className="mx-auto mt-8 max-w-5xl text-3xl font-medium tracking-[-0.03em] text-text-darker sm:text-4xl sm:leading-[1.35] lg:text-[44px]">
          “I used to spend my evenings copy-pasting resumes. Now I open my dashboard to see interviews waiting. It feels like cheating. Had 3 offers on the table simultaneously.”
        </blockquote>
        <div className="mt-9 flex items-center justify-center gap-3 text-left">
          <Image
            className="rounded-md border border-border"
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={56}
            height={56}
          />
          <div>
            <p className="font-semibold text-text-black">Tom Wilson</p>
            <p className="mt-1 text-sm text-text-secondary">Junior Developer</p>
          </div>
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" />
      <section className="hero-glow border-x border-b border-border px-6 py-20 text-center sm:px-10 lg:px-16 lg:py-24" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-text-slate sm:text-5xl lg:text-[64px] lg:leading-[1.08]">
          Your next job search can feel a lot less overwhelming
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-text-dark lg:text-xl">
          Set up your profile, upload your resume, and start finding matches in minutes.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-md bg-overlay px-5 py-3 text-base font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover"
            href="/login"
          >
            Get Started <span aria-hidden="true" className="text-sm text-text-muted">▶</span>
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface/70 px-5 py-3 text-base font-medium text-text-slate shadow-button transition-all hover:-translate-y-0.5 hover:bg-surface hover:shadow-button-hover"
            href="/login"
          >
            Find Your First Match
          </Link>
        </div>
      </section>
      <div className="section-divider" aria-hidden="true" />
    </>
  );
}
