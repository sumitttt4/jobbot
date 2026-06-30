import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import { getJobsWithMatches } from "@/lib/data";
import { statusStyle, timeAgo, cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Applications = anything acted on (not still "new").
const TRACKED: JobStatus[] = ["applied", "saved", "viewed", "rejected"];

export default function ApplicationsPage() {
  const rows = getJobsWithMatches().filter(
    (j) => j.match && TRACKED.includes(j.match.status)
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-ink">Applications</h1>
        <p className="mt-1.5 text-muted">
          Every job you’ve viewed, saved, applied to, or rejected.
        </p>

        <Card className="mt-8 overflow-hidden">
          {rows.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Job", "Company", "Updated", "Status", "Match"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => {
                  const s = statusStyle(j.match!.status);
                  return (
                    <tr
                      key={j.id}
                      className="border-b border-line last:border-0 hover:bg-subtle"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/jobs/${j.id}`}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {j.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{j.company}</td>
                      <td className="px-4 py-3 text-muted">{timeAgo(j.created_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            s.className
                          )}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 tnum font-medium text-ink">
                        {j.match!.match_score ?? "—"}
                        {j.match!.match_score != null && "%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-16 text-center text-sm text-muted">
              No applications yet. Open a job and update its status to track it here.
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
