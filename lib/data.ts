// High-level data accessors for the personal app. Single user, no auth —
// everything is backed by the local file store or Vercel KV (lib/store.ts).

import { readDB, updateDB, type StoredMatch } from "./store";
import { hasJSearch } from "./config";
import { mockJobs, mockStats } from "./mock";
import type {
  Job,
  JobPreferences,
  JobStatus,
  JobWithMatch,
  MatchSkills,
  Stats,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getResume(): Promise<ParsedResume | null> {
  const db = await readDB();
  return db.resume;
}

export async function saveResume(resume: ParsedResume): Promise<void> {
  await updateDB((db) => {
    db.resume = resume;
  });
}

export async function getPreferences(): Promise<JobPreferences | null> {
  const db = await readDB();
  return db.preferences;
}

export async function savePreferences(prefs: JobPreferences): Promise<void> {
  await updateDB((db) => {
    db.preferences = prefs;
  });
}

function withMatch(job: Job, match?: StoredMatch): JobWithMatch {
  return {
    ...job,
    match: match
      ? {
          id: job.id,
          match_score: match.match_score,
          match_skills: match.match_skills,
          status: match.status,
          cover_letter: match.cover_letter,
          applied_at: match.applied_at ?? null,
          notes: match.notes ?? null,
        }
      : null,
  };
}

/** All stored jobs joined with their match, sorted by score desc. */
export async function getJobsWithMatches(opts: { status?: JobStatus } = {}): Promise<JobWithMatch[]> {
  const db = await readDB();

  // Fallback: no JSearch key and nothing stored yet → show sample jobs so the
  // dashboard isn't empty.
  if (!hasJSearch && db.jobs.length === 0) {
    return opts.status ? mockJobs.filter((j) => j.match?.status === opts.status) : mockJobs;
  }

  let rows = db.jobs.map((job) => withMatch(job, db.matches[job.id]));
  if (opts.status) rows = rows.filter((r) => r.match?.status === opts.status);
  return rows.sort(
    (a, b) => (b.match?.match_score ?? -1) - (a.match?.match_score ?? -1)
  );
}

export async function getJobWithMatch(id: string): Promise<JobWithMatch | null> {
  const db = await readDB();
  const job = db.jobs.find((j) => j.id === id);
  if (job) return withMatch(job, db.matches[job.id]);
  // Fallback to a sample job if we're showing samples.
  if (!hasJSearch) return mockJobs.find((j) => j.id === id) ?? null;
  return null;
}

/** Add fetched jobs, de-duped by job_id, preserving existing matches. */
export async function upsertJobs(jobs: Omit<Job, "id" | "created_at">[]): Promise<Job[]> {
  const db = await updateDB((db) => {
    for (const incoming of jobs) {
      const exists = db.jobs.find((j) => j.job_id === incoming.job_id);
      if (exists) continue;
      const job: Job = {
        ...incoming,
        id: incoming.job_id,
        created_at: new Date().toISOString(),
      };
      db.jobs.unshift(job);
      if (!db.matches[job.id]) {
        db.matches[job.id] = {
          match_score: null,
          match_skills: null,
          status: "new",
          cover_letter: null,
          applied_at: null,
          notes: null,
        };
      }
    }
    db.jobs_fetched_at = new Date().toISOString();
  });
  return db.jobs;
}

export async function setMatchScore(jobId: string, score: number, skills: MatchSkills): Promise<void> {
  await updateDB((db) => {
    const m = db.matches[jobId] ?? {
      match_score: null,
      match_skills: null,
      status: "new" as JobStatus,
      cover_letter: null,
      applied_at: null,
      notes: null,
    };
    m.match_score = score;
    m.match_skills = skills;
    db.matches[jobId] = m;
  });
}

const APPLIED_STATUSES: JobStatus[] = ["applied", "replied", "interviewing", "offer", "no_reply", "ghosted"];

export async function setStatus(jobId: string, status: JobStatus): Promise<boolean> {
  let ok = false;
  await updateDB((db) => {
    if (db.matches[jobId]) {
      db.matches[jobId].status = status;
      // Auto-set applied_at when moving to an applied state for the first time
      if (APPLIED_STATUSES.includes(status) && !db.matches[jobId].applied_at) {
        db.matches[jobId].applied_at = new Date().toISOString();
      }
      ok = true;
    }
  });
  return ok;
}

export async function setNotes(jobId: string, notes: string): Promise<boolean> {
  let ok = false;
  await updateDB((db) => {
    if (db.matches[jobId]) {
      db.matches[jobId].notes = notes;
      ok = true;
    }
  });
  return ok;
}

export async function setCoverLetter(jobId: string, cover: string): Promise<void> {
  await updateDB((db) => {
    if (db.matches[jobId]) db.matches[jobId].cover_letter = cover;
  });
}

/** Jobs that still need an AI match score. */
export async function getUnscoredJobs(limit: number): Promise<Job[]> {
  const db = await readDB();
  return db.jobs
    .filter((j) => db.matches[j.id]?.match_score == null && j.description)
    .slice(0, limit);
}

export async function isCacheFresh(): Promise<boolean> {
  const db = await readDB();
  if (db.jobs.length === 0) return false;
  const at = db.jobs_fetched_at;
  return !!at && Date.now() - new Date(at).getTime() < DAY_MS;
}

export async function getStats(): Promise<Stats> {
  const db = await readDB();

  if (!hasJSearch && db.jobs.length === 0) return mockStats();

  const matches = Object.values(db.matches);
  const total = db.jobs.length;
  const applied = matches.filter((m) => APPLIED_STATUSES.includes(m.status)).length;
  const saved = matches.filter((m) => m.status === "saved").length;
  const scored = matches.filter((m) => typeof m.match_score === "number");
  const matchRate = scored.length
    ? Math.round(scored.reduce((s, m) => s + (m.match_score as number), 0) / scored.length)
    : 0;

  return { total_jobs_found: total, applied_count: applied, saved_count: saved, match_rate: matchRate };
}

// Helper types imported for ts signature completeness
type ParsedResume = import("./types").ParsedResume;
