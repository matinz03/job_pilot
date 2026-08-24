"use client";

import { type ChangeEvent, type FormEvent, type KeyboardEvent, useRef, useState } from "react";

type ProfileFormProps = {
  email: string;
};

type Experience = {
  id: number;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
};

const initialExperience: Experience = {
  id: 1,
  company: "Vercel",
  title: "Frontend Engineer",
  startDate: "January 2022",
  endDate: "",
  current: true,
  responsibilities: "Built Next.js features and optimized web vitals. Led a team of 3 developers.",
};

const fieldClassName =
  "mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-surface-secondary disabled:text-text-muted";
const labelClassName = "text-xs font-semibold uppercase tracking-wide text-text-dark";

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-9 w-9 text-accent" fill="none" viewBox="0 0 24 24">
      <path d="M7 18a4 4 0 0 1-.8-7.9A6 6 0 0 1 17.8 9 3.5 3.5 0 1 1 18.5 16H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m12 11-3 3m3-3 3 3m-3-3v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M7 3h7l4 4v14H7zM14 3v5h5M10 13h4m-4 4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CompletionRing() {
  return (
    <div className="relative grid h-32 w-32 place-items-center rounded-full bg-error/10 p-3">
      <div className="absolute inset-0 rounded-full border-[14px] border-error/15 border-t-error border-r-error" />
      <span className="relative text-4xl font-semibold tracking-tight text-text-primary">70%</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight text-text-primary">{children}</h2>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className={labelClassName}>{label}</span>
      {children}
    </label>
  );
}

