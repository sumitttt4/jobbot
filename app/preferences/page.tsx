import { Nav } from "@/components/Nav";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPreferences } from "@/lib/data";
import { savePreferences } from "./actions";

export const dynamic = "force-dynamic";

const JOB_TYPES = ["full-time", "contract", "freelance", "part-time"];
const LEVELS = ["entry", "mid", "senior"] as const;

export default function PreferencesPage() {
  const prefs = getPreferences();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-5 py-10">
        <p className="eyebrow mb-3">Step 2 · Preferences</p>
        <h1 className="text-3xl font-semibold text-ink">Your preferences</h1>
        <p className="mt-2 text-muted">
          Used to search and rank jobs. Separate multiple values with commas.
        </p>

        <Card className="mt-8">
          <CardBody className="p-6">
            <form action={savePreferences} className="space-y-6">
              <div>
                <Label htmlFor="preferred_roles">Preferred roles</Label>
                <Input
                  id="preferred_roles"
                  name="preferred_roles"
                  placeholder="Frontend Developer, React Developer"
                  defaultValue={prefs?.preferred_roles?.join(", ") ?? ""}
                />
              </div>

              <div>
                <Label htmlFor="preferred_locations">Locations</Label>
                <Input
                  id="preferred_locations"
                  name="preferred_locations"
                  placeholder="Remote, Bangalore, Berlin"
                  defaultValue={prefs?.preferred_locations?.join(", ") ?? ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_salary">Min salary (USD)</Label>
                  <Input
                    id="min_salary"
                    name="min_salary"
                    type="number"
                    min={0}
                    placeholder="80000"
                    defaultValue={prefs?.min_salary ?? ""}
                  />
                </div>
                <div>
                  <Label htmlFor="max_salary">Max salary (USD)</Label>
                  <Input
                    id="max_salary"
                    name="max_salary"
                    type="number"
                    min={0}
                    placeholder="120000"
                    defaultValue={prefs?.max_salary ?? ""}
                  />
                </div>
              </div>

              <fieldset>
                <Label>Experience level</Label>
                <div className="flex gap-2">
                  {LEVELS.map((lvl) => (
                    <label
                      key={lvl}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-md border border-line py-2 text-sm capitalize text-ink transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
                    >
                      <input
                        type="radio"
                        name="experience_level"
                        value={lvl}
                        defaultChecked={(prefs?.experience_level ?? "mid") === lvl}
                        className="sr-only"
                      />
                      {lvl}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <Label>Job types</Label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((t) => (
                    <label
                      key={t}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm capitalize text-ink transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-weak has-[:checked]:text-accent"
                    >
                      <input
                        type="checkbox"
                        name="job_type"
                        value={t}
                        defaultChecked={prefs?.job_type?.includes(t) ?? t === "full-time"}
                        className="sr-only"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" size="lg" className="w-full">
                Save &amp; start searching
              </Button>
            </form>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
