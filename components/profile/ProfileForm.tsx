"use client";

import { cloneElement, createContext, isValidElement, startTransition, useActionState, useContext, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { saveProfile, type ProfileActionState } from "@/actions/profile";
import type { ProfileFormValues, WorkExperience } from "@/lib/profile";
import type { ProfileFieldErrors } from "@/lib/profile-validation";

type ProfileFormProps = { initialProfile: ProfileFormValues };
type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type PendingSave = { field: FormField | null; isResumeUpload: boolean };

const initialProfileActionState: ProfileActionState = {
  status: "idle",
  message: "",
  completionPercentage: 0,
  missingFields: [],
  fieldErrors: {},
};

const fieldClassName = "mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-surface-secondary disabled:text-text-muted";
const labelClassName = "text-xs font-semibold uppercase tracking-wide text-text-dark";
const ProfileErrorsContext = createContext<ProfileFieldErrors>({});
const fieldByLabel: Record<string, string> = {
  "Full Name": "fullName", "Phone Number": "phone", Location: "location", "LinkedIn URL": "linkedinUrl", "Portfolio / GitHub": "portfolioUrl", "Work Authorization": "workAuthorization", "Current/Recent Job Title": "currentTitle", "Experience Level": "experienceLevel", "Years of Experience": "yearsExperience", "Highest Degree": "education.degree", "Field of Study": "education.fieldOfStudy", "Institution Name": "education.institution", "Graduation Year": "education.graduationYear", "Job Titles Seeking": "jobTitlesSeeking", "Remote Preference": "remotePreference", "Salary Expectation (Optional)": "salaryExpectation", "Preferred Locations (Optional)": "preferredLocations", "Cover Letter Tone (Optional)": "coverLetterTone",
};
const workFieldByLabel: Record<string, string> = { "Company Name": "company", "Job Title": "title", "Start Date": "startDate", "End Date": "endDate", "Key Responsibilities": "responsibilities" };

function UploadIcon() {
  return <svg aria-hidden="true" className="h-9 w-9 text-accent" fill="none" viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.8-7.9A6 6 0 0 1 17.8 9 3.5 3.5 0 1 1 18.5 16H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><path d="m12 11-3 3m3-3 3 3m-3-3v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

function DocumentIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7zM14 3v5h5M10 13h4m-4 4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function CompletionRing({ percentage }: { percentage: number }) {
  const value = Math.max(0, Math.min(100, percentage));
  return <div aria-label={`${value}% complete`} className="relative grid h-24 w-24 shrink-0 place-items-center"><svg aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" pathLength="100" r="42" stroke="var(--color-error)" strokeOpacity="0.15" strokeWidth="9" /><circle cx="50" cy="50" fill="none" pathLength="100" r="42" stroke="var(--color-error)" strokeDasharray={`${value} ${100 - value}`} strokeLinecap="round" strokeWidth="9" /></svg><span className="relative text-3xl font-semibold leading-none tracking-tight text-text-primary">{value}%</span></div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight text-text-primary">{children}</h2>;
}

function fieldErrorId(field: string) {
  return `profile-${field.replaceAll(".", "-")}-error`;
}

function Field({ children, field, label }: { children: ReactNode; field?: string; label: string }) {
  const errors = useContext(ProfileErrorsContext);
  const resolvedField = field ?? fieldByLabel[label] ?? Object.keys(errors).find((key) => workFieldByLabel[label] && key.endsWith(`.${workFieldByLabel[label]}`));
  const error = resolvedField ? errors[resolvedField] : undefined;
  const control = isValidElement<{ className?: string }>(children) && error && resolvedField
    ? cloneElement(children as ReactElement<{ className?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
      className: `${children.props.className ?? ""} border-error focus:border-error focus:ring-error`,
      "aria-describedby": fieldErrorId(resolvedField),
      "aria-invalid": true,
    })
    : children;
  return <label className="block"><span className={labelClassName}>{label}</span>{control}{error && resolvedField && <span className="mt-2 block text-sm font-medium text-error" id={fieldErrorId(resolvedField)} role="alert">{error}</span>}</label>;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const lastEditedFieldRef = useRef<FormField | null>(null);
  const pendingSavesRef = useRef<PendingSave[]>([]);
  const [actionState, formAction, isPending] = useActionState(saveProfile, initialProfileActionState);
  const [resumeName, setResumeName] = useState(initialProfile.resumePdfName ?? (initialProfile.resumePdfKey ? "resume.pdf" : ""));
  const [resumeUploadState, setResumeUploadState] = useState<"idle" | "uploading" | "saved" | "error">(initialProfile.resumePdfKey ? "saved" : "idle");
  const [skills, setSkills] = useState(initialProfile.skills);
  const [industries, setIndustries] = useState(initialProfile.industries);
  const [skillInput, setSkillInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [experiences, setExperiences] = useState<WorkExperience[]>(initialProfile.workExperience);
  const [education, setEducation] = useState(initialProfile.education);
  const errors = actionState.fieldErrors;

  useEffect(() => () => {
    if (autoSaveTimeoutRef.current !== null) window.clearTimeout(autoSaveTimeoutRef.current);
    if (feedbackTimeoutRef.current !== null) window.clearTimeout(feedbackTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (actionState.status === "idle") return;
    const pendingSave = pendingSavesRef.current.shift();
    if (pendingSave?.isResumeUpload) {
      setResumeUploadState(actionState.status === "success" ? "saved" : "error");
    }

    const field = pendingSave ? pendingSave.field : lastEditedFieldRef.current;
    if (!field) return;

    field.classList.remove("profile-field-save-success", "profile-field-save-error");
    if (feedbackTimeoutRef.current !== null) window.clearTimeout(feedbackTimeoutRef.current);
    if (actionState.status === "success") {
      void field.offsetWidth;
      field.classList.add("profile-field-save-success");
      feedbackTimeoutRef.current = window.setTimeout(() => {
        field.classList.remove("profile-field-save-success");
        feedbackTimeoutRef.current = null;
      }, 3500);
    } else {
      field.classList.add("profile-field-save-error");
    }
  }, [actionState]);

  function saveCurrentValues({ isResumeUpload = false }: { isResumeUpload?: boolean } = {}) {
    if (!formRef.current) return;
    pendingSavesRef.current.push({ field: isResumeUpload ? null : lastEditedFieldRef.current, isResumeUpload });
    startTransition(() => formAction(new FormData(formRef.current!)));
  }

  function scheduleAutoSave() {
    if (autoSaveTimeoutRef.current !== null) window.clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = window.setTimeout(saveCurrentValues, 800);
  }

  function handleFormInput(event: FormEvent<HTMLFormElement>) {
    if (event.target instanceof HTMLInputElement && event.target.type === "file") return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
      lastEditedFieldRef.current = event.target;
    }
    scheduleAutoSave();
  }

  function handleResumeSelection(event: ChangeEvent<HTMLInputElement>) {
    const resume = event.target.files?.[0];
    setResumeName(resume?.name ?? "");
    if (!resume) return;
    setResumeUploadState("uploading");
    saveCurrentValues({ isResumeUpload: true });
  }

  function addTag(kind: "skill" | "industry") {
    const input = kind === "skill" ? skillInput : industryInput;
    const nextTag = input.trim();
    if (!nextTag) return;
    const setTags = kind === "skill" ? setSkills : setIndustries;
    setTags((tags) => tags.includes(nextTag) ? tags : [...tags, nextTag]);
    if (kind === "skill") setSkillInput(""); else setIndustryInput("");
    scheduleAutoSave();
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>, kind: "skill" | "industry") {
    if (event.key === "Enter") { event.preventDefault(); addTag(kind); }
  }

  function addRole() {
    setExperiences((current) => current.length >= 3 ? current : [...current, { id: crypto.randomUUID(), company: "", title: "", startDate: "", endDate: "", current: false, responsibilities: "" }]);
    scheduleAutoSave();
  }

  function removeRole(id: string) {
    setExperiences((current) => current.filter((role) => role.id !== id));
    scheduleAutoSave();
  }

  function updateExperience(id: string, field: keyof WorkExperience, fieldValue: string | boolean) {
    setExperiences((current) => current.map((role) => role.id === id ? { ...role, [field]: fieldValue } : role));
  }

  const completion = actionState.status === "success"
    ? { percentage: actionState.completionPercentage, missingFields: actionState.missingFields }
    : { percentage: initialProfile.completionPercentage, missingFields: initialProfile.missingFields };
  const missingFields = completion.missingFields;

  return (
    <ProfileErrorsContext.Provider value={errors}><form action={formAction} className="mx-auto max-w-[880px] space-y-6" onInput={handleFormInput} onChange={handleFormInput} ref={formRef}>
      <input name="skills" type="hidden" value={JSON.stringify(skills)} />
      <input name="industries" type="hidden" value={JSON.stringify(industries)} />
      <input name="workExperience" type="hidden" value={JSON.stringify(experiences)} />
      <input name="education" type="hidden" value={JSON.stringify(education)} />

      {missingFields.length > 0 && <section className="flex flex-col gap-6 rounded-2xl border border-error/25 bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-10"><div><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-error text-sm font-bold text-error">!</span><SectionTitle>Profile needs attention</SectionTitle></div><p className="mt-3 max-w-[520px] text-base leading-7 text-text-dark">Complete missing fields to improve tailored matches and generated resumes.</p><div className="mt-5 flex flex-wrap gap-2">{missingFields.map((field) => <span className="rounded-sm bg-error/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-error" key={field}>{field}</span>)}</div></div><CompletionRing percentage={completion.percentage} /></section>}

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-10"><SectionTitle>Resume</SectionTitle><p className="mt-1 text-base text-text-secondary">Upload an existing resume to auto-fill the profile, or generate a new tailored one from your details below.</p><input accept="application/pdf,.pdf" aria-describedby={errors.resume ? fieldErrorId("resume") : undefined} aria-invalid={Boolean(errors.resume)} className="sr-only" name="resume" onChange={handleResumeSelection} ref={fileInputRef} type="file" /><div className={`mt-7 grid min-h-80 place-items-center rounded-xl border-2 border-dashed bg-surface-secondary px-6 py-10 text-center ${errors.resume ? "border-error" : "border-border"}`}><div><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface shadow-card"><UploadIcon /></div><p className="mt-5 text-xl font-semibold text-text-primary">Click to upload or drag and drop</p><p className="mt-2 text-base text-text-secondary">PDF formatting only. Maximum file size 5MB.</p>{resumeUploadState === "uploading" && <p aria-live="polite" className="mt-3 text-sm font-medium text-text-secondary">Uploading resume...</p>}{errors.resume && <p aria-live="assertive" className="mt-3 text-sm font-medium text-error" id={fieldErrorId("resume")} role="alert">{errors.resume}</p>}{resumeUploadState === "saved" && <p aria-live="polite" className="mt-3 text-sm font-medium text-success-dark">Saved resume: <span className="break-all">{resumeName || "resume.pdf"}</span>. <a className="underline underline-offset-2 hover:text-success" href="/api/resume" rel="noopener noreferrer" target="_blank">Open resume</a></p>}<button className="mt-7 rounded-md border border-border bg-surface px-5 py-2.5 text-base font-medium text-text-dark shadow-button transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} onClick={() => fileInputRef.current?.click()} type="button">Select Resume</button></div></div><div className="mt-7 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-base text-text-secondary">Need a fresh document based on fields below?</p><button className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-base font-semibold text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover" type="button"><DocumentIcon /> Generate Resume from Profile</button></div></section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-10"><SectionTitle>Profile Information</SectionTitle><p className="mt-1 text-base text-text-secondary">This context is used to accurately represent you in agent interactions.</p><p aria-live="polite" className="mt-2 text-sm text-text-muted">{isPending ? "Saving changes..." : actionState.status === "success" ? "All changes saved." : "Changes save automatically."}</p>
        <div className="mt-6 border-t border-border pt-8"><h3 className="text-lg font-semibold text-text-primary">Personal Info</h3><div className="mt-7 grid gap-5 md:grid-cols-2"><Field label="Full Name"><input className={fieldClassName} defaultValue={initialProfile.fullName} name="fullName" /></Field><Field label="Email"><input className={fieldClassName} defaultValue={initialProfile.email} disabled /></Field><Field label="Phone Number"><input className={fieldClassName} defaultValue={initialProfile.phone} name="phone" placeholder="+1 (555) 000-0000" /></Field><Field label="Location"><input className={fieldClassName} defaultValue={initialProfile.location} name="location" placeholder="City, Country" /></Field><Field label="LinkedIn URL"><input className={fieldClassName} defaultValue={initialProfile.linkedinUrl} name="linkedinUrl" /></Field><Field label="Portfolio / GitHub"><input className={fieldClassName} defaultValue={initialProfile.portfolioUrl} name="portfolioUrl" /></Field><Field label="Work Authorization"><select className={fieldClassName} defaultValue={initialProfile.workAuthorization} name="workAuthorization"><option value="">Select authorization</option><option value="citizen">Citizen</option><option value="permanent_resident">Permanent resident</option><option value="visa_required">Visa required</option></select></Field></div></div>

        <div className="mt-10 border-t border-border pt-8"><h3 className="text-lg font-semibold text-text-primary">Professional Info</h3><div className="mt-7 grid gap-5 md:grid-cols-2"><Field label="Current/Recent Job Title"><input className={`${fieldClassName} md:col-span-2`} defaultValue={initialProfile.currentTitle} name="currentTitle" /></Field><Field label="Experience Level"><select className={fieldClassName} defaultValue={initialProfile.experienceLevel} name="experienceLevel"><option value="">Select experience level</option><option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead</option></select></Field><Field label="Years of Experience"><input className={fieldClassName} defaultValue={initialProfile.yearsExperience} min="1" name="yearsExperience" type="number" /></Field></div><div className="mt-5"><TagInput add={() => addTag("skill")} input={skillInput} label="Skills" onChange={setSkillInput} onKeyDown={(event) => handleTagKeyDown(event, "skill")} remove={(tag) => setSkills((current) => current.filter((item) => item !== tag))} tags={skills} /></div><div className="mt-5"><TagInput add={() => addTag("industry")} input={industryInput} label="Industries Worked In (Optional)" onChange={setIndustryInput} onKeyDown={(event) => handleTagKeyDown(event, "industry")} placeholder="E.g. FinTech, Healthcare" remove={(tag) => setIndustries((current) => current.filter((item) => item !== tag))} tags={industries} /></div></div>

        <div className="mt-10 border-t border-border pt-8"><div className="flex items-center justify-between gap-4"><h3 className="text-lg font-semibold text-text-primary">Work Experience</h3><button className="text-sm font-semibold text-accent hover:text-accent-dark disabled:text-text-muted" disabled={experiences.length >= 3} onClick={addRole} type="button">+ Add role</button></div><div className="mt-6 space-y-5">{experiences.map((experience) => <ExperienceCard experience={experience} key={experience.id} remove={removeRole} update={updateExperience} />)}</div></div>

        <div className="mt-10 border-t border-border pt-8"><h3 className="text-lg font-semibold text-text-primary">Education</h3><div className="mt-7 grid gap-5 md:grid-cols-2"><Field label="Highest Degree"><select className={fieldClassName} onChange={(event) => setEducation((current) => ({ ...current, degree: event.target.value }))} value={education.degree}><option value="">Select degree</option><option>High School</option><option>Associate Degree</option><option>Bachelor&apos;s Degree</option><option>Master&apos;s Degree</option><option>Doctorate</option></select></Field><Field label="Field of Study"><input className={fieldClassName} onChange={(event) => setEducation((current) => ({ ...current, fieldOfStudy: event.target.value }))} value={education.fieldOfStudy} /></Field><Field label="Institution Name"><input className={fieldClassName} onChange={(event) => setEducation((current) => ({ ...current, institution: event.target.value }))} placeholder="E.g. State University" value={education.institution} /></Field><Field label="Graduation Year"><input className={fieldClassName} onChange={(event) => setEducation((current) => ({ ...current, graduationYear: event.target.value }))} placeholder="YYYY" value={education.graduationYear} /></Field></div></div>

        <div className="mt-10 border-t border-border pt-8"><h3 className="text-lg font-semibold text-text-primary">Job Preferences</h3><div className="mt-7 grid gap-5 md:grid-cols-2"><Field label="Job Titles Seeking"><input className={`${fieldClassName} md:col-span-2`} defaultValue={initialProfile.jobTitlesSeeking} name="jobTitlesSeeking" placeholder="Frontend Engineer, React Developer" /></Field><Field label="Remote Preference"><select className={fieldClassName} defaultValue={initialProfile.remotePreference} name="remotePreference"><option value="">Select preference</option><option value="any">Any</option><option value="remote">Remote only</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></Field><Field label="Salary Expectation (Optional)"><input className={fieldClassName} defaultValue={initialProfile.salaryExpectation} name="salaryExpectation" placeholder="E.g. $120k+" /></Field><Field label="Preferred Locations (Optional)"><input className={`${fieldClassName} md:col-span-2`} defaultValue={initialProfile.preferredLocations} name="preferredLocations" placeholder="E.g. New York, London" /></Field><Field label="Cover Letter Tone (Optional)"><select className={fieldClassName} defaultValue={initialProfile.coverLetterTone} name="coverLetterTone"><option value="">Select tone</option><option value="formal">Formal</option><option value="casual">Casual</option><option value="enthusiastic">Enthusiastic</option></select></Field></div></div>
        {actionState.status !== "idle" && <p aria-live="polite" className={`mt-6 text-sm font-medium ${actionState.status === "success" ? "text-success-dark" : "text-error"}`}>{actionState.message}</p>}
        <button className="mt-6 w-full rounded-md bg-accent px-4 py-3 text-base font-semibold text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Saving changes..." : "Save now"}</button>
      </section>
    </form></ProfileErrorsContext.Provider>
  );
}

function TagInput({ add, input, label, onChange, onKeyDown, placeholder = "Add a skill", remove, tags }: { add: () => void; input: string; label: string; onChange: (value: string) => void; onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; placeholder?: string; remove: (tag: string) => void; tags: string[] }) {
  const field = label === "Skills" ? "skills" : "industries";
  const error = useContext(ProfileErrorsContext)[field];
  if (error) return <div><span className={labelClassName}>{label}</span><div className="mt-2 flex gap-3"><input aria-describedby={fieldErrorId(field)} aria-invalid className={`${fieldClassName.replace("mt-2 ", "mt-0 ")} border-error focus:border-error focus:ring-error`} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} value={input} /><button className="rounded-md bg-surface-tertiary px-4 py-2 text-sm font-semibold text-text-dark transition-colors hover:bg-border" onClick={add} type="button">Add</button></div><span className="mt-2 block text-sm font-medium text-error" id={fieldErrorId(field)} role="alert">{error}</span>{tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <button className="rounded-md border border-error px-3 py-1.5 text-sm font-medium text-error" key={tag} onClick={() => remove(tag)} type="button">Remove {tag}</button>)}</div>}</div>;
  return <div><span className={labelClassName}>{label}</span><div className="mt-2 flex gap-3"><input className={fieldClassName.replace("mt-2 ", "mt-0 ")} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} value={input} /><button className="rounded-md bg-surface-tertiary px-4 py-2 text-sm font-semibold text-text-dark transition-colors hover:bg-border" onClick={add} type="button">Add</button></div>{tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm font-medium text-text-primary" key={tag}>{tag}<button aria-label={`Remove ${tag}`} className="text-text-secondary hover:text-text-primary" onClick={() => remove(tag)} type="button">×</button></span>)}</div>}</div>;
}