export function ProfileForm({ email }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeName, setResumeName] = useState("");
  const [skills, setSkills] = useState(["React", "TypeScript", "Next.js", "Tailwind CSS"]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([initialExperience]);

  function addTag(kind: "skill" | "industry") {
    const value = (kind === "skill" ? skillInput : industryInput).trim();
    if (!value) return;

    const setTags = kind === "skill" ? setSkills : setIndustries;
    setTags((tags) => (tags.includes(value) ? tags : [...tags, value]));
    if (kind === "skill") {
      setSkillInput("");
    } else {
      setIndustryInput("");
    }
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>, kind: "skill" | "industry") {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(kind);
    }
  }

  function handleResumeChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setResumeName(file?.name ?? "");
  }

  function addRole() {
    setExperiences((current) =>
      current.length === 3
        ? current
        : [
            ...current,
            {
              id: Date.now(),
              company: "",
              title: "",
              startDate: "",
              endDate: "",
              current: false,
              responsibilities: "",
            },
          ],
    );
  }

  function updateExperience(id: number, field: keyof Experience, value: string | boolean) {
    setExperiences((current) =>
      current.map((experience) =>
        experience.id === id ? { ...experience, [field]: value } : experience,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="mx-auto max-w-[880px] space-y-6" onSubmit={handleSubmit}>
      <section className="flex flex-col gap-6 rounded-2xl border border-error/25 bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-error text-sm font-bold text-error">!</span>
            <SectionTitle>Profile needs attention</SectionTitle>
          </div>
          <p className="mt-3 max-w-[520px] text-base leading-7 text-text-dark">
            Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Phone", "Location", "Education"].map((item) => (
              <span className="rounded-sm bg-error/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-error" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <CompletionRing />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-10">
        <SectionTitle>Resume</SectionTitle>
        <p className="mt-1 text-base text-text-secondary">
          Upload an existing resume to auto-fill the profile, or generate a new tailored one from your details below.
        </p>
        <input accept="application/pdf" className="sr-only" onChange={handleResumeChange} ref={fileInputRef} type="file" />
        <div className="mt-7 grid min-h-80 place-items-center rounded-xl border-2 border-dashed border-border bg-surface-secondary px-6 py-10 text-center">
          <div>
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface shadow-card"><UploadIcon /></div>
            <p className="mt-5 text-xl font-semibold text-text-primary">Click to upload or drag and drop</p>
            <p className="mt-2 text-base text-text-secondary">PDF formatting only. Maximum file size 5MB.</p>
            {resumeName && <p className="mt-3 text-sm font-medium text-accent">{resumeName} selected</p>}
            <button className="mt-7 rounded-md border border-border bg-surface px-5 py-2.5 text-base font-medium text-text-dark shadow-button transition-colors hover:bg-surface-secondary" onClick={() => fileInputRef.current?.click()} type="button">
              Select Resume
            </button>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-text-secondary">Need a fresh document based on the fields below?</p>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-base font-semibold text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover" type="button">
            <DocumentIcon /> Generate Resume from Profile
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-10">
        <SectionTitle>Profile Information</SectionTitle>
        <p className="mt-1 text-base text-text-secondary">This context is used to accurately represent you in agent interactions.</p>
        <div className="mt-6 border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-text-primary">Personal Info</h3>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field label="Full Name"><input className={fieldClassName} defaultValue="Faizan Ali" /></Field>
            <Field label="Email"><input className={fieldClassName} defaultValue={email} disabled /></Field>
            <Field label="Phone Number"><input className={fieldClassName} placeholder="+1 (555) 000-0000" /></Field>
            <Field label="Location"><input className={fieldClassName} placeholder="City, Country" /></Field>
            <Field label="LinkedIn URL"><input className={fieldClassName} defaultValue="https://linkedin.com/in/faizan" /></Field>
            <Field label="Portfolio / GitHub"><input className={fieldClassName} defaultValue="https://github.com/jsmastery" /></Field>
            <Field label="Work Authorization"><select className={fieldClassName} defaultValue="Citizen"><option>Citizen</option><option>Permanent resident</option><option>Visa required</option></select></Field>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-text-primary">Professional Info</h3>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field label="Current/Recent Job Title"><input className={`${fieldClassName} md:col-span-2`} defaultValue="Frontend Engineer" /></Field>
            <Field label="Experience Level"><select className={fieldClassName} defaultValue="Junior"><option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead</option></select></Field>
            <Field label="Years of Experience"><input className={fieldClassName} defaultValue="4" min="0" type="number" /></Field>
          </div>
          <div className="mt-5"><TagInput add={() => addTag("skill")} input={skillInput} label="Skills" onChange={setSkillInput} onKeyDown={(event) => handleTagKeyDown(event, "skill")} remove={(tag) => setSkills((current) => current.filter((item) => item !== tag))} tags={skills} /></div>
          <div className="mt-5"><TagInput add={() => addTag("industry")} input={industryInput} label="Industries Worked In (Optional)" onChange={setIndustryInput} onKeyDown={(event) => handleTagKeyDown(event, "industry")} placeholder="E.g. FinTech, Healthcare" remove={(tag) => setIndustries((current) => current.filter((item) => item !== tag))} tags={industries} /></div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between gap-4"><h3 className="text-lg font-semibold text-text-primary">Work Experience</h3><button className="text-sm font-semibold text-accent hover:text-accent-dark disabled:text-text-muted" disabled={experiences.length === 3} onClick={addRole} type="button">+ Add role</button></div>
          <div className="mt-6 space-y-5">
            {experiences.map((experience) => <ExperienceCard experience={experience} key={experience.id} update={updateExperience} />)}
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-text-primary">Education</h3>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field label="Highest Degree"><select className={fieldClassName} defaultValue="High School"><option>High School</option><option>Associate Degree</option><option>Bachelor&apos;s Degree</option><option>Master&apos;s Degree</option><option>Doctorate</option></select></Field>
            <Field label="Field of Study"><input className={fieldClassName} defaultValue="Computer Science" /></Field>
            <Field label="Institution Name"><input className={fieldClassName} placeholder="E.g. State University" /></Field>
            <Field label="Graduation Year"><input className={fieldClassName} placeholder="YYYY" /></Field>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-lg font-semibold text-text-primary">Job Preferences</h3>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field label="Job Titles Seeking"><input className={`${fieldClassName} md:col-span-2`} defaultValue="Frontend Engineer, React Developer" /></Field>
            <Field label="Remote Preference"><select className={fieldClassName} defaultValue="Any"><option>Any</option><option>Remote only</option><option>Hybrid</option><option>On-site</option></select></Field>
            <Field label="Salary Expectation (Optional)"><input className={fieldClassName} placeholder="E.g. $120k+" /></Field>
            <Field label="Preferred Locations (Optional)"><input className={`${fieldClassName} md:col-span-2`} placeholder="E.g. New York, London" /></Field>
          </div>
        </div>
        <button className="mt-10 w-full rounded-md bg-accent px-4 py-3 text-base font-semibold text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover" type="submit">Save Profile</button>
      </section>
    </form>
  );
}

function TagInput({ add, input, label, onChange, onKeyDown, placeholder = "Add a skill", remove, tags }: { add: () => void; input: string; label: string; onChange: (value: string) => void; onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; placeholder?: string; remove: (tag: string) => void; tags: string[] }) {
  return (
    <div>
      <span className={labelClassName}>{label}</span>
      <div className="mt-2 flex gap-3"><input className={fieldClassName.replace("mt-2 ", "mt-0 ")} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} value={input} /><button className="rounded-md bg-surface-tertiary px-4 py-2 text-sm font-semibold text-text-dark transition-colors hover:bg-border" onClick={add} type="button">Add</button></div>
      {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm font-medium text-text-primary" key={tag}>{tag}<button aria-label={`Remove ${tag}`} className="text-text-secondary hover:text-text-primary" onClick={() => remove(tag)} type="button">×</button></span>)}</div>}
    </div>
  );
}

function ExperienceCard({ experience, update }: { experience: Experience; update: (id: number, field: keyof Experience, value: string | boolean) => void }) {
  return (
    <article className="rounded-xl border border-border bg-surface-secondary p-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Company Name"><input className={fieldClassName} onChange={(event) => update(experience.id, "company", event.target.value)} value={experience.company} /></Field>
        <Field label="Job Title"><input className={fieldClassName} onChange={(event) => update(experience.id, "title", event.target.value)} value={experience.title} /></Field>
        <Field label="Start Date"><input className={fieldClassName} onChange={(event) => update(experience.id, "startDate", event.target.value)} placeholder="Month YYYY" value={experience.startDate} /></Field>
        <Field label="End Date"><input className={fieldClassName} disabled={experience.current} onChange={(event) => update(experience.id, "endDate", event.target.value)} placeholder="Month YYYY" value={experience.endDate} /></Field>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-text-dark"><input checked={experience.current} className="h-4 w-4 accent-accent" onChange={(event) => update(experience.id, "current", event.target.checked)} type="checkbox" />Currently working here</label>
      <Field label="Key Responsibilities"><textarea className={`${fieldClassName} min-h-28 resize-y`} onChange={(event) => update(experience.id, "responsibilities", event.target.value)} value={experience.responsibilities} /></Field>
    </article>
  );
}
