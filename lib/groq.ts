import Groq from "groq-sdk";
import { extractJson } from "./utils";
import type { MatchResult, ParsedResume } from "./types";

// Groq free tier: ~30 requests/minute. All AI tasks use one model.
const MODEL = "llama-3.3-70b-versatile";

let client: Groq | null = null;
function groq(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");
    client = new Groq({ apiKey });
  }
  return client;
}

async function complete(
  system: string,
  user: string,
  opts: { json?: boolean; temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const res = await groq().chat.completions.create({
    model: MODEL,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1500,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

// ─── Prompt 1: Parse resume ──────────────────────────────────────────────
export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const system = `You are a resume parser. Extract the following from the resume:
- Full name
- Email
- Phone
- Skills (list)
- Work experience (company, role, duration for each)
- Education (degree, institution, year)
- Years of total experience
Output ONLY valid JSON with this exact shape:
{"name":"","email":"","phone":"","skills":[],"experience":[{"company":"","role":"","duration":""}],"education":[{"degree":"","institution":"","year":""}],"years_experience":0}
No other text.`;

  const raw = await complete(system, `Resume:\n${resumeText}`, { json: true, temperature: 0 });
  const parsed = extractJson<Partial<ParsedResume>>(raw);
  return {
    name: parsed.name ?? "",
    email: parsed.email ?? "",
    phone: parsed.phone ?? "",
    skills: parsed.skills ?? [],
    experience: parsed.experience ?? [],
    education: parsed.education ?? [],
    years_experience: parsed.years_experience ?? 0,
  };
}

// ─── Prompt 2: Score job match ───────────────────────────────────────────
export async function scoreMatch(
  resume: ParsedResume,
  jobDescription: string
): Promise<MatchResult> {
  const system = `You are a professional software engineer or recruiter. Compare the candidate's resume data to the job description.
Respond with ONLY valid JSON:
{"score":0,"matched_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"recommendation":""}
score is an integer 0-100.

CRITICAL INSTRUCTIONS FOR TEXT FIELDS (strengths, weaknesses, recommendation):
1. Do NOT use any emojis, icons, or markdown stars/asterisks for emphasis.
2. Do NOT use AI jargon, overly positive hype, or boilerplate phrasing (e.g., "This candidate is an outstanding match...", "Perfect fit!", "Stellar skills").
3. Write the strengths, weaknesses, and recommendation as brief, objective, and candid notes in a professional, direct, human tone.
4. Keep the recommendation under 2 sentences. Be realistic and direct (e.g., "Strong frontend match. RAM requirements and SQL experience are missing but can be learned quickly.").`;

  const user = `Resume:\n${JSON.stringify(resume)}\n\nJob Description:\n${jobDescription}`;
  const raw = await complete(system, user, { json: true, temperature: 0.2 });
  const r = extractJson<Partial<MatchResult>>(raw);
  return {
    score: Math.max(0, Math.min(100, Math.round(r.score ?? 0))),
    matched_skills: r.matched_skills ?? [],
    missing_skills: r.missing_skills ?? [],
    strengths: r.strengths ?? [],
    weaknesses: r.weaknesses ?? [],
    recommendation: r.recommendation ?? "",
  };
}

// ─── Prompt 3: Generate cover letter ─────────────────────────────────────
export async function generateCoverLetter(
  resume: ParsedResume,
  jobDescription: string,
  company?: string
): Promise<string> {
  const system = `You are writing a cover letter as this person, in first person. You are a real developer applying for a job. Write around 120 words.

STYLE — write like a person, not a language model:
- Open with something specific about the company or role. Not "Dear Hiring Manager" or "I am writing to express my interest."
- Use short, natural sentences. Mix long and short. A human would.
- Mention 2-3 concrete technical skills from the resume that match the job. Be specific (e.g. "I built a design system in React + TypeScript at Metry AI" not "I have experience with React").
- End with one sentence about wanting to talk further. Keep it casual-professional, not stiff.

BANNED WORDS/PHRASES — do not use any of these:
"passionate", "passion", "thrive", "leverage", "synergy", "excited", "thrilled", "eager", "enthusiasm", "enthusiastic", "stellar", "outstanding", "exceptional", "honed", "seasoned", "deep expertise", "proven track record", "I am confident that", "I believe I would be", "unique opportunity", "fast-paced environment", "hit the ground running", "team player", "above and beyond"

Do NOT use exclamation marks. Do NOT use emojis.

EXAMPLE OF THE RIGHT TONE (do not copy this, just match the style):
"Your approach to building developer tools in the open caught my attention — it lines up with how I think about product work. At Metry AI I shipped a component library used across three products, built on React and TypeScript with Radix primitives. Before that I worked on a Next.js app at Fedup Studio where I owned the frontend end-to-end, from Figma handoff to deployment on Vercel. I would be glad to walk through my work in more detail if there is interest."

OUTPUT: Just the letter body. No "Dear...", no "Sincerely...", no signature, no subject line.`;

  const user = `Company: ${company ?? "the company"}
Resume:
${JSON.stringify(resume)}

Job Description:
${jobDescription}`;

  return (await complete(system, user, { temperature: 0.7, maxTokens: 500 })).trim();
}

