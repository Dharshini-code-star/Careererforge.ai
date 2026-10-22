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

1. **Create or upload a resume:** Build a resume
