import { Nav } from "@/components/Nav";
import { Card, CardBody } from "@/components/ui/card";
import { ResumeUpload } from "@/components/ResumeUpload";
import { getResume } from "@/lib/data";
import { hasGroq } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const resume = await getResume();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-5 py-16">
        <p className="eyebrow mb-3">Step 1 · Resume</p>
        <h1 className="text-3xl font-semibold text-ink">Your resume</h1>
        <p className="mt-2 text-muted">
          JobBot reads your resume, then finds and scores jobs that fit you.
        </p>

        <Card className="mt-8">
          <CardBody className="p-6">
            <ResumeUpload initial={resume ?? null} canUpload={hasGroq} />
          </CardBody>
        </Card>
      </main>
    </>
  );
}
