import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, FileText, Globe2,
  Layers3, PenLine, Sparkles, Target,
} from 'lucide-react';

const templates = [
  { name: 'The Meridian', category: 'Modern · Two-column', style: 'meridian' },
  { name: 'The Clifton', category: 'Classic · Editorial', style: 'clifton' },
  { name: 'The Sora', category: 'Minimal · Technical', style: 'sora' },
];

function ResumeCard({ name, category, style }: { name: string; category: string; style: string }) {
  return <article className="group min-w-0">
    <div className="resume-template-frame rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_35px_-24px_rgba(15,23,42,.3)] transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-300 group-hover:shadow-[0_22px_46px_-30px_rgba(23,54,93,.16)]">
      <div className={`template-sheet template-${style} mx-auto aspect-[.76] max-w-[248px] overflow-hidden border border-slate-100 bg-white p-[9%]`}>
        <div className={style === 'meridian' ? 'template-meridian-layout' : ''}>
          <header className="template-heading">
            <div className="template-name">{style === 'clifton' ? 'JORDAN' : 'Jordan Morgan'}</div>
            <div className="template-role">{style === 'clifton' ? 'MORGAN' : 'Product designer · Seattle, WA'}</div>
            {style !== 'clifton' && <div className="template-contact">jordan.morgan@email.com · portfolio.com</div>}
          </header>
          {style === 'meridian' && <aside className="template-side">
            <div className="template-kicker">CONTACT</div><div className="template-lines short" />
            <div className="template-kicker">SKILLS</div><div className="template-lines" /><div className="template-lines short" /><div className="template-lines" /><div className="template-lines short" />
            <div className="template-kicker">EDUCATION</div><div className="template-lines" /><div className="template-lines short" />
          </aside>}
          <div className="template-body">
            <section><div className="template-section-title">{style === 'clifton' ? 'PROFILE' : 'PROFILE'}</div><div className="template-lines" /><div className="template-lines" /><div className="template-lines short" /></section>
            <section><div className="template-section-title">EXPERIENCE</div><div className="template-job"><strong>Senior Product Designer</strong><span>Northstar Studio · 2021 — Present</span></div><div className="template-lines" /><div className="template-lines short" /><div className="template-job"><strong>Product Designer</strong><span>Independent · 2018 — 2021</span></div><div className="template-lines" /><div className="template-lines" /></section>
            {style !== 'meridian' && <section><div className="template-section-title">{style === 'sora' ? 'SELECTED SKILLS' : 'EDUCATION'}</div><div className="template-lines" /><div className="template-lines short" /></section>}
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 px-1 pt-4">
      <div><h3 className="text-sm font-semibold text-slate-900">{name}</h3><p className="mt-0.5 text-xs text-slate-500">{category}</p></div>
      <Link to={`/register?template=${encodeURIComponent(style === 'meridian' ? 'Meridian' : style === 'clifton' ? 'Clifton' : 'Sora')}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[var(--cf-accent-text)] transition hover:bg-[var(--cf-accent-soft)] hover:text-[var(--cf-navy)]">Use template <ArrowUpRight size={14} /></Link>
    </div>
  </article>;
}

export const LandingPage: React.FC = () => (
  <div className="landing-page min-h-screen bg-[var(--cf-canvas)] text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[var(--cf-canvas)]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="CareerForgeAI home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cf-navy)] text-white"><Layers3 size={18} /></span>
          <span className="text-[17px] font-bold tracking-[-.04em]">careerforge<span className="text-[var(--cf-accent-text)]">.ai</span></span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#templates" className="transition hover:text-slate-950">Resume templates</a>
          <a href="#how-it-works" className="transition hover:text-slate-950">How it works</a>
          <a href="#features" className="transition hover:text-slate-950">Features</a>
        </nav>
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Link to="/login" className="px-2 py-2 text-sm font-medium text-slate-700 transition hover:text-[var(--cf-accent-text)]">Sign in</Link>
          <Link to="/register" className="rounded-lg bg-[var(--cf-navy)] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--cf-navy-hover)] sm:px-4 sm:text-sm">Get started <span className="hidden sm:inline">free</span></Link>
        </div>
      </div>
    </header>

    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1fr_.92fr] lg:gap-16 lg:pb-24 lg:pt-24">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-white px-3 py-1.5 text-xs font-medium text-[var(--cf-accent-text)]"><Sparkles size={14} /> Your next chapter starts here</div>
          <h1 className="text-[2.75rem] font-semibold leading-[1.05] tracking-[-.055em] text-[#102a43] sm:text-6xl">Make your next move <span className="font-serif font-medium italic text-[#315f93]">your best one.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">A more thoughtful way to tell your career story. Build a resume that sounds like you, see how it fits a real role, and bring every application into focus.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--cf-navy)] px-6 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(23,54,93,.24)] transition hover:-translate-y-0.5 hover:bg-[var(--cf-navy-hover)]">Build your resume <ArrowRight size={16} /></Link>
            <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">Explore your workspace</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#386ba3]" /> Simple, readable templates</span>
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#386ba3]" /> Your work, saved privately</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[550px] lg:ml-auto">
          <div className="absolute -right-3 top-8 h-[85%] w-[82%] rotate-[5deg] rounded-2xl border border-[#e2e8f0] bg-[#eaf0f8] sm:right-3" />
          <div className="relative rotate-[-2deg] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-38px_rgba(15,23,42,.28)] sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#6b8db4]" /><span className="text-xs font-semibold text-slate-700">Your resume, refined</span></div>
              <span className="rounded-md bg-[#eff6ff] px-2.5 py-1 text-[10px] font-semibold text-[var(--cf-accent-text)]">LIVE PREVIEW</span>
            </div>
            <div className="mx-auto max-w-[370px] border border-slate-100 p-6 sm:p-8">
              <div className="border-b border-slate-200 pb-4"><div className="text-2xl font-semibold tracking-tight text-slate-900">Jordan Morgan</div><p className="mt-1 text-xs text-slate-500">Product Designer · Seattle, WA</p><p className="mt-2 text-[9px] text-slate-500">jordan.morgan@email.com &nbsp;·&nbsp; portfolio.com</p></div>
              <div className="mt-5 space-y-4 text-[10px]">
                <section><h3 className="mb-1.5 text-[9px] font-bold tracking-[.16em] text-[var(--cf-accent-text)]">PROFILE</h3><p className="leading-[1.7] text-slate-600">Product designer creating clear, human-centered digital experiences. I connect customer insight with thoughtful design to help teams solve meaningful problems.</p></section>
                <section><h3 className="mb-2 text-[9px] font-bold tracking-[.16em] text-[var(--cf-accent-text)]">EXPERIENCE</h3><div className="flex justify-between"><strong className="text-slate-800">Senior Product Designer</strong><span className="text-slate-500">2021 — Present</span></div><p className="mt-1 text-slate-500">Northstar Studio · Led product design across core platform experiences.</p><div className="mt-3 flex justify-between"><strong className="text-slate-800">Product Designer</strong><span className="text-slate-500">2018 — 2021</span></div><p className="mt-1 text-slate-500">Independent · Partnered with early-stage teams to shape and launch products.</p></section>
                <section><h3 className="mb-2 text-[9px] font-bold tracking-[.16em] text-[var(--cf-accent-text)]">SELECTED SKILLS</h3><div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[9px] text-slate-600">Product strategy</span><span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[9px] text-slate-600">Figma</span><span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[9px] text-slate-600">User research</span></div></section>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:-left-6"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cf-accent-soft)] text-[var(--cf-accent-text)]"><Target size={17} /></div><div><p className="text-xs font-semibold text-slate-800">Built around your next role</p><p className="mt-0.5 text-[10px] text-slate-500">Clear insights, useful next steps</p></div></div>
          </div>
        </div>
      </section>

      <section id="templates" className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[var(--cf-accent-text)]">Made to make an impression</p><h2 className="text-3xl font-semibold tracking-[-.04em] text-[#102a43] sm:text-4xl">A good first page changes everything.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Start with a layout that fits your experience. Every template is clean, readable, and ready for your own story.</p></div>
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cf-accent-text)] hover:text-[var(--cf-navy)]">Explore all templates <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => <ResumeCard key={template.name} {...template} />)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-xl"><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[var(--cf-accent-text)]">Thoughtfully connected</p><h2 className="text-3xl font-semibold tracking-[-.04em] text-[#102a43] sm:text-4xl">Everything you need. Nothing getting in your way.</h2></div>
        <div id="features" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText, title: 'A resume that reads clearly', body: 'Build and refine a clean, ATS-readable resume, then compare its language with a real job post.' },
            { icon: Globe2, title: 'A portfolio that feels like you', body: 'Show your work in a considered layout and share a public link when you are ready.' },
            { icon: PenLine, title: 'A more personal introduction', body: 'Create an editable cover-letter draft with your profile and a job description.' },
            { icon: BriefcaseBusiness, title: 'A calmer job search', body: 'Keep applications, interviews and follow-ups together in a private workspace.' },
          ].map(({ icon: Icon, title, body }) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#b8cbe0] hover:shadow-[0_14px_35px_-28px_rgba(23,54,93,.16)]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4fb] text-[var(--cf-accent-text)]"><Icon size={19} /></div><h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></article>)}
        </div>
      </section>
    </main>

    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© 2026 CareerForgeAI · Make your next move with confidence.</span><Link to="/register" className="inline-flex items-center gap-1 font-semibold text-[var(--cf-accent-text)] hover:text-[var(--cf-navy)]">Start building <ArrowRight size={13} /></Link></div>
    </footer>
  </div>
);
