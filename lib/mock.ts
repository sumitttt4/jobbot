// Seed + fallback data for the personal app.
// - seedResume / seedPreferences: Sumit's real profile, used to initialize the
//   local store on first run.
// - mockJobs: only shown as a fallback when JSearch isn't configured, so the
//   dashboard isn't empty.

import type {
  Job,
  JobPreferences,
  JobStatus,
  JobWithMatch,
  ParsedResume,
  Stats,
} from "./types";

export const seedResume: ParsedResume = {
  name: "Sumit Sharma",
  email: "sumitsharma9128@gmail.com",
  phone: "",
  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "React Native",
    "Tailwind CSS",
    "Framer Motion",
    "Figma",
    "Design Systems",
    "REST APIs",
    "Supabase",
    "Git",
    "Vercel",
    "UI/UX",
    "Accessibility",
    "Performance Optimization",
  ],
  experience: [
    { company: "Fedup Studio", role: "Independent Design Engineer", duration: "01/2026 – Present" },
    { company: "Metry AI", role: "Design Engineer", duration: "08/2025 – 01/2026" },
    { company: "Glyph", role: "Founder / Full-Stack Engineer", duration: "12/2025 – Present" },
  ],
  education: [
    {
      degree: "Master of Computer Applications (MCA)",
      institution: "Acharya Institute of Graduate Studies",
      year: "2024",
    },
  ],
  years_experience: 2,
};

export const seedPreferences: JobPreferences = {
  preferred_roles: [
    "Frontend Engineer",
    "Frontend Design Engineer",
    "React Developer",
    "Next.js Developer",
  ],
  preferred_locations: ["Remote", "Bengaluru"],
  min_salary: null,
  max_salary: null,
  experience_level: "mid",
  job_type: ["full-time"],
};

// ── Fallback sample jobs (only used when JSearch isn't configured) ──────────
const DESC = `We're looking for a frontend engineer who cares about craft. You'll
own features end to end — Figma to deployed Next.js — and work closely with design
to ship fast, accessible, well-tested product.

Requirements
• Strong React + TypeScript + Next.js fundamentals
• Comfort with design systems and component architecture
• An eye for detail and a bias for shipping`;

function sample(
  i: number,
  title: string,
  company: string,
  location: string,
  salary: string,
  score: number,
  status: JobStatus,
  matched: string[],
  missing: string[],
  recommendation: string
): JobWithMatch {
  const base: Job = {
    id: `sample-${i}`,
    job_id: `sample-${i}`,
    title,
    company,
    location,
    salary,
    description: DESC,
    job_url: "https://example.com/apply",
    source: "sample",
    posted_date: new Date(Date.now() - i * 86_400_000).toISOString(),
    created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
  };
  return {
    ...base,
    match: {
      id: `m-${i}`,
      match_score: score,
      match_skills: {
        matched_skills: matched,
        missing_skills: missing,
        strengths: matched.slice(0, 2),
        weaknesses: missing.slice(0, 1),
        recommendation,
      },
      status,
      cover_letter: null,
    },
  };
}

export const mockJobs: JobWithMatch[] = [
  sample(0, "Senior Frontend Engineer", "Linear", "Remote", "USD 140k - 180k", 92, "new", ["React", "TypeScript", "Next.js", "Tailwind CSS"], ["Rust"], "Frontend stack lines up almost one-to-one. Rust is listed but probably not a dealbreaker."),
  sample(1, "Frontend Design Engineer", "Vercel", "Remote", "USD 130k - 170k", 88, "new", ["Next.js", "React", "TypeScript", "Design Systems"], ["Go"], "Design system experience is directly relevant. Go is backend — unlikely to be required day one."),
  sample(2, "Product Engineer", "Supabase", "Remote", "USD 120k - 160k", 81, "new", ["React", "TypeScript", "Supabase"], ["Elixir"], "Good overlap on the frontend side. Elixir is their backend — would need to pick that up."),
  sample(3, "React Developer", "Razorpay", "Bengaluru, India", "₹ 25L - 40L", 76, "new", ["React", "TypeScript", "REST APIs"], ["Payments domain"], "Tech stack matches. No payments experience but the core skills transfer."),
  sample(4, "UI Engineer", "Figma", "Remote", "USD 140k - 185k", 63, "new", ["React", "TypeScript"], ["WebGL", "Canvas internals"], "React and TS check out but this role needs heavy canvas/rendering work."),
  sample(5, "Frontend Engineer", "Zomato", "Bengaluru, India", "₹ 20L - 35L", 58, "new", ["React", "JavaScript"], ["Scale systems", "Java"], "Basic frontend skills match. Role skews toward large-scale infra they want Java for."),
];

export function mockStats(): Stats {
  return {
    total_jobs_found: mockJobs.length,
    applied_count: 0,
    saved_count: 0,
    match_rate: Math.round(
      mockJobs.reduce((s, j) => s + (j.match?.match_score ?? 0), 0) / mockJobs.length
    ),
  };
}
