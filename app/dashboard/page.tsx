import { Briefcase } from "lucide-react";
import { Nav } from "@/components/Nav";
import { DashboardJobsList } from "@/components/DashboardJobsList";
import { SearchButton } from "@/components/SearchButton";
import { getJobsWithMatches, getResume, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tnum text-2xl font-semibold text-ink">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const resume = getResume();
  const jobs = getJobsWithMatches();
  const stats = getStats();
  const name = resume?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-ink">
              {greeting()}, {name}
            </h1>
            <p className="mt-1.5 text-muted">Jobs JobBot matched to your resume.</p>
          </div>
          <SearchButton />
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
          <div className="bg-white p-5">
            <Stat label="Jobs found" value={stats.total_jobs_found} />
          </div>
          <div className="bg-white p-5">
            <Stat label="Applied" value={stats.applied_count} />
          </div>
          <div className="bg-white p-5">
            <Stat label="Saved" value={stats.saved_count} />
          </div>
          <div className="bg-white p-5">
            <Stat label="Avg match" value={`${stats.match_rate}%`} />
          </div>
        </div>

        {/* Jobs */}
        <div className="mt-8 flex items-center justify-between">
          <p className="eyebrow">Matches</p>
          <span className="text-xs text-muted">{jobs.length} jobs</span>
        </div>

        {jobs.length ? (
          <DashboardJobsList initialJobs={jobs} />
        ) : (
          <div className="mt-3 flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
            <Briefcase className="h-7 w-7 text-faint" strokeWidth={1.5} />
            <p className="text-sm text-muted">
              No jobs yet. Hit “Search jobs” to fetch and score matches.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
