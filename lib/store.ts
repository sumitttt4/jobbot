// Local JSON file store or Vercel KV store — the entire "database" for this personal app.
// Lives at .data/db.json (gitignored) locally, and Vercel KV (Redis) on production.
// Single user, no auth.

import fs from "fs/promises";
import path from "path";
import os from "os";
import { seedPreferences, seedResume } from "./mock";
import type {
  Job,
  JobPreferences,
  JobStatus,
  MatchSkills,
  ParsedResume,
} from "./types";

export interface StoredMatch {
  match_score: number | null;
  match_skills: MatchSkills | null;
  status: JobStatus;
  cover_letter: string | null;
  applied_at: string | null;
  notes: string | null;
}

export interface DB {
  resume: ParsedResume | null;
  preferences: JobPreferences | null;
  jobs: Job[];
  matches: Record<string, StoredMatch>; // keyed by job.id
  jobs_fetched_at: string | null;
}

const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? os.tmpdir() : path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function seedDB(): DB {
  return {
    resume: seedResume,
    preferences: seedPreferences,
    jobs: [],
    matches: {},
    jobs_fetched_at: null,
  };
}

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export async function readDB(): Promise<DB> {
  if (hasKV) {
    try {
      const url = `${process.env.KV_REST_API_URL}/get/db`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const parsed = JSON.parse(json.result) as Partial<DB>;
          return {
            resume: parsed.resume ?? seedResume,
            preferences: parsed.preferences ?? seedPreferences,
            jobs: parsed.jobs ?? [],
            matches: parsed.matches ?? {},
            jobs_fetched_at: parsed.jobs_fetched_at ?? null,
          };
        }
      }
    } catch (err) {
      console.error("KV readDB failed, falling back to seed/local:", err);
    }
    // If not found in KV, seed KV
    const db = seedDB();
    await writeDB(db);
    return db;
  }

  // Local filesystem fallback
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      resume: parsed.resume ?? seedResume,
      preferences: parsed.preferences ?? seedPreferences,
      jobs: parsed.jobs ?? [],
      matches: parsed.matches ?? {},
      jobs_fetched_at: parsed.jobs_fetched_at ?? null,
    };
  } catch {
    const db = seedDB();
    await writeDB(db);
    return db;
  }
}

export async function writeDB(db: DB): Promise<void> {
  if (hasKV) {
    try {
      const url = process.env.KV_REST_API_URL!;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", "db", JSON.stringify(db)]),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`KV write failed: ${res.status} ${await res.text()}`);
      }
      return;
    } catch (err) {
      console.error("KV writeDB failed:", err);
    }
  }

  // Local filesystem fallback
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Local writeDB failed:", err);
  }
}

/** Read-modify-write helper. */
export async function updateDB(fn: (db: DB) => void): Promise<DB> {
  const db = await readDB();
  fn(db);
  await writeDB(db);
  return db;
}
