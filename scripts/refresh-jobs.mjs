// Standalone daily job refresher for JobBot.
//
// Runs WITHOUT the web server. Reads your resume + preferences from
// .data/db.json, fetches fresh jobs from JSearch, scores the new ones with
// Groq, and writes everything back to .data/db.json. Open the app afterwards
// and your freshly-scored matches are already there.
//
// Run manually:   node scripts/refresh-jobs.mjs
// Schedule it:    see scripts/schedule-windows.ps1
//
// Mirrors the same logic as lib/jsearch.ts + lib/groq.ts + lib/store.ts.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, ".data", "db.json");
const MODEL = "llama-3.3-70b-versatile";
const MAX_TO_SCORE = 10; // stay well under Groq's free rate limit

// ── Load .env.local (KEY=VALUE per line) ─────────────────────────────────
function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const JSEARCH_KEY = process.env.JSEARCH_API_KEY;
const JSEARCH_HOST = process.env.JSEARCH_API_HOST || "jsearch.p.rapidapi.com";
// This subscription exposes the v5 endpoint at /search-v2 (classic /search 404s).
const JSEARCH_PATH = process.env.JSEARCH_SEARCH_PATH || "search-v2";
const GROQ_KEY = process.env.GROQ_API_KEY;

const log = (...a) => console.log(`[${new Date().toLocaleTimeString()}]`, ...a);

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const hasKV = !!(KV_URL && KV_TOKEN);

// ── DB helpers ───────────────────────────────────────────────────────────
async function readDB() {
  if (hasKV) {
    try {
      const url = `${KV_URL}/get/db`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const db = JSON.parse(json.result);
          db.jobs ??= [];
          db.matches ??= {};
          return db;
        }
      }
    } catch (e) {
      log("KV read failed, falling back to local file:", e.message);
    }
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    db.jobs ??= [];
    db.matches ??= {};
    return db;
  } catch (e) {
    return {
      resume: null,
      preferences: null,
      jobs: [],
      matches: {},
      jobs_fetched_at: null,
    };
  }
}

async function writeDB(db) {
  if (hasKV) {
    try {
      const res = await fetch(KV_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", "db", JSON.stringify(db)]),
      });
      if (res.ok) return;
      log("KV write response not OK:", res.status);
    } catch (e) {
      log("KV write failed:", e.message);
    }
  }

  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    log("Local file write failed:", e.message);
  }
}

// ── JSearch (mirror of lib/jsearch.ts) ───────────────────────────────────
function formatSalary(j) {
  if (j.job_salary_string) return j.job_salary_string;
  const { job_min_salary: min, job_max_salary: max, job_salary_currency: cur } = j;
  if (!min && !max) return "";
  const c = cur || "USD";
  const fmt = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);
  if (min && max) return `${c} ${fmt(min)} - ${fmt(max)}`;
  return `${c} ${fmt(min || max)}`;
}
function jobLocation(j) {
  if (j.job_is_remote) return "Remote";
  if (j.job_location) return j.job_location;
  return [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || "Unspecified";
}
async function searchJobs(query) {
  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    date_posted: "month",
  });
  const res = await fetch(`https://${JSEARCH_HOST}/${JSEARCH_PATH}?${params}`, {
    headers: { "x-rapidapi-key": JSEARCH_KEY, "x-rapidapi-host": JSEARCH_HOST },
  });
  if (!res.ok) throw new Error(`JSearch ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  // /search-v2 nests under data.jobs; classic /search returns data as an array.
  const rows = Array.isArray(data.data) ? data.data : data.data?.jobs ?? [];
  return rows.filter((j) => j.job_id).map((j) => ({
    job_id: j.job_id,
    title: j.job_title || "Untitled role",
    company: j.employer_name || "Unknown company",
    location: jobLocation(j),
    salary: formatSalary(j),
    description: j.job_description || "",
    job_url: j.job_apply_link || "",
    source: (j.job_publisher || "google").toLowerCase(),
    posted_date: j.job_posted_at_datetime_utc || null,
  }));
}

function mapAtsJob(job) {
  const company = typeof job.organization === "object"
    ? job.organization.name
    : job.organization || "Unknown Company";
    
  let locationStr = "Remote";
  if (Array.isArray(job.locations)) {
    locationStr = job.locations.map((l) => typeof l === "object" ? l.text : l).join(", ");
  } else if (job.locations) {
    locationStr = String(job.locations);
  }

  return {
    job_id: job.id || `ats-${Math.random().toString(36).substring(2, 11)}`,
    title: job.title || "Untitled Internship",
    company,
    location: locationStr || "Remote",
    salary: job.salary || "Not disclosed",
    description: job.description || "",
    job_url: job.url || "",
    source: "internships-api",
    posted_date: job.posted_at || new Date().toISOString(),
  };
}

async function fetchInternships(query) {
  const apiKey = process.env.INTERNSHIPS_API_KEY || JSEARCH_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      description_format: "text",
      limit: "15",
      query,
    });

    const res = await fetch(`https://internships-api.p.rapidapi.com/active-ats-7d?${params.toString()}`, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "internships-api.p.rapidapi.com",
      },
    });

    if (!res.ok) {
      log(`[Warning] Internships API failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rows = Array.isArray(data) ? data : data.data || [];
    
    return rows.map(mapAtsJob);
  } catch (err) {
    log(`[Error] fetchInternships failed: ${err.message}`);
    return [];
  }
}


// ── Groq scoring (mirror of lib/groq.ts scoreMatch) ──────────────────────
function extractJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    if (s !== -1 && e > s) return JSON.parse(cleaned.slice(s, e + 1));
    throw new Error("Bad JSON from model");
  }
}
async function scoreMatch(resume, description) {
  const system = `You are a professional software engineer or recruiter. Compare the candidate's resume data to the job description.
Respond with ONLY valid JSON:
{"score":0,"matched_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"recommendation":""}
score is an integer 0-100.

CRITICAL INSTRUCTIONS FOR TEXT FIELDS (strengths, weaknesses, recommendation):
1. Do NOT use any emojis, icons, or markdown stars/asterisks for emphasis.
2. Do NOT use AI jargon, overly positive hype, or boilerplate phrasing (e.g., "This candidate is an outstanding match...", "Perfect fit!", "Stellar skills").
3. Write the strengths, weaknesses, and recommendation as brief, objective, and candid notes in a professional, direct, human tone.
4. Keep the recommendation under 2 sentences. Be realistic and direct (e.g., "Strong frontend match. RAM requirements and SQL experience are missing but can be learned quickly.").`;
  const body = {
    model: MODEL,
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Resume:\n${JSON.stringify(resume)}\n\nJob Description:\n${description}` },
    ],
  };
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const json = await res.json();
  const r = extractJson(json.choices?.[0]?.message?.content ?? "{}");
  return {
    score: Math.max(0, Math.min(100, Math.round(r.score ?? 0))),
    matched_skills: r.matched_skills ?? [],
    missing_skills: r.missing_skills ?? [],
    strengths: r.strengths ?? [],
    weaknesses: r.weaknesses ?? [],
    recommendation: r.recommendation ?? "",
  };
}