function ExperienceCard({ experience, remove, update }: { experience: WorkExperience; remove: (id: string) => void; update: (id: string, field: keyof WorkExperience, value: string | boolean) => void }) {
  return <article className="rounded-xl border border-border bg-surface-secondary p-5"><div className="grid gap-5 md:grid-cols-2"><Field label="Company Name"><input className={fieldClassName} onChange={(event) => update(experience.id, "company", event.target.value)} value={experience.company} /></Field><Field label="Job Title"><input className={fieldClassName} onChange={(event) => update(experience.id, "title", event.target.value)} value={experience.title} /></Field><Field label="Start Date"><input className={fieldClassName} onChange={(event) => update(experience.id, "startDate", event.target.value)} placeholder="MM/YY" value={experience.startDate} /></Field><Field label="End Date"><input className={fieldClassName} disabled={experience.current} onChange={(event) => update(experience.id, "endDate", event.target.value)} placeholder="MM/YY" value={experience.endDate} /></Field></div><label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-text-dark"><input checked={experience.current} className="h-4 w-4 accent-accent" onChange={(event) => update(experience.id, "current", event.target.checked)} type="checkbox" />Currently working here</label><Field label="Key Responsibilities"><textarea className={`${fieldClassName} min-h-28 resize-y`} onChange={(event) => update(experience.id, "responsibilities", event.target.value)} value={experience.responsibilities} /></Field><button className="mt-4 text-sm font-semibold text-error hover:text-error/80" onClick={() => remove(experience.id)} type="button">Remove role</button></article>;
}
