import Image from "next/image";

const jobSearchPoints = [
  {
    description:
      "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
    title: "Find jobs that actually fit",
  },
  {
    description:
      "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
    title: "Know the Company Before You Apply",
  },
  {
    description:
      "Keep a clear view of every job you’ve found, tailored. Your activity and progress all stay in one simple place.",
    title: "Keep track of every application",
  },
];

export function HowItWorks() {
  return (
    <section className="grid border-x border-b border-border lg:grid-cols-2" aria-labelledby="search-heading">
      <div className="flex flex-col border-b border-border bg-surface lg:border-r lg:border-b-0">
        <div className="min-h-64 p-8 sm:p-12 lg:min-h-[500px] lg:p-16">
          <h2
            id="search-heading"
            className="max-w-md text-4xl font-semibold tracking-[-0.04em] text-text-slate sm:text-5xl lg:text-[60px] lg:leading-[1.05]"
          >
            Manage Your Job Search With Ease
          </h2>
        </div>
        <div>
          {jobSearchPoints.map((point, index) => (
            <article
              className={`border-t border-border px-8 py-7 sm:px-12 lg:px-16 ${index === 0 ? "border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}`}
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
      </div>
      <div className="flex items-center bg-surface-tertiary p-6 sm:p-10 lg:p-16">
        <Image
          className="h-auto w-full"
          src="/images/jobs-lists.png"
          alt="Job list with match scores"
          width={1182}
          height={889}
        />
      </div>
    </section>
  );
}
