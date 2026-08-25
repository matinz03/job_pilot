"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyResearchDossier } from "@/lib/company-research";
import { BuildingIcon, ExternalLinkIcon, SearchIcon } from "@/components/job-details/icons";

type CompanyResearchProps = { company: string; dossier: CompanyResearchDossier | null; jobId: string };
const researchSteps = ["Finding company website", "Opening secure browser", "Reading company homepage", "Reviewing company pages", "Building tailored dossier", "Saving dossier"];

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-text-muted">No specific details found.</p>;
  return <ul className="space-y-2 text-sm leading-6 text-text-dark">{items.map((item) => <li className="flex gap-2" key={item}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{item}</li>)}</ul>;
}

export function CompanyResearch({ company, dossier, jobId }: CompanyResearchProps) {
  const router = useRouter();
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState("");

  async function research() {
    setIsResearching(true);
    setError("");
    setCurrentStep("Finding company website");
    try {
      const response = await fetch("/api/agent/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
      if (!response.ok || !response.body) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "Could not research this company right now. Please try again.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const chunk of events) {
          const type = chunk.match(/^event: (.+)$/m)?.[1];
          const dataLine = chunk.match(/^data: (.+)$/m)?.[1];
          if (!type || !dataLine) continue;
          const data = JSON.parse(dataLine) as { error?: string; step?: string };
          if (type === "progress" && data.step) setCurrentStep(data.step);
          if (type === "error") throw new Error(data.error ?? "Could not research this company right now. Please try again.");
          if (type === "complete") completed = true;
        }
        if (done) break;
      }
      if (!completed) throw new Error("Could not research this company right now. Please try again.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not research this company right now. Please try again.");
    } finally {
      setIsResearching(false);
      setCurrentStep("");
    }
  }

  return <section className="rounded-2xl border border-border bg-surface shadow-card">
    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-light text-accent"><BuildingIcon /></span><div><h2 className="text-xl font-semibold tracking-tight text-text-primary">Company Research</h2>{dossier && <p className="mt-1 text-sm text-text-muted">Tailored to this role and your profile.</p>}</div></div><button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-button" disabled={isResearching} onClick={() => { void research(); }} type="button"><SearchIcon /> {isResearching ? "Researching..." : dossier ? "Refresh research" : "Research Company"}</button></div>
    {error && <p aria-live="assertive" className="border-t border-border px-6 pt-5 text-sm font-medium text-error sm:px-8" role="alert">{error}</p>}
    {isResearching && <div aria-live="polite" className="border-t border-border bg-surface-secondary px-6 py-5 sm:px-8"><p className="text-sm font-semibold text-text-primary">{currentStep}</p><ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{researchSteps.map((step) => { const isComplete = researchSteps.indexOf(step) < researchSteps.indexOf(currentStep); const isCurrent = step === currentStep; return <li className={`flex items-center gap-2 ${isComplete ? "text-success-dark" : isCurrent ? "font-medium text-accent" : "text-text-muted"}`} key={step}><span className={`h-2 w-2 rounded-full ${isComplete ? "bg-success" : isCurrent ? "bg-accent" : "bg-border"}`} />{step}</li>; })}</ol></div>}
    {dossier ? <div className="space-y-6 border-t border-border p-6 sm:p-8"><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Company Overview</h3><p className="mt-2 text-base leading-7 text-text-dark">{dossier.companyOverview}</p></div><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Tech Stack</h3><div className="mt-3 flex flex-wrap gap-2">{dossier.techStack.length > 0 ? dossier.techStack.map((item) => <span className="rounded-full bg-surface-secondary px-3 py-1.5 text-sm font-medium text-text-dark" key={item}>{item}</span>) : <p className="text-sm text-text-muted">No specific technologies found.</p>}</div></div><div className="grid gap-6 md:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Culture</h3><div className="mt-3"><List items={dossier.culture} /></div></div><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Why This Role</h3><p className="mt-3 text-sm leading-6 text-text-dark">{dossier.whyThisRole}</p></div></div><div className="grid gap-5 md:grid-cols-2"><div className="rounded-xl border border-success/25 bg-success-light p-5"><h3 className="text-xs font-semibold uppercase tracking-wide text-success-dark">Your Edge</h3><div className="mt-3"><List items={dossier.yourEdge} /></div></div><div className="rounded-xl border border-accent/30 bg-accent-light p-5"><h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Gaps to Address</h3><div className="mt-3"><List items={dossier.gapsToAddress} /></div></div></div><div className="grid gap-6 md:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Smart Questions</h3><div className="mt-3"><List items={dossier.smartQuestions} /></div></div><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Interview Prep</h3><div className="mt-3"><List items={dossier.interviewPrep} /></div></div></div><div><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Sources</h3>{dossier.sources.length > 0 ? <ul className="mt-3 space-y-2">{dossier.sources.map((source) => <li key={source}><a className="inline-flex break-all text-sm font-medium text-accent underline underline-offset-2 hover:text-accent-dark" href={source} rel="noopener noreferrer" target="_blank"><ExternalLinkIcon /> {source}</a></li>)}</ul> : <p className="mt-3 text-sm text-text-muted">Dossier generated from this job posting and your profile.</p>}</div></div> : <div className="border-t border-border px-6 py-16 text-center sm:px-8"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-secondary text-text-muted"><BuildingIcon className="h-6 w-6" /></span><p className="mt-5 text-base font-medium text-text-primary">No research yet</p><p className="mx-auto mt-2 max-w-[360px] text-base leading-7 text-text-muted">Click &ldquo;Research Company&rdquo; to let the AI browse {company}&apos;s public pages and build a dossier.</p></div>}
  </section>;
}
