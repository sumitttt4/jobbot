import { NextResponse } from "next/server";
import { setStatus, setNotes } from "@/lib/data";
import type { JobStatus } from "@/lib/types";

const VALID: JobStatus[] = [
  "new", "viewed", "applied", "replied", "interviewing",
  "offer", "no_reply", "ghosted", "saved", "rejected",
];

/**
 * PATCH /api/jobs/:id
 * Body: { status?, notes? }
 * Updates the job's status and/or notes.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json().catch(() => ({}))) as {
    status?: JobStatus;
    notes?: string;
  };

  if (body.status && !VALID.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID.join(", ")}` },
      { status: 400 }
    );
  }

  if (!body.status && body.notes === undefined) {
    return NextResponse.json(
      { error: "Provide status or notes" },
      { status: 400 }
    );
  }

  let ok = true;
  if (body.status) {
    ok = await setStatus(params.id, body.status);
  }
  if (ok && body.notes !== undefined) {
    ok = await setNotes(params.id, body.notes);
  }

  if (!ok) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ ok: true, status: body.status });
}
