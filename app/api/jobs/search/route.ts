import { NextResponse } from "next/server";
import { searchJobs, buildScraperQuery, fetchInternships } from "@/lib/jsearch";
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
      { error: "Add a JSEARCH_API_KEY to .env.local to fetch real jobs.", jobs: await getJobsWithMatches() },
      { status: 400 }
    );
  }

  const prefs = await getPreferences();
  const resume = await getResume();

  // 24h cache — skip the (rate-limited) JSearch call if we fetched recently.
  if (!(await isCacheFresh())) {
    try {
      const query = buildScraperQuery(prefs);
      const [fetchedJobs, fetchedInternships] = await Promise.all([
        searchJobs(query, { page: 1, numPages: 2 }),
        fetchInternships("frontend"),
      ]);
      const combined = [...fetchedJobs, ...fetchedInternships];
      if (combined.length) await upsertJobs(combined);
    } catch (err) {
      console.error("Scraper fetch failed:", err);
      return NextResponse.json(
        { error: `Scraper failed: ${(err as Error).message}` },
        { status: 500 }
      );
    }
  }

  // Score unscored jobs with Groq (bounded).
  if (hasGroq && resume) {
    const unscored = await getUnscoredJobs(MAX_TO_SCORE);
    for (const job of unscored) {
      try {
        const r = await scoreMatch(resume, job.description);
        await setMatchScore(job.id, r.score, {
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

  const jobs = await getJobsWithMatches();
  return NextResponse.json({ count: jobs.length, scored: hasGroq, jobs });
}
