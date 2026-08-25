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

// Adzuna searches one country at a time, so a bare city has to resolve to one or the search
// runs in the wrong country and finds nothing. US cities need no entry — 'us' is the fallback.
const countriesByCity: Record<string, string> = {
  london: "gb", manchester: "gb", birmingham: "gb", leeds: "gb", glasgow: "gb", edinburgh: "gb",
  bristol: "gb", liverpool: "gb", cambridge: "gb", oxford: "gb", cardiff: "gb", belfast: "gb",
  dublin: "ie", cork: "ie",
  toronto: "ca", vancouver: "ca", montreal: "ca", ottawa: "ca", calgary: "ca",
  sydney: "au", melbourne: "au", brisbane: "au", perth: "au", canberra: "au",
  auckland: "nz", wellington: "nz",
  berlin: "de", munich: "de", "münchen": "de", hamburg: "de", frankfurt: "de", cologne: "de", "köln": "de", stuttgart: "de",
  vienna: "at", wien: "at", zurich: "ch", "zürich": "ch", geneva: "ch", basel: "ch",
  paris: "fr", lyon: "fr", marseille: "fr", toulouse: "fr", bordeaux: "fr", lille: "fr",
  madrid: "es", barcelona: "es", valencia: "es", seville: "es", "sevilla": "es",
  rome: "it", roma: "it", milan: "it", milano: "it", turin: "it", naples: "it",
  amsterdam: "nl", rotterdam: "nl", "the hague": "nl", utrecht: "nl", eindhoven: "nl",
  brussels: "be", antwerp: "be", ghent: "be",
  warsaw: "pl", krakow: "pl", "kraków": "pl", wroclaw: "pl", gdansk: "pl",
  "são paulo": "br", "sao paulo": "br", rio: "br", "rio de janeiro": "br",
  "mexico city": "mx", guadalajara: "mx", monterrey: "mx",
  bangalore: "in", bengaluru: "in", mumbai: "in", delhi: "in", "new delhi": "in", hyderabad: "in", pune: "in", chennai: "in",
  singapore: "sg",
  johannesburg: "za", "cape town": "za", pretoria: "za", durban: "za",
};

// Adzuna has no "remote" location — `where=remote` returns nothing at all. Remote is an
// arrangement, so it is expressed as a keyword on `what` with no `where` instead.
const remoteTerms = new Set(["remote", "anywhere", "worldwide", "work from home", "wfh", "fully remote"]);

export const MAX_LOCATIONS = 3;

/**
 * Adzuna needs a different request for each kind of location:
 * - `remote`  — a keyword on `what`, no `where`. `where=remote` returns nothing.
 * - `country` — the country endpoint with no `where`. `where=Germany` on /de also returns nothing.
 * - `place`   — `where` set to the city, on that city's country endpoint.
 */
export type LocationEntry = {
  kind: "remote" | "country" | "place";
  label: string;
  where: string;
  country: string;
};

export type ParsedLocations = { entries: LocationEntry[]; dropped: string[] };

type Draft =
  | { kind: "remote"; label: string }
  | { kind: "country"; label: string; country: string }
  | { kind: "place"; label: string; where: string; country: string | null; qualified: boolean };

function countryCodeFor(segment: string): string | null {
  const value = segment.trim().toLowerCase();
  if (countriesByName[value]) return countriesByName[value];
  if (value.length === 2 && supportedCountryCodes.has(value)) return value;
  return null;
}

/**
 * The location field is a list of alternatives — "Remote, Berlin, France" is three searches. A
 * country or a state qualifies the city before it rather than becoming another alternative, so
 * "Berlin, Germany" stays one location, but "France, Germany" is two countries because the
 * segment before is itself a country, not a city.
 */
