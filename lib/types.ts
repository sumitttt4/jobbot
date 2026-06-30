// Shared domain types for JobBot.

export interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
  years_experience: number;
}

export interface MatchSkills {
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface MatchResult extends MatchSkills {
  score: number;
}

export type JobStatus =
  | "new"
  | "viewed"
  | "applied"
  | "saved"
  | "rejected";

export type ExperienceLevel = "entry" | "mid" | "senior";

export interface JobPreferences {
  preferred_roles: string[];
  preferred_locations: string[];
  min_salary: number | null;
  max_salary: number | null;
  experience_level: ExperienceLevel | null;
  job_type: string[];
}

export interface Job {
  id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  job_url: string;
  source: string;
  posted_date: string | null;
  created_at: string;
}

export interface JobMatch {
  id: string;
  job_id: string;
  user_id: string;
  match_score: number | null;
  match_skills: MatchSkills | null;
  status: JobStatus;
  cover_letter: string | null;
  created_at: string;
}

// A job joined with its match row — the shape the dashboard/detail pages consume.
export interface JobWithMatch extends Job {
  match: {
    id: string;
    match_score: number | null;
    match_skills: MatchSkills | null;
    status: JobStatus;
    cover_letter: string | null;
  } | null;
}

export interface Stats {
  total_jobs_found: number;
  applied_count: number;
  saved_count: number;
  match_rate: number; // avg match score across the user's jobs
}
