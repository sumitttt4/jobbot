import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { JobDetail } from "@/components/JobDetail";
import { getJobWithMatch } from "@/lib/data";
import { hasGroq } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function JobPage({ params }: { params: { id: string } }) {
  const job = getJobWithMatch(params.id);
  if (!job) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Dashboard
        </Link>
        <JobDetail job={job} canGenerate={hasGroq} />
      </main>
    </>
  );
}
