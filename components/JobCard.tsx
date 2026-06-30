import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { MatchScore } from "@/components/MatchScore";
import { statusStyle, formatSalary, cn } from "@/lib/utils";
import type { JobWithMatch } from "@/lib/types";

export function JobCard({ job }: { job: JobWithMatch }) {
  const status = job.match?.status ?? "new";
  const s = statusStyle(status);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col rounded-lg border border-line bg-white p-4 transition-colors hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{job.company}</p>
          <h3 className="mt-0.5 truncate text-[15px] font-semibold leading-snug text-ink">
            {job.title}
          </h3>
        </div>
        <MatchScore score={job.match?.match_score} size={44} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="truncate">{job.location}</span>
      </div>
      <p className="mt-1 tnum text-sm text-ink">{formatSalary(job.salary)}</p>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            s.className
          )}
        >
          {s.label}
        </span>
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-muted transition-colors group-hover:text-accent">
          View
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}
