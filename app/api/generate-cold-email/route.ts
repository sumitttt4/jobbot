import { NextResponse } from "next/server";
import { generateColdEmail } from "@/lib/groq";
import { getJobWithMatch, getResume } from "@/lib/data";
import { hasGroq } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/generate-cold-email  Body: { job_id }
 * Generates a tailored cold email from the stored resume + job.
 */
export async function POST(req: Request) {
  if (!hasGroq) {
    return NextResponse.json(
      { error: "Add a GROQ_API_KEY to generate cold emails." },
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
    const result = await generateColdEmail(resume, job.description, job.company);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: `Generation failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