export function parseLocations(input: string): ParsedLocations {
  const drafts: Draft[] = [];

  for (const segment of input.split(",").map((part) => part.trim()).filter(Boolean)) {
    if (remoteTerms.has(segment.toLowerCase())) {
      drafts.push({ kind: "remote", label: segment });
      continue;
    }

    const code = countryCodeFor(segment);
    const previous = drafts.at(-1);
    // A country folds into the city before it only when it does not contradict what we already
    // know: "Berlin, Germany" is one location, but "Berlin, France" is two, because Berlin is a
    // known German city and France therefore has to be a separate alternative. An unknown city
    // trusts the qualifier. One qualifier per city, so "Berlin, Germany, France" is two entries.
    const qualifiesPreviousCity = previous?.kind === "place"
      && !previous.qualified
      && (previous.country === null || previous.country === code);

    if (code) {
      if (qualifiesPreviousCity) {
        previous.label = `${previous.label}, ${segment}`;
        previous.country = code;
        previous.qualified = true;
        continue;
      }
      drafts.push({ kind: "country", label: segment, country: code });
      continue;
    }

    // A two-letter segment that is not a country reads as a state or province: "Austin, TX".
    if (/^[a-z]{2}$/i.test(segment) && previous?.kind === "place" && !previous.qualified) {
      previous.label = `${previous.label}, ${segment}`;
      previous.where = `${previous.where}, ${segment}`;
      previous.qualified = true;
      continue;
    }

    drafts.push({
      kind: "place",
      label: segment,
      where: segment,
      country: countriesByCity[segment.toLowerCase()] ?? null,
      qualified: false,
    });
  }

  if (drafts.length === 0) {
    return { entries: [{ kind: "country", label: "", where: "", country: "us" }], dropped: [] };
  }

  const seen = new Set<string>();
  const unique = drafts.filter((draft) => {
    const key = `${draft.kind}|${draft.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const kept = unique.slice(0, MAX_LOCATIONS);
  // Remote has no country of its own, so it borrows the first one named. "Remote, London" means
  // UK remote to anyone who typed it.
  const named = kept.find((draft) => draft.kind === "country" || (draft.kind === "place" && draft.country));
  const remoteCountry = named
    ? (named.kind === "country" ? named.country : (named as Extract<Draft, { kind: "place" }>).country ?? "us")
    : "us";

  return {
    entries: kept.map((draft) => {
      if (draft.kind === "remote") {
        return { kind: "remote" as const, label: draft.label, where: "", country: remoteCountry };
      }
      if (draft.kind === "country") {
        return { kind: "country" as const, label: draft.label, where: "", country: draft.country };
      }
      return {
        kind: "place" as const,
        label: draft.label,
        where: draft.where,
        country: draft.country ?? "us",
      };
    }),
    dropped: unique.slice(MAX_LOCATIONS).map((draft) => draft.label),
  };
}

export function detectCountry(location: string): string {
  const input = location.trim().toLowerCase();
  if (!input) return "us";

  // "Berlin, Germany" names the country last, so the trailing segment is checked first.
  const segments = input.split(",").map((segment) => segment.trim()).filter(Boolean).reverse();
  for (const segment of segments) {
    if (countriesByName[segment]) return countriesByName[segment];
    if (segment.length === 2 && supportedCountryCodes.has(segment)) return segment;
  }

  // No country named, so fall back to the city — "London" has to mean gb, not a US search.
  for (const segment of segments) {
    if (countriesByCity[segment]) return countriesByCity[segment];
  }

  const country = Object.keys(countriesByName).find((name) => input.includes(name));
  if (country) return countriesByName[country];

  const city = Object.keys(countriesByCity).find((name) => input.includes(name));
  return city ? countriesByCity[city] : "us";
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
  entry: LocationEntry,
  resultsPerPage: number = 10,
): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Adzuna credentials are not configured");
  }

  const params = new URLSearchParams({
    app_id: appId,
    // Remote roles are found by keyword with no `where`; a place uses `where` and no keyword.
    app_key: appKey,
    what: entry.kind === "remote" ? `${jobTitle} remote` : jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: String(resultsPerPage),
    "content-type": "application/json",
  });
  // Only a city gets a `where`. A country is the endpoint itself, and remote is a keyword.
  if (entry.where) {
    params.set("where", entry.where);
  }

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${entry.country}/search/1?${params}`);
  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data: unknown = await response.json();
  const results = (data as { results?: unknown }).results;
  return Array.isArray(results) ? (results as AdzunaJob[]) : [];
}
