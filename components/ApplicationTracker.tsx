"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { statusStyle, timeAgo, cn } from "@/lib/utils";
import type { JobStatus, JobWithMatch } from "@/lib/types";

// Groups for the tracker board
const STAGES: { key: string; label: string; statuses: JobStatus[] }[] = [
  { key: "applied", label: "Applied", statuses: ["applied"] },
  { key: "waiting", label: "Waiting for reply", statuses: ["no_reply", "ghosted"] },
  { key: "replied", label: "Got a reply", statuses: ["replied"] },
  { key: "interviewing", label: "Interviewing", statuses: ["interviewing"] },
  { key: "offer", label: "Offer", statuses: ["offer"] },
  { key: "rejected", label: "Rejected", statuses: ["rejected"] },
];

function NoteEditor({
  jobId,
  initial,
}: {
  jobId: string;
  initial: string | null;
}) {
  const [notes, setNotes] = useState(initial ?? "");
  const [saved, setSaved] = useState(true);

  async function save() {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
    setSaved(true);
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Add a note..."
        className="flex-1 rounded-md border border-line bg-subtle px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {!saved && (
        <Button size="sm" variant="ghost" onClick={save}>
          Save
        </Button>
      )}
    </div>
  );
}

function StatusUpdater({
  jobId,
  current,
  onUpdate,
}: {
  jobId: string;
  current: JobStatus;
  onUpdate: (s: JobStatus) => void;
}) {
  const ALL: JobStatus[] = [
    "applied", "replied", "interviewing", "offer",
    "no_reply", "ghosted", "rejected",
  ];

  async function change(status: JobStatus) {
    onUpdate(status);
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }

  return (
    <select
      value={current}
      onChange={(e) => change(e.target.value as JobStatus)}
      className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink focus:border-ink focus:outline-none"
    >
      {ALL.map((s) => {
        const style = statusStyle(s);
        return (
          <option key={s} value={s}>
            {style.label}
          </option>
        );
      })}
    </select>
  );
}

function StageGroup({
  label,
  jobs,
  defaultOpen = true,
}: {
  label: string;
  jobs: JobWithMatch[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [jobList, setJobList] = useState(jobs);

  function handleStatusUpdate(jobId: string, newStatus: JobStatus) {
    setJobList((prev) =>
      prev.map((j) =>
        j.id === jobId && j.match
          ? { ...j, match: { ...j.match, status: newStatus } }
          : j
      )
    );
  }

  if (jobList.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted" strokeWidth={1.75} />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted" strokeWidth={1.75} />
        )}
        <span className="eyebrow">{label}</span>
        <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">
          {jobList.length}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {jobList.map((job) => {
            const s = statusStyle(job.match?.status ?? "new");
            return (
              <Card key={job.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-[15px] font-semibold text-ink hover:text-accent"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">{job.company}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {job.match?.match_score != null && (
                      <span className="tnum text-sm font-medium text-ink">
                        {job.match.match_score}%
                      </span>
                    )}
                    <StatusUpdater
                      jobId={job.id}
                      current={job.match?.status ?? "applied"}
                      onUpdate={(s) => handleStatusUpdate(job.id, s)}
                    />
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                  {job.match?.applied_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      Applied {timeAgo(job.match.applied_at)}
                    </span>
                  )}
                  {job.location && (
                    <span>{job.location}</span>
                  )}
                  {job.salary && job.salary !== "Not disclosed" && (
                    <span className="tnum">{job.salary}</span>
                  )}
                </div>

                {job.match?.notes && (
                  <div className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.75} />
                    <span>{job.match.notes}</span>
                  </div>
                )}

                <NoteEditor jobId={job.id} initial={job.match?.notes ?? null} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ApplicationTracker({ jobs }: { jobs: JobWithMatch[] }) {
  // Only show jobs that have been acted on (not "new" or "viewed")
  const tracked = jobs.filter(
    (j) => j.match && !["new", "viewed", "saved"].includes(j.match.status)
  );

  if (tracked.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
        <MessageSquare className="h-7 w-7 text-faint" strokeWidth={1.5} />
        <p className="text-sm text-muted">
          No applications yet. Open a job and change its status to "Applied" to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div>
      {STAGES.map(({ key, label, statuses }) => {
        const stageJobs = tracked.filter(
          (j) => j.match && statuses.includes(j.match.status)
        );
        return (
          <StageGroup
            key={key}
            label={label}
            jobs={stageJobs}
            defaultOpen={stageJobs.length > 0}
          />
        );
      })}
    </div>
  );
}
