"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/badge";
import type { ParsedResume } from "@/lib/types";

type Phase = "idle" | "parsing" | "done" | "error";

export function ResumeUpload({
  initial,
  canUpload = true,
}: {
  initial?: ParsedResume | null;
  canUpload?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(initial ? "done" : "idle");
  const [parsed, setParsed] = useState<ParsedResume | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setPhase("parsing");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setParsed(data as ParsedResume);
      setPhase("done");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  if (phase === "done" && parsed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          {parsed.name || "Resume"} · {parsed.email}
        </div>

        <div>
          <p className="eyebrow mb-2.5">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {parsed.skills.length ? (
              parsed.skills.map((skill) => <Pill key={skill}>{skill}</Pill>)
            ) : (
              <span className="text-sm text-muted">No skills detected.</span>
            )}
          </div>
        </div>

        {parsed.experience?.length > 0 && (
          <div>
            <p className="eyebrow mb-2.5">Experience</p>
            <ul className="space-y-1.5">
              {parsed.experience.map((e, i) => (
                <li key={i} className="text-sm text-ink">
                  <span className="font-medium">{e.role}</span>
                  <span className="text-muted">
                    {" "}
                    · {e.company}
                    {e.duration ? ` · ${e.duration}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <Link href="/preferences">
            <Button>Set preferences</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => (canUpload ? setPhase("idle") : null)}
            disabled={!canUpload}
            title={canUpload ? "" : "Add GROQ_API_KEY to re-upload"}
          >
            Replace resume
          </Button>
        </div>
        {!canUpload && (
          <p className="text-xs text-muted">
            Re-uploading needs a <code>GROQ_API_KEY</code> in <code>.env.local</code>.
          </p>
        )}
      </div>
    );
  }

  if (phase === "parsing") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted">
        <Loader2 className="h-6 w-6 animate-spin text-ink" />
        <p className="text-sm">Reading your resume and extracting skills…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onPick}
      />
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className="flex w-full flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-subtle px-6 py-12 text-center transition-colors hover:border-line-strong"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-muted">
          <Upload className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="text-sm font-medium text-ink">
          Drag &amp; drop your resume PDF
        </span>
        <span className="text-xs text-muted">or click to browse</span>
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-faint">
        <FileText className="h-3.5 w-3.5" /> PDF up to 4MB
      </p>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
