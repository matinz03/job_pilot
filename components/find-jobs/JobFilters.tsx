"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/find-jobs/icons";
import {
  MATCH_FILTERS,
  SORT_OPTIONS,
  buildJobsHref,
  type JobSearchParams,
  type MatchFilter,
  type SortOption,
} from "@/lib/job-filters";

type JobFiltersProps = { params: JobSearchParams };

const selectClassName = "peer w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface py-2.5 pl-4 pr-10 text-sm font-medium text-text-primary outline-none transition-colors hover:bg-surface-secondary focus:border-accent focus:ring-1 focus:ring-accent";

export function JobFilters({ params }: JobFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(params.query);
  const [urlQuery, setUrlQuery] = useState(params.query);
  const debounceRef = useRef<number | null>(null);

  // The input owns itself while the user types, but a query arriving from elsewhere — back,
  // forward, a shared link — has to win. Adjusting during render is React's own answer here;
  // the effect version is what `react-hooks/set-state-in-effect` rejects.
  if (params.query !== urlQuery) {
    setUrlQuery(params.query);
    setQuery(params.query);
  }

  useEffect(() => () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
  }, []);

  function navigate(next: Partial<JobSearchParams>) {
    // Any filter change returns to page 1 — page 7 of the old result set means nothing in the new one.
    router.replace(buildJobsHref({ ...params, page: 1, ...next }), { scroll: false });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => navigate({ query: value.trim() }), 400);
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:gap-0">
      <label className="relative flex-1">
        <span className="sr-only">Filter by company or role</span>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
          <SearchIcon />
        </span>
        <input
          className="w-full bg-surface py-2.5 pl-11 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted"
          name="jobFilter"
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Filter by company or role..."
          type="search"
          value={query}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 sm:border-l sm:border-border sm:pl-4">
        <span className="relative">
          <span className="sr-only" id="match-filter-label">Filter by match score</span>
          <select
            aria-labelledby="match-filter-label"
            className={selectClassName}
            onChange={(event) => navigate({ match: event.target.value as MatchFilter })}
            value={params.match}
          >
            {MATCH_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-primary">
            <ChevronDownIcon />
          </span>
        </span>

        <span className="relative">
          <span className="sr-only" id="sort-label">Sort jobs</span>
          <select
            aria-labelledby="sort-label"
            className={selectClassName}
            onChange={(event) => navigate({ sort: event.target.value as SortOption })}
            value={params.sort}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-primary">
            <ChevronDownIcon />
          </span>
        </span>
      </div>
    </section>
  );
}
