import { Nav } from "@/components/Nav";
import { ApplicationTracker } from "@/components/ApplicationTracker";
import { getJobsWithMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
  const jobs = getJobsWithMatches();

  // Count jobs in each stage for the summary bar
  const applied = jobs.filter((j) => j.match?.status === "applied").length;
  const replied = jobs.filter((j) => j.match?.status === "replied").length;
  const interviewing = jobs.filter((j) => j.match?.status === "interviewing").length;
  const offers = jobs.filter((j) => j.match?.status === "offer").length;
  const waiting = jobs.filter(
    (j) => j.match && ["no_reply", "ghosted"].includes(j.match.status)
  ).length;
  const rejected = jobs.filter((j) => j.match?.status === "rejected").length;
  const total = applied + replied + interviewing + offers + waiting + rejected;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-ink">Applications</h1>
        <p className="mt-1.5 text-muted">
          Track where each application stands — from applied to offer.
        </p>

        {/* Summary bar */}
        {total > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-6">
            <SummaryCell label="Applied" value={applied} />
            <SummaryCell label="Replied" value={replied} />
            <SummaryCell label="Interviewing" value={interviewing} />
            <SummaryCell label="Offers" value={offers} />
            <SummaryCell label="No reply" value={waiting} />
            <SummaryCell label="Rejected" value={rejected} />
          </div>
        )}

        <ApplicationTracker jobs={jobs} />
      </main>
    </>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 text-center">
      <span className="tnum block text-xl font-semibold text-ink">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
