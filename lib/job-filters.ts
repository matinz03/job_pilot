export const PAGE_SIZE = 20;

export const MATCH_FILTERS = [
  { value: "all", label: "All Matches" },
  { value: "high", label: "High Match" },
  { value: "low", label: "Low Match" },
] as const;

export const SORT_OPTIONS = [
  { value: "score", label: "Match Score" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

export type MatchFilter = (typeof MATCH_FILTERS)[number]["value"];
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export type JobSearchParams = {
  query: string;
  match: MatchFilter;
  sort: SortOption;
  page: number;
  /** When set, the list is scoped to the jobs one search run found. */
  run: string;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseJobSearchParams(params: RawSearchParams): JobSearchParams {
  const match = first(params.match);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page), 10);
  const run = first(params.run).trim();

  return {
    query: first(params.q).trim().slice(0, 100),
    match: MATCH_FILTERS.some((option) => option.value === match) ? (match as MatchFilter) : "all",
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SortOption) : "score",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    // Anything that is not a uuid is dropped rather than sent to the database as a filter value.
    run: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(run) ? run : "",
  };
}

/**
 * PostgREST parses `or=(...)` as a comma-separated grammar, and `ilike` reads `*` and `%` as
 * wildcards. Anything that would change the shape of the filter rather than the text being
 * searched is dropped, so a user typing "Acme, Inc. (UK)" searches for text, not syntax.
 */
export function sanitiseSearchTerm(term: string): string {
  return term.replace(/[,()*%\\"']/g, " ").replace(/\s+/g, " ").trim();
}

export function buildJobsHref(params: Partial<JobSearchParams>): string {
  const search = new URLSearchParams();
  if (params.query) search.set("q", params.query);
  if (params.match && params.match !== "all") search.set("match", params.match);
  if (params.sort && params.sort !== "score") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.run) search.set("run", params.run);
  const queryString = search.toString();
  return queryString ? `/find-jobs?${queryString}` : "/find-jobs";
}

/**
 * Renders the design's pager: first pages, an ellipsis, then the last page. The window follows
 * the current page so it stays reachable in a long list.
 */
export function buildPageList(currentPage: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage - 1 > 1) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
  if (currentPage <= 3) [2, 3].forEach((page) => pages.add(page));
  if (currentPage >= totalPages - 2) [totalPages - 1, totalPages - 2].forEach((page) => pages.add(page));

  const ordered = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const withGaps: (number | "gap")[] = [];
  ordered.forEach((page, index) => {
    if (index > 0 && page - ordered[index - 1] > 1) withGaps.push("gap");
    withGaps.push(page);
  });
  return withGaps;
}

export function emptyMessage(params: JobSearchParams): string {
  if (params.query || params.match !== "all") {
    return "No jobs match these filters. Clear them, or search for more roles above.";
  }
  if (params.run) {
    return "This search did not add anything new — everything it turned up is already in your list.";
  }
  return "No jobs yet. Run a search to start matching roles to your profile.";
}
