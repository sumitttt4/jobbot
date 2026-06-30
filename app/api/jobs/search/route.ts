import { NextResponse } from "next/server";
import { searchJobs, buildScraperQuery } from "@/lib/jsearch";
import { scoreMatch } from "@/lib/groq";
import {
  getPreferences,
  getResume,
  getUnscoredJobs,
  isCacheFresh,
  setMatchScore,
  upsertJobs,
  getJobsWithMatches,
} from "@/lib/data";
import { hasGroq, hasJSearch } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cap scoring per request to stay under Groq's rate limit.
const MAX_TO_SCORE = 10;

/**
 * GET /api/jobs/search
 * Builds a query from preferences, fetches from JSearch (skipping if the 24h
 * cache is fresh), then scores any unscored jobs with Groq.
 */
export async function GET() {
  if (!hasJSearch) {
    return NextResponse.json(
      { error: "Add a JSEARCH_API_KEY to .env.local to fetch real jobs.", jobs: getJobsWithMatches() },
      { status: 400 }
    );
  }

  const prefs = getPreferences();
  const resume = getResume();

  // 24h cache — skip the (rate-limited) JSearch call if we fetched recently.
  if (!isCacheFresh()) {
    try {
      const query = buildScraperQuery(prefs);
      const fetched = await searchJobs(query, { page: 1, numPages: 2 });
      if (fetched.length) upsertJobs(fetched);
    } catch (err) {
      console.error("JSearch failed:", (err as Error).message);
    }
  }

  // Score unscored jobs with Groq (bounded).
  if (hasGroq && resume) {
    for (const job of getUnscoredJobs(MAX_TO_SCORE)) {
      try {
        const r = await scoreMatch(resume, job.description);
        setMatchScore(job.id, r.score, {
          matched_skills: r.matched_skills,
          missing_skills: r.missing_skills,
          strengths: r.strengths,
          weaknesses: r.weaknesses,
          recommendation: r.recommendation,
        });
      } catch (err) {
        console.error("scoreMatch failed:", (err as Error).message);
      }
    }
  }

  const jobs = getJobsWithMatches();
  return NextResponse.json({ count: jobs.length, scored: hasGroq, jobs });
}
