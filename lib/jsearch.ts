import type { Job } from "./types";

// JSearch (RapidAPI). This subscription exposes the v5 search endpoint at
// `/search-v2`, which returns { data: { jobs: [...], cursor } } (the older
// `/search` path 404s on this key). Free tier is 100 requests/month, so the
// search route caches results for 24h before calling this.

const HOST = process.env.JSEARCH_API_HOST ?? "jsearch.p.rapidapi.com";
const SEARCH_PATH = process.env.JSEARCH_SEARCH_PATH ?? "search-v2";

export function buildScraperQuery(prefs: any): string {
  const roles = prefs?.preferred_roles?.length 
    ? prefs.preferred_roles 
    : ["Frontend Engineer", "Design Engineer", "UI Engineer", "React Developer"];
    
  const locations = prefs?.preferred_locations?.length
    ? prefs.preferred_locations
    : ["Remote"];

  const rolePart = `(${roles.map((r: string) => `"${r}"`).join(" OR ")})`;
  const expPart = `("junior" OR "entry level" OR "0-2 years" OR "associate" OR "mid level")`;
  const platformPart = `(linkedin OR wellfound OR "work at a startup" OR "y combinator")`;
  const locationPart = `in ${locations.join(" OR ")}`;

  return `${rolePart} ${expPart} ${platformPart} ${locationPart}`;
}

export interface NormalizedJob extends Omit<Job, "id" | "created_at"> {}

interface JSearchJob {
  job_id: string;
  job_title?: string;
  employer_name?: string;
  job_city?: string | null;
  job_state?: string | null;
  job_country?: string | null;
  job_location?: string | null;
  job_is_remote?: boolean;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string | null;
  job_salary_string?: string | null;
  job_description?: string;
  job_apply_link?: string;
  job_publisher?: string;
  job_posted_at_datetime_utc?: string | null;
}

function formatSalary(j: JSearchJob): string {
  if (j.job_salary_string) return j.job_salary_string;
  const { job_min_salary: min, job_max_salary: max, job_salary_currency: cur } = j;
  if (!min && !max) return "";
  const c = cur ?? "USD";
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);
  if (min && max) return `${c} ${fmt(min)} - ${fmt(max)}`;
  return `${c} ${fmt((min ?? max) as number)}`;
}

function location(j: JSearchJob): string {
  if (j.job_is_remote) return "Remote";
  if (j.job_location) return j.job_location;
  return [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || "Unspecified";
}

/**
 * Fetch jobs for a free-text query (e.g. "Frontend Developer in Remote").
 * Throws if the API key is missing or the request fails.
 */
export async function searchJobs(
  query: string,
  opts: { page?: number; numPages?: number } = {}
): Promise<NormalizedJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) throw new Error("Missing JSEARCH_API_KEY");

  const params = new URLSearchParams({
    query,
    page: String(opts.page ?? 1),
    num_pages: String(opts.numPages ?? 1),
    date_posted: "month",
  });

  const res = await fetch(`https://${HOST}/${SEARCH_PATH}?${params.toString()}`, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": HOST,
    },
    next: { revalidate: 60 * 60 * 24 }, // 24h
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`JSearch request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data?: { jobs?: JSearchJob[] } | JSearchJob[];
  };

  // /search-v2 nests jobs under data.jobs; classic /search returns data as the
  // array. Handle both.
  const rows: JSearchJob[] = Array.isArray(json.data)
    ? json.data
    : json.data?.jobs ?? [];

  return rows
    .filter((j) => j.job_id)
    .map((j) => ({
      job_id: j.job_id,
      title: j.job_title ?? "Untitled role",
      company: j.employer_name ?? "Unknown company",
      location: location(j),
      salary: formatSalary(j),
      description: j.job_description ?? "",
      job_url: j.job_apply_link ?? "",
      source: (j.job_publisher ?? "google").toLowerCase(),
      posted_date: j.job_posted_at_datetime_utc ?? null,
    }));
}
