"use server";

import { redirect } from "next/navigation";
import { savePreferences as persist } from "@/lib/data";
import type { ExperienceLevel } from "@/lib/types";

/** Persist job preferences to the local store, then go to the dashboard. */
export async function savePreferences(formData: FormData) {
  const splitCsv = (v: FormDataEntryValue | null) =>
    String(v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const minSalary = Number(formData.get("min_salary"));
  const maxSalary = Number(formData.get("max_salary"));

  persist({
    preferred_roles: splitCsv(formData.get("preferred_roles")),
    preferred_locations: splitCsv(formData.get("preferred_locations")),
    min_salary: Number.isFinite(minSalary) && minSalary > 0 ? minSalary : null,
    max_salary: Number.isFinite(maxSalary) && maxSalary > 0 ? maxSalary : null,
    experience_level: (String(formData.get("experience_level") || "mid") as ExperienceLevel),
    job_type: formData.getAll("job_type").map(String),
  });

  redirect("/dashboard");
}
