import type { JobStatus } from "./types";

/** Tailwind-friendly className joiner. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const ACCENT = "#2563EB";
const NEUTRAL = "#A3A3A3";

/**
 * Match-score styling. One accent only: strong matches use the accent color,
 * weaker ones fade to neutral gray. No green/yellow/red.
 */
export function scoreColor(score: number | null | undefined): {
  text: string;
  hex: string;
  strong: boolean;
} {
  const s = score ?? 0;
  const strong = s >= 75;
  return {
    text: strong ? "text-accent" : "text-muted",
    hex: strong ? ACCENT : NEUTRAL,
    strong,
  };
}

// Status badges are monochrome; only "applied" carries the accent.
const STATUS_STYLES: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "border border-line bg-subtle text-muted" },
  viewed: { label: "Viewed", className: "border border-line bg-subtle text-muted" },
  applied: { label: "Applied", className: "border border-transparent bg-accent-weak text-accent" },
  replied: { label: "Replied", className: "border border-transparent bg-green-50 text-green-700" },
  interviewing: { label: "Interviewing", className: "border border-transparent bg-amber-50 text-amber-700" },
  offer: { label: "Offer", className: "border border-transparent bg-green-100 text-green-800" },
  no_reply: { label: "No reply", className: "border border-line bg-white text-faint" },
  ghosted: { label: "Ghosted", className: "border border-line bg-subtle text-faint" },
  saved: { label: "Saved", className: "border border-ink/15 bg-white text-ink" },
  rejected: { label: "Rejected", className: "border border-line bg-white text-faint" },
};

export function statusStyle(status: JobStatus) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.new;
}

/** Best-effort extraction of the first JSON object from an LLM response. */
export function extractJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to slicing from the first { to the last }.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Could not parse JSON from model response");
  }
}

export function formatSalary(salary?: string | null): string {
  return salary && salary.trim() ? salary : "Not disclosed";
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
