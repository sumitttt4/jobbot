// High-level data accessors for the personal app. Single user, no auth —
// everything is backed by the local file store (lib/store.ts).

import { readDB, updateDB, type StoredMatch } from "./store";
import { hasJSearch } from "./config";
import { mockJobs, mockStats } from "./mock";
import type {
  Job,
  JobPreferences,
  JobStatus,
  JobWithMatch,
  MatchSkills,
  ParsedResume,
  Stats,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getResume(): ParsedResume | null {
  return readDB().resume;
}

export function saveResume(resume: ParsedResume): void {
  updateDB((db) => {
    db.resume = resume;
  });
}

export function getPreferences(): JobPreferences | null {
  return readDB().preferences;
}

export function savePreferences(prefs: JobPreferences): void {
  updateDB((db) => {
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
        }
      : null,
  };
}

/** All stored jobs joined with their match, sorted by score desc. */
export function getJobsWithMatches(opts: { status?: JobStatus } = {}): JobWithMatch[] {
  const db = readDB();

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

export function getJobWithMatch(id: string): JobWithMatch | null {
  const db = readDB();
  const job = db.jobs.find((j) => j.id === id);
  if (job) return withMatch(job, db.matches[job.id]);
  // Fallback to a sample job if we're showing samples.
  if (!hasJSearch) return mockJobs.find((j) => j.id === id) ?? null;
  return null;
}

/** Add fetched jobs, de-duped by job_id, preserving existing matches. */
export function upsertJobs(jobs: Omit<Job, "id" | "created_at">[]): Job[] {
  return updateDB((db) => {
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
        };
      }
    }
    db.jobs_fetched_at = new Date().toISOString();
  }).jobs;
}

export function setMatchScore(jobId: string, score: number, skills: MatchSkills): void {
  updateDB((db) => {
    const m = db.matches[jobId] ?? {
      match_score: null,
      match_skills: null,
      status: "new" as JobStatus,
      cover_letter: null,
    };
    m.match_score = score;
    m.match_skills = skills;
    db.matches[jobId] = m;
  });
}

export function setStatus(jobId: string, status: JobStatus): boolean {
  let ok = false;
  updateDB((db) => {
    if (db.matches[jobId]) {
      db.matches[jobId].status = status;
      ok = true;
    }
  });
  return ok;
}

export function setCoverLetter(jobId: string, cover: string): void {
  updateDB((db) => {
    if (db.matches[jobId]) db.matches[jobId].cover_letter = cover;
  });
}

/** Jobs that still need an AI match score. */
export function getUnscoredJobs(limit: number): Job[] {
  const db = readDB();
  return db.jobs
    .filter((j) => db.matches[j.id]?.match_score == null && j.description)
    .slice(0, limit);
}

export function isCacheFresh(): boolean {
  const at = readDB().jobs_fetched_at;
  return !!at && Date.now() - new Date(at).getTime() < DAY_MS;
}

export function getStats(): Stats {
  const db = readDB();

  if (!hasJSearch && db.jobs.length === 0) return mockStats();

  const matches = Object.values(db.matches);
  const total = db.jobs.length;
  const applied = matches.filter((m) => m.status === "applied").length;
  const saved = matches.filter((m) => m.status === "saved").length;
  const scored = matches.filter((m) => typeof m.match_score === "number");
  const matchRate = scored.length
    ? Math.round(scored.reduce((s, m) => s + (m.match_score as number), 0) / scored.length)
    : 0;

  return { total_jobs_found: total, applied_count: applied, saved_count: saved, match_rate: matchRate };
}
