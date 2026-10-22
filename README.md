# CareerForgeAI
### AI-Powered Resume Optimization & Career Workspace

**Live Demo:** [careerforge-ai.vercel.app](https://careerforge-ai.vercel.app)

CareerForgeAI is a full-stack career development platform designed to help job seekers create ATS-readable resumes, evaluate their alignment with job descriptions, build professional portfolios, generate tailored cover letters, discover job opportunities, and manage applications from a centralized workspace.

Built with React, TypeScript, Tailwind CSS, Express, and MongoDB, the platform combines transparent, rule-based resume analysis with optional AI-assisted writing features to support a more structured and informed job-search process.

---

## Key Features

### 1. Resume Builder & Optimization
- Create and edit structured resumes with a live preview.
- Evaluate resume completeness and content quality using transparent, rule-based checks.
- Compare resume content against job-description keywords.
- Export professionally formatted resumes as PDF files.
- Upload text-based PDF and DOCX resumes for server-side text extraction.
- Review original documents alongside extracted and edited versions.
- Save improvements as separate versions without overwriting uploaded originals.
- Review AI-generated resume suggestions individually, with source-text verification and score recalculation after accepted edits.

### 2. Job Matching & Readiness Analysis
- Compare a selected, saved resume with a user-provided job description.
- Identify relevant skills, keywords, resume evidence, and potential gaps.
- Review a transparent readiness breakdown and recommended next steps.
- Maintain a private library of job descriptions.
- Recalculate results when the saved resume or job description changes.

### 3. Portfolio Studio
- Build professional portfolios using four website templates.
- Customize themes and accent colors.
- Preview layouts responsively.
- Upload images and manage portfolio content.
- Publish or unpublish portfolios using stable public URLs.

### 4. AI-Assisted Cover Letters
- Generate cover-letter drafts with Google's Gemini API.
- Ground job-specific drafts in a selected, saved resume.
- Edit and save generated drafts.
- Export cover letters as text or PDF.
- Use AI features only when the required server-side API key is configured.

### 5. Job Discovery
- Explore job listings from supported public providers, including Arbeitnow and Remotive.
- Integrate Adzuna when valid API credentials are configured.
- Explore India, international, and remote opportunities where supported by provider availability.
- View original application links and provider attribution.
- Compare listings against the selected resume.
- Save relevant opportunities and connect them to the application tracker.
- Export currently filtered listings to Excel (`.xlsx`).
- Access search pages for LinkedIn Jobs, Naukri, Indeed, Internshala, Wellfound, and company career sites when an authorized listing integration is unavailable.

### 6. Application Tracking & Dashboard
- Track applications through their respective stages.
- View dashboard counts based on saved records.
- Connect job discovery and career preparation workflows with application tracking.

### 7. Secure User Workspaces
- Email and password authentication.
- Password hashing with bcrypt.
- JWT-protected API endpoints.
- MongoDB-backed user data and workspaces.
- Private storage of uploaded resume files within the user's MongoDB workspace.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB |
| Authentication | JWT, bcrypt |
| AI Integration | Google Gemini API |
| Document Processing | PDF and DOCX text extraction |
| Resume Analysis | Rule-based content checks and keyword matching |
| Job Discovery | Arbeitnow, Remotive, optional Adzuna |
| Export | PDF and Excel (`.xlsx`) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Resume-to-Job Workflow

1. **Create or upload a resume:** Build a resume in the editor or upload a supported PDF/DOCX file.
2. **Review and save:** Verify extracted information, edit content, and save the resume to the user's workspace.
3. **Add a job description:** Enter the role, company, and job description in Job Analyzer or Skill Gap & Readiness.
4. **Analyze alignment:** Review matched skills, keywords, resume evidence, readiness estimates, and potential gaps.
5. **Prepare application materials:** Create a tailored resume and cover letter, where supported.
6. **Discover and track opportunities:** Explore available listings, save relevant roles, and manage application progress.

The selected resume is retrieved from the authenticated user's saved workspace. Job-matching requests do not rely on client-submitted resume fields.

---

## Analysis Methodology & Limitations

CareerForgeAI is designed to make resume and job-alignment feedback transparent.

- **Resume quality:** Based on explicit checks involving contact details, core sections, word count, experience impact, skills, and extracted-text formatting.
- **Job match:** Based on text comparisons between the selected saved resume and a job description supplied by the user.
- **Readiness:** Uses a heuristic based on detected skills, experience and project evidence, stated education, resume completeness, and job-specific terms.

These scores are estimates, not validated employer ATS results, hiring decisions, or guarantees of employment. Skill extraction may not identify every relevant requirement, and education or experience checks may require manual review. Missing resume text does not establish ineligibility.

AI-generated content should be reviewed and verified by the user before use.

---

## Job Discovery Providers

### Arbeitnow
Uses the [Arbeitnow Job Board API](https://www.arbeitnow.com/api/job-board-api) for public job listings, primarily from Europe.

### Remotive
Uses the [Remotive API](https://remotive.com/api-documentation) for remote job listings. Requests are cached for six hours and limited to four provider calls per day. Provider attribution and direct application links are retained.

### Adzuna
Adzuna integration requires credentials from the [Adzuna Developer Portal](https://developer.adzuna.com/).

Configure the following server-side environment variables:

- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `ADZUNA_COUNTRY`

Without credentials, Adzuna is reported as unavailable and its public search page is offered instead.

### External Job Search
LinkedIn Jobs, Naukri, Indeed, Internshala, Wellfound, and company career pages are not scraped. When a supported listing API is unavailable, the application provides direct search links rather than claiming to import listings from those sites.

---

## File Upload & Data Handling

- Supported formats: text-based PDF and DOCX.
- Maximum upload size: 5 MB.
- Expanded DOCX document limit: 20 MB.
- Scanned PDFs without a readable text layer are rejected because OCR is not performed.
- Original uploads are stored privately in the user's MongoDB workspace.
- Saving edited uploaded content creates a separate version linked to the original.

---

## Getting Started

### Prerequisites

- Node.js 20.16+ (20.x) or 22.3+ (22.x or later supported releases).
- MongoDB running locally or an accessible MongoDB connection URI.
- A Gemini API key for optional AI cover-letter generation and resume improvement suggestions.

### 1. Install Dependencies

Run from the project root:

```powershell
npm run install:all
```

### 2. Configure Environment Variables

Copy `server/.env.example` to `server/.env`.

Configure your MongoDB connection:

```env
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_random_secret_of_at_least_32_characters
```

Generate a strong JWT secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

To enable optional AI features, add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Never commit populated environment files or expose private API keys in frontend code. Without the Gemini key, AI features return a configuration error rather than fabricated output.

### 3. Start the Development Environment

Run the backend in one terminal:

```powershell
npm run dev:server
```

Run the frontend in another terminal:

```powershell
npm run dev:client
```

Open the frontend at:

[http://localhost:5173](http://localhost:5173)

The backend runs on port `5000`, and the Vite development server proxies `/api` requests to the backend. Configure `CLIENT_ORIGIN` when the frontend is hosted on a different origin.

### 4. Build for Production

Run from the project root:

```powershell
npm run build
```

This compiles the TypeScript backend and runs the frontend type-check and Vite production build.

MongoDB is required for persistent operation. The backend exits with a startup error if the configured database is unavailable; it does not silently switch to in-memory storage.

---

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB

Configure production environment variables in the relevant hosting dashboard. Keep secrets on the server and configure the backend's `CLIENT_ORIGIN` to match the deployed frontend origin.

---

## Project Goals

CareerForgeAI aims to make career preparation more organized by bringing resume creation, job-specific analysis, portfolio publishing, cover-letter drafting, job discovery, and application tracking into one workspace.

The platform emphasizes transparent analysis, user-reviewed AI assistance, private user workspaces, and clear distinctions between available integrations and external search links.

---

## Disclaimer

CareerForgeAI provides career preparation and job-search assistance. Its scores are heuristic estimates and are not official ATS evaluations, recruitment decisions, or employment guarantees. Users should verify resume content, AI-generated text, job requirements, and application details before submitting them.

---

**CareerForgeAI — Prepare with clarity. Apply with confidence.**