function buildScraperQuery(prefs) {
  const roles = prefs?.preferred_roles?.length 
    ? prefs.preferred_roles 
    : ["Frontend Engineer", "Design Engineer", "UI Engineer", "React Developer"];
    
  const locations = prefs?.preferred_locations?.length
    ? prefs.preferred_locations
    : ["Remote"];

  const rolePart = `(${roles.map((r) => `"${r}"`).join(" OR ")})`;
  const expPart = `("junior" OR "entry level" OR "0-2 years" OR "associate" OR "mid level")`;
  const platformPart = `(linkedin OR wellfound OR "work at a startup" OR "y combinator")`;
  const locationPart = `in ${locations.join(" OR ")}`;

  return `${rolePart} ${expPart} ${platformPart} ${locationPart}`;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  if (!hasKV && !fs.existsSync(DB_PATH)) {
    log("No .data/db.json yet — open the app once first to seed it. Skipping.");
    return;
  }
  if (!JSEARCH_KEY) return log("Missing JSEARCH_API_KEY in .env.local — skipping.");

  const db = await readDB();
  const resume = db.resume;
  const prefs = db.preferences || {};
  if (!resume) return log("No resume in db — open the app and confirm your resume first.");

  const query = buildScraperQuery(prefs);

  log(`Searching: "${query}"`);
  let fetched = [];
  try {
    const [fetchedJobs, fetchedInternships] = await Promise.all([
      searchJobs(query),
      fetchInternships("frontend"),
    ]);
    fetched = [...fetchedJobs, ...fetchedInternships];
  } catch (e) {
    return log("Search failed:", e.message);
  }
  log(`Fetched ${fetched.length} total jobs/internships.`);

  // Upsert (dedupe by job_id, id = job_id), seed match rows as "new".
  let added = 0;
  for (const j of fetched) {
    if (db.jobs.find((x) => x.job_id === j.job_id)) continue;
    const job = { ...j, id: j.job_id, created_at: new Date().toISOString() };
    db.jobs.unshift(job);
    db.matches[job.id] ??= { match_score: null, match_skills: null, status: "new", cover_letter: null, applied_at: null, notes: null };
    added++;
  }
  db.jobs_fetched_at = new Date().toISOString();
  log(`${added} new jobs added.`);

  // Score the unscored (bounded).
  const unscored = db.jobs
    .filter((j) => db.matches[j.id]?.match_score == null && j.description)
    .slice(0, MAX_TO_SCORE);

  if (GROQ_KEY && unscored.length) {
    log(`Scoring ${unscored.length} jobs with Groq…`);
    for (const j of unscored) {
      try {
        const r = await scoreMatch(resume, j.description);
        db.matches[j.id].match_score = r.score;
        db.matches[j.id].match_skills = {
          matched_skills: r.matched_skills,
          missing_skills: r.missing_skills,
          strengths: r.strengths,
          weaknesses: r.weaknesses,
          recommendation: r.recommendation,
        };
        log(`  ${r.score}%  ${j.title} — ${j.company}`);
      } catch (e) {
        log(`  score failed for ${j.title}: ${e.message}`);
      }
    }
  } else if (!GROQ_KEY) {
    log("No GROQ_API_KEY — jobs fetched but not scored.");
  }

  await writeDB(db);
  log(`Done. Total stored jobs: ${db.jobs.length}.`);
}

main().catch((e) => {
  console.error("refresh-jobs failed:", e);
  process.exit(1);
});
