# JobBot — personal job search agent

A single-user tool that parses your resume, fetches real jobs, scores each one
against your profile (0–100% match), and writes tailored cover letters. No
accounts, no database to set up — it just runs.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + Lucide icons (white / black / one cobalt accent, Inter) |
| Jobs | JSearch (RapidAPI) — real listings |
| AI | Groq — `llama-3.3-70b-versatile` (resume parse, match scoring, cover letters) |
| Storage | Local JSON file at `.data/db.json` (gitignored) |
| PDF | `pdf-parse` (resume text extraction, runs locally) |

No auth, no Supabase, no UploadThing. It's a personal app.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The store is seeded with a resume and preferences,
so the app works immediately. Add keys to unlock the rest:

### Keys (`.env.local`)

```
JSEARCH_API_KEY=...        # https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch (free: 100/mo)
JSEARCH_API_HOST=jsearch.p.rapidapi.com
GROQ_API_KEY=...           # https://console.groq.com/keys (free)
```

- **No keys** → the dashboard shows sample jobs so you can see the UI.
- **JSEARCH_API_KEY** → “Search jobs” fetches real listings from Google Jobs.
- **GROQ_API_KEY** → jobs get AI match scores, and you can re-upload/parse a
  resume and generate cover letters.

## How it works

1. **Resume** (`/`) — your parsed resume + skills. Replace it by dropping a new
   PDF; `pdf-parse` extracts the text and Groq structures it.
2. **Preferences** (`/preferences`) — roles, locations, salary, level, job types.
3. **Dashboard** (`/dashboard`) — “Search jobs” calls JSearch (cached 24h to
   protect the free quota), then Groq scores each job. Cards show the match ring.
4. **Job detail** (`/jobs/[id]`) — match breakdown (matched / missing skills) and
   a generated cover letter. Set the status (new / viewed / applied / saved /
   rejected).
5. **Applications** (`/applications`) — everything you’ve acted on.

All data lives in `.data/db.json`. Delete that file to reset.

## Notes

- The local file store persists across restarts on your machine. On serverless
  hosts (Vercel) the filesystem is ephemeral — for a cloud deploy, swap
  `lib/store.ts` for a real database.
- JSearch free tier is 100 requests/month; the 24h cache and a 10-job scoring cap
  per search keep you well under it.

## Structure

```
app/
  page.tsx              # resume
  preferences/          # preferences form (server action)
  dashboard/            # job grid + search
  jobs/[id]/            # job detail + cover letter
  applications/         # tracker
  api/                  # upload-resume, jobs/search, generate-cover, jobs/[id], stats
components/             # ui primitives + JobCard, JobDetail, ResumeUpload, etc.
lib/
  store.ts              # local JSON file store
  data.ts              # data accessors over the store
  groq.ts  jsearch.ts  # AI + job APIs
  mock.ts              # seed resume/preferences + fallback jobs
  types.ts  utils.ts  config.ts
```
