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
  const system = `You are a job matching expert. Compare the resume to the job description.
Respond with ONLY valid JSON:
{"score":0,"matched_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"recommendation":""}
score is an integer 0-100.`;

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
  const system = `You are a professional cover letter writer. Write a 150-word cover letter.
Requirements:
- Address the hiring manager by company name
- Mention 2-3 specific skills from the resume that match the role
- Show genuine enthusiasm for the company
- End with a call to action
- Tone: confident, professional, not generic
- Do NOT use generic phrases like "I am writing to express my interest"
- Make it sound human, not AI-generated
Output ONLY the cover letter text, no preamble or sign-off boilerplate beyond a normal closing.`;

  const user = `Company: ${company ?? "the company"}
Resume:
${JSON.stringify(resume)}

Job Description:
${jobDescription}`;

  return (await complete(system, user, { temperature: 0.6, maxTokens: 600 })).trim();
}
