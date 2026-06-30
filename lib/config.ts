// Personal, single-user app. No auth, no external database — data lives in a
// local JSON file (see lib/store.ts). Only two optional integrations:
//   • JSearch (RapidAPI) for real job listings
//   • Groq for resume parsing, match scoring, and cover letters
// When a key is missing the app degrades gracefully (mock jobs / no scores).

export const hasGroq = !!process.env.GROQ_API_KEY;

export const hasJSearch = !!process.env.JSEARCH_API_KEY;

export const hasSmtp = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);
