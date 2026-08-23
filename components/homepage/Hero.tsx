import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="overflow-hidden border border-border" aria-labelledby="hero-heading">
      <div className="hero-glow px-6 py-20 text-center sm:px-10 lg:px-16 lg:py-24">
        <h1
          id="hero-heading"
          className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-text-slate sm:text-5xl lg:text-[64px] lg:leading-[1.08]"
        >
          Job hunting is hard.
          <br />
          Your tools shouldn&apos;t be.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-text-secondary lg:text-xl">
          Stop applying blind. JobPilot finds the jobs, researches the companies,
          and gives you everything you need to stand out.
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
      </div>
      <div className="bg-surface-tertiary px-4 py-12 sm:px-8 lg:px-16 lg:py-16">
        <Image
          className="mx-auto w-full max-w-[1240px]"
          src="/images/dashboard-demo.png"
          alt="JobPilot dashboard preview"
          width={2394}
          height={1208}
          priority
        />
      </div>
    </section>
  );
}
