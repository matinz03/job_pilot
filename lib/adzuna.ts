export type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name?: string } | null;
  location: { display_name?: string } | null;
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  contract_type?: string;
  created?: string;
};

// Adzuna serves one host per country. Anything not listed falls back to 'us'.
const countriesByName: Record<string, string> = {
  "united states": "us", usa: "us", "u.s.": "us", america: "us",
  "united kingdom": "gb", uk: "gb", england: "gb", scotland: "gb", wales: "gb", britain: "gb",
  canada: "ca", australia: "au", "new zealand": "nz", ireland: "ie", india: "in", singapore: "sg",
  germany: "de", deutschland: "de", france: "fr", spain: "es", "españa": "es", italy: "it",
  netherlands: "nl", holland: "nl", belgium: "be", austria: "at", switzerland: "ch", poland: "pl",
  brazil: "br", brasil: "br", mexico: "mx", "méxico": "mx", "south africa": "za",
};

const supportedCountryCodes = new Set(Object.values(countriesByName));

export function detectCountry(location: string): string {
  const input = location.trim().toLowerCase();
  if (!input) return "us";

  // "Berlin, Germany" names the country last, so the trailing segment is checked first.
  const segments = input.split(",").map((segment) => segment.trim()).filter(Boolean).reverse();
  for (const segment of segments) {
    if (countriesByName[segment]) return countriesByName[segment];
    if (segment.length === 2 && supportedCountryCodes.has(segment)) return segment;
  }

  const match = Object.keys(countriesByName).find((name) => input.includes(name));
  return match ? countriesByName[match] : "us";
}

export function formatSalary(job: AdzunaJob): string | null {
  const round = (value: number) => `$${Math.round(value / 1000)}k`;
  if (job.salary_min && job.salary_max && job.salary_min !== job.salary_max) {
    return `${round(job.salary_min)} - ${round(job.salary_max)}`;
  }
  const single = job.salary_max ?? job.salary_min;
  return single ? round(single) : null;
}

export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
  resultsPerPage: number = 10,
): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Adzuna credentials are not configured");
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: String(resultsPerPage),
    "content-type": "application/json",
  });
  if (location) {
    params.set("where", location);
  }

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`);
  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data: unknown = await response.json();
  const results = (data as { results?: unknown }).results;
  return Array.isArray(results) ? (results as AdzunaJob[]) : [];
}
