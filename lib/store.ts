// Local JSON file store — the entire "database" for this personal app.
// Lives at .data/db.json (gitignored). Single user, no auth.
//
// Note: on a local machine (npm run dev / next start) this persists across
// restarts. On serverless hosts the filesystem is ephemeral, so for cloud
// deploys you'd swap this for a real DB — fine for personal/local use.

import fs from "fs";
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

export function readDB(): DB {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      resume: parsed.resume ?? seedResume,
      preferences: parsed.preferences ?? seedPreferences,
      jobs: parsed.jobs ?? [],
      matches: parsed.matches ?? {},
      jobs_fetched_at: parsed.jobs_fetched_at ?? null,
    };
  } catch {
    // First run (or unreadable) — start from the seed and persist it.
    const db = seedDB();
    writeDB(db);
    return db;
  }
}

export function writeDB(db: DB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/** Read-modify-write helper. */
export function updateDB(fn: (db: DB) => void): DB {
  const db = readDB();
  fn(db);
  writeDB(db);
  return db;
}
