"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchIcon, SparkleIcon } from "@/components/find-jobs/icons";

type SearchOutcome = { message: string } | { error: string } | null;

const labelClassName = "text-xs font-semibold uppercase tracking-wide text-text-dark";
const inputClassName = "w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-surface-secondary disabled:text-text-muted";

const SEARCH_FAILURE_MESSAGE = "Could not search for jobs right now. Please try again.";

export function SearchControls() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [outcome, setOutcome] = useState<SearchOutcome>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSearching) return;

    const formData = new FormData(event.currentTarget);
    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();

    if (jobTitle.length < 2) {
      setOutcome({ error: "Enter a job title to search for." });
      return;
    }

    setIsSearching(true);
    setOutcome(null);

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const result: unknown = await response.json();
      const payload = result as { success?: boolean; data?: { message?: string }; error?: string };

      if (!payload.success || !payload.data?.message) {
        setOutcome({ error: payload.error ?? SEARCH_FAILURE_MESSAGE });
        return;
      }

      setOutcome({ message: payload.data.message });
      // The jobs table is server-rendered, so the new rows only appear after a refresh.
      router.refresh();
    } catch (error) {
      console.error("[components/find-jobs/SearchControls] job search", error);
      setOutcome({ error: SEARCH_FAILURE_MESSAGE });
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <form className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end" onSubmit={handleSubmit}>
        <label className="block">
          <span className={labelClassName}>Job Title</span>
          <span className="relative mt-2 block">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-muted">
              <SearchIcon />
            </span>
            <input className={inputClassName} disabled={isSearching} name="jobTitle" placeholder="Frontend Engineer" type="text" />
          </span>
        </label>

        <label className="block">
          <span className={labelClassName}>Location</span>
          <span className="relative mt-2 block">
            <input className={`${inputClassName} pl-4`} disabled={isSearching} name="location" placeholder="Remote, New York..." type="text" />
          </span>
        </label>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-button transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          disabled={isSearching}
          type="submit"
        >
          <SearchIcon /> {isSearching ? "Finding jobs..." : "Find Jobs"}
        </button>
      </form>

      {outcome && "message" in outcome && (
        <p aria-live="polite" className="mt-5 flex items-center gap-3 rounded-lg bg-success-lightest px-5 py-4 text-sm font-medium text-success-dark">
          <span className="text-success-alt"><SparkleIcon /></span>
          {outcome.message}
        </p>
      )}

      {outcome && "error" in outcome && (
        <p aria-live="assertive" className="mt-5 rounded-lg bg-error/5 px-5 py-4 text-sm font-medium text-error" role="alert">
          {outcome.error}
        </p>
      )}
    </section>
  );
}
