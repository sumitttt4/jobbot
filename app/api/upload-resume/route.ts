import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { parseResume } from "@/lib/groq";
import { saveResume } from "@/lib/data";
import { hasGroq } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/upload-resume
 * Multipart form with a `file` field (PDF). Extracts text locally with
 * pdf-parse, parses it with Groq, and stores the result in the local file store.
 */
export async function POST(req: Request) {
  if (!hasGroq) {
    return NextResponse.json(
      { error: "Add a GROQ_API_KEY to .env.local to parse resumes." },
      { status: 400 }
    );
  }

  let buffer: Buffer;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read upload: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  let rawText: string;
  try {
    const parsed = await pdf(buffer);
    rawText = parsed.text?.trim() ?? "";
    if (!rawText) throw new Error("No text found in PDF");
  } catch (err) {
    return NextResponse.json(
      { error: `Could not extract text: ${(err as Error).message}` },
      { status: 422 }
    );
  }

  try {
    const parsedData = await parseResume(rawText);
    await saveResume(parsedData);
    return NextResponse.json(parsedData);
  } catch (err) {
    return NextResponse.json(
      { error: `Resume parsing failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
