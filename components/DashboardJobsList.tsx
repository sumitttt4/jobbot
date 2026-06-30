"use client";

import { useState } from "react";
import { Sparkles, HelpCircle, CheckCircle, ListFilter } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import type { JobWithMatch } from "@/lib/types";

export function DashboardJobsList({ initialJobs }: { initialJobs: JobWithMatch[] }) {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low_unscored">("all");

  const highMatchJobs = initialJobs.filter((j) => (j.match?.match_score ?? 0) >= 70);
  const mediumMatchJobs = initialJobs.filter(
    (j) => (j.match?.match_score ?? 0) >= 50 && (j.match?.match_score ?? 0) < 70
  );
  const otherJobs = initialJobs.filter(
    (j) => (j.match?.match_score ?? 0) < 50 || j.match?.match_score === null
  );

  let displayedJobs = initialJobs;
  if (filter === "high") displayedJobs = highMatchJobs;
  if (filter === "medium") displayedJobs = mediumMatchJobs;
  if (filter === "low_unscored") displayedJobs = otherJobs;

  return (
    <div className="space-y-6">
      {/* Filters header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4 mt-6">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Filter Matches
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-ink text-white"
                : "bg-white text-muted hover:text-ink border border-line"
            }`}
          >
            All ({initialJobs.length})
          </button>
          <button
            onClick={() => setFilter("high")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
              filter === "high"
                ? "bg-accent text-white"
                : "bg-white text-muted hover:text-ink border border-line"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            70%+ Match ({highMatchJobs.length})
          </button>
          <button
            onClick={() => setFilter("medium")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
              filter === "medium"
                ? "bg-amber-500 text-white"
                : "bg-white text-muted hover:text-ink border border-line"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            50% - 69% Match ({mediumMatchJobs.length})
          </button>
          <button
            onClick={() => setFilter("low_unscored")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
              filter === "low_unscored"
                ? "bg-muted text-white"
                : "bg-white text-muted hover:text-ink border border-line"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Others ({otherJobs.length})
          </button>
        </div>
      </div>

      {displayedJobs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-16 text-center">
          <p className="text-sm text-muted">No jobs matching this filter.</p>
        </div>
      )}
    </div>
  );
}
