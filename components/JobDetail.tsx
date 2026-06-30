"use client";

import { useState } from "react";
import {
  MapPin,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/MatchScore";
import { formatSalary } from "@/lib/utils";
import type { JobStatus, JobWithMatch, MatchSkills } from "@/lib/types";

const STATUSES: JobStatus[] = ["new", "viewed", "applied", "saved", "rejected"];

function SkillChip({ accent, children }: { accent?: boolean; children: string }) {
  return (
    <span
      className={
        accent
          ? "rounded-md bg-accent-weak px-2.5 py-1 text-sm text-accent"
          : "rounded-md border border-line bg-white px-2.5 py-1 text-sm text-muted"
      }
    >
      {children}
    </span>
  );
}

export function JobDetail({
  job,
  canGenerate = true,
}: {
  job: JobWithMatch;
  canGenerate?: boolean;
}) {
  const m = job.match;
  const skills = (m?.match_skills ?? null) as
    | (MatchSkills & { matched?: string[]; missing?: string[] })
    | null;
  const matched = skills?.matched_skills ?? skills?.matched ?? [];
  const missing = skills?.missing_skills ?? skills?.missing ?? [];

  const [status, setStatus] = useState<JobStatus>(m?.status ?? "new");
  const [cover, setCover] = useState<string | null>(m?.cover_letter ?? null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function updateStatus(next: JobStatus) {
    setStatus(next);
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => {});
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      const data = await res.json();
      setCover(res.ok ? data.cover_letter : `Error: ${data.error}`);
    } catch (err) {
      setCover(`Error: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }

  function copy() {
    if (!cover) return;
    navigator.clipboard.writeText(cover);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="space-y-5">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-sm text-muted">{job.company}</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink">{job.title}</h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" strokeWidth={1.75} /> {job.location}
                  </span>
                  <span className="tnum text-ink">{formatSalary(job.salary)}</span>
                </div>
              </div>
              <MatchScore score={m?.match_score} size={60} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {job.job_url && (
                <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                  <Button>
                    Apply <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                </a>
              )}
              <label className="flex items-center gap-2 text-sm text-muted">
                Status
                <select
                  value={status}
                  onChange={(e) => updateStatus(e.target.value as JobStatus)}
                  className="rounded-md border border-line bg-white px-2.5 py-1.5 text-sm capitalize text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="eyebrow mb-3">Description</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
              {job.description || "No description provided."}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Cover letter</p>
              {cover && (
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
              )}
            </div>
            {cover ? (
              <p className="whitespace-pre-wrap rounded-md border border-line bg-subtle p-4 text-sm leading-relaxed text-ink">
                {cover}
              </p>
            ) : (
              <p className="text-sm text-muted">
                Generate a tailored, ~150-word cover letter from your resume.
              </p>
            )}
            <Button
              variant="secondary"
              onClick={generate}
              disabled={generating || !canGenerate}
              title={canGenerate ? "" : "Add GROQ_API_KEY to generate"}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Writing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                  {cover ? "Regenerate" : "Generate cover letter"}
                </>
              )}
            </Button>
            {!canGenerate && (
              <p className="text-xs text-muted">
                Add a <code>GROQ_API_KEY</code> to <code>.env.local</code> to generate cover letters.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sidebar: match breakdown */}
      <div className="space-y-5">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-3">
              <MatchScore score={m?.match_score} size={52} />
              <div>
                <p className="tnum text-xl font-semibold text-ink">
                  {m?.match_score ?? "—"}
                  {m?.match_score != null && "%"}
                </p>
                <p className="text-xs text-muted">overall match</p>
              </div>
            </div>

            {skills?.recommendation && (
              <p className="border-l-2 border-accent pl-3 text-sm leading-relaxed text-ink/80">
                {skills.recommendation}
              </p>
            )}

            <div>
              <p className="eyebrow mb-2">Matched skills</p>
              <div className="flex flex-wrap gap-1.5">
                {matched.length ? (
                  matched.map((sk) => (
                    <SkillChip key={sk} accent>
                      {sk}
                    </SkillChip>
                  ))
                ) : (
                  <span className="text-sm text-faint">—</span>
                )}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Missing skills</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.length ? (
                  missing.map((sk) => <SkillChip key={sk}>{sk}</SkillChip>)
                ) : (
                  <span className="text-sm text-faint">—</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
