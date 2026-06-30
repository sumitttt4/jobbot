import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/groq";
import { getJobWithMatch, getResume, setCoverLetter } from "@/lib/data";
import { hasGroq } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/generate-cover  Body: { job_id }
 * Generates a tailored cover letter from the stored resume + job, saves it.
 */
export async function POST(req: Request) {
  if (!hasGroq) {
    return NextResponse.json(
      { error: "Add a GROQ_API_KEY to .env.local to generate cover letters." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { job_id?: string };
  if (!body.job_id) {
    return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  }

  const resume = await getResume();
  if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 400 });

  const job = await getJobWithMatch(body.job_id);
  if (!job?.description) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const cover = await generateCoverLetter(resume, job.description, job.company);
    await setCoverLetter(body.job_id, cover);
    return NextResponse.json({ cover_letter: cover });
  } catch (err) {
    return NextResponse.json(
      { error: `Generation failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
