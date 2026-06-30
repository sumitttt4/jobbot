import { NextResponse } from "next/server";
import { setStatus } from "@/lib/data";
import type { JobStatus } from "@/lib/types";

const VALID: JobStatus[] = ["new", "viewed", "applied", "saved", "rejected"];

/** PATCH /api/jobs/:id  Body: { status } — updates the job's status. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json().catch(() => ({}))) as { status?: JobStatus };
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID.join(", ")}` },
      { status: 400 }
    );
  }

  const ok = setStatus(params.id, body.status);
  if (!ok) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ ok: true, status: body.status });
}
