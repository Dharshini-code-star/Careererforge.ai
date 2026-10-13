# CareerForgeAI

A responsive career workspace built with React, TypeScript, Tailwind CSS, Express, and MongoDB.

## Features

- Email/password registration and login with bcrypt-hashed passwords and JWT-protected APIs.
- MongoDB-backed resume, portfolio, cover-letter, and application workspaces.
- ATS-readable resume editor with a live preview, transparent content-based readiness checks, job-description keyword matching, and professionally formatted PDF export.
- Authenticated PDF/DOCX resume uploads with server-side text extraction, private original-file storage, editable extracted fields, side-by-side original/version comparison, and separate saved improvements.
- Fact-grounded, individually reviewable AI resume suggestions, with automatic score recalculation after accepted edits. Uploaded originals are never overwritten.
- Portfolio Studio with four website templates, live responsive preview, theme accents, image upload, publish/unpublish controls, and a public share page. Publishing creates a stable public slug.
- AI-assisted cover-letter generation through Gemini, with editable saved drafts and text / PDF export. AI is opt-in and requires a server-side key.
- Job-specific cover-letter drafts are grounded in a selected, saved resume; discovered-job details show separate resume-quality, match, and readiness estimates with actions to prepare a tailored resume, cover letter, and application-tracker entry.
- Job discovery includes India, international, and remote-worldwide markets, transparent provider status, direct original application links, and an Excel `.xlsx` export for the currently filtered listings.
- Private, MongoDB-backed job-description library with saved-resume selection, per-job skill and keyword matching, resume evidence, readiness breakdowns, gaps, and next-step recommendations.
- Resume-driven discovery from public Arbeitnow and Remotive feeds, plus the official Adzuna API when configured. Listings retain provider attribution, posting metadata when present, direct application URLs, skill/readiness comparisons, save controls, and application-tracker integration.
- Direct search links for LinkedIn Jobs, Naukri, Indeed, Internshala, Wellfound, Adzuna, and company career pages when a supported listing API is unavailable; the app does not scrape or claim to import those results.
- Application-stage tracking and dashboard counts from saved records.

Resume quality scores are derived from explicit contact, core-section, word-count, experience-impact, skills, and extracted-text formatting checks; they are not validated against employer ATS systems. Job match compares only the selected saved resume with a job description the user supplied. Readiness is a separate, transparent heuristic covering detected skills, experience/project evidence, stated education, resume completeness, and job-specific terms. The app does not provide an external job feed, guarantee employment, or infer that an unmentioned qualification is absent. Missing resume text is a prompt to review, not proof of ineligibility. Generated AI text must be checked by the user.

Resume uploads support text-based PDF and DOCX files up to 5 MB (with a 20 MB expanded DOCX document limit). PDF and DOCX originals are stored privately in the user's MongoDB workspace. Extraction does not perform OCR; scanned PDFs without a readable text layer are rejected. The interface shows the original file and extracted content alongside the editable version. When an uploaded resume is saved, the editor creates a separate version linked to that original.

## Resume-to-job workflow

1. Upload a PDF/DOCX or create a resume in the resume studio, review the extracted or authored fields, and save the resume.
2. Saving or selecting a resume sets it as the account's selected job-matching resume. The selected version is loaded from the authenticated user's saved workspace; match requests do not accept client-supplied resume fields.
3. Add a job title, company, and description in Job Analyzer or Skill Gap & Readiness. Job descriptions are private user-provided records, not scraped or externally sourced postings.
4. Select a job and review its match score, identified skills/keywords, excerpts from the saved resume, readiness breakdown, gaps, and next steps. Updating the saved resume or job description allows the results to be recalculated against the new content.

Job matching and readiness are deterministic text comparisons, not AI-generated scores or employer ATS decisions. Standard skill extraction uses a maintained vocabulary plus a limited set of distinctive job-description terms; wording and requirements that are not detected should be reviewed against the original posting. Education and experience checks are based only on explicit text and may require manual verification.

Job discovery provider details:

- Arbeitnow's public API is used for live listings, mainly from Europe: [API](https://www.arbeitnow.com/api/job-board-api).
- Remotive's public API is used for remote listings. Requests are cached for six hours and limited to four provider calls per day; its API asks for source attribution and direct links, which are retained with each listing: [API terms](https://remotive.com/api-documentation).
- Adzuna requires an application ID and key from its [developer portal](https://developer.adzuna.com/). Set `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and a supported two-letter `ADZUNA_COUNTRY` in `server/.env`. Without credentials, the UI reports Adzuna as unavailable and offers its public search link.
- India discovery uses Adzuna's India market when credentials are present. International discovery uses `ADZUNA_COUNTRY` (default `gb`); remote-worldwide results are restricted to listings identified as remote. Remotive and Arbeitnow retain their provider attribution and direct URLs.
- LinkedIn Jobs, Naukri, Indeed, Internshala, Wellfound, and company career pages are not scraped. Where no authorized public integration is configured, the app opens their search pages instead.
- Discovery is on demand when a resume or search filter changes and can be manually refreshed. Provider results are deduplicated per user and provider ID in MongoDB. Remote/workplace and experience labels are shown only when provided or clearly inferable from listing text; missing salary/date fields stay blank.

## Requirements

- Node.js 20.16+ (20.x) or 22.3+ (22.x or later supported releases)
- MongoDB running locally or a MongoDB connection URI
- A Gemini API key only if AI cover-letter generation or resume improvement suggestions are required

## Setup

Install dependencies from the project root:

```powershell
npm run install:all
```

Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` to your MongoDB URI and replace `JWT_SECRET` with a randomly generated secret of at least 32 characters. For example:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Optionally set `GEMINI_API_KEY` in `server/.env` to enable AI cover-letter generation and resume improvement suggestions. Never put this key in the client or commit a populated `.env` file. Without the key, the API returns an explicit configuration error instead of fabricated AI output. Resume suggestions must quote the exact source text they replace, and the API rejects suggestions with unverified new numeric claims; users review and apply suggestions individually.

Start the server and client in separate terminals:

```powershell
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173`. The API is served on port `5000`; Vite proxies `/api` to the server. Configure `CLIENT_ORIGIN` when the frontend is hosted on a different origin.

MongoDB is required for persistence. The server exits with a clear startup error if the configured database is unavailable; it does not silently fall back to volatile in-memory storage.

## Production builds

```powershell
npm run build
```

This compiles the TypeScript server and runs the client type-check and Vite production build.
