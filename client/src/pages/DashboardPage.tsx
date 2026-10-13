import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BriefcaseBusiness, FileText, Globe2, PenLine, Search, Sparkles,
  Target, UserRound, WandSparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { DashboardSummary } from '../types';

const modules = [
  { title: 'Resume builder', description: 'Create a polished resume and tailor it to a real job description.', path: '/resumes', action: 'Continue building', icon: FileText, tint: 'sage' },
  { title: 'Portfolio', description: 'Bring your work together in a personal, shareable portfolio.', path: '/portfolio', action: 'Design your portfolio', icon: Globe2, tint: 'lilac' },
  { title: 'Cover letters', description: 'Write a more personal introduction for the role you want.', path: '/cover-letters', action: 'Write a cover letter', icon: PenLine, tint: 'sand' },
  { title: 'Job match', description: 'See how your resume aligns with the language in a job post.', path: '/job-analyzer', action: 'Analyze a job', icon: Search, tint: 'blue' },
  { title: 'Skill gaps', description: 'Compare role requirements with the skills in your profile.', path: '/skill-gap', action: 'Compare skills', icon: Target, tint: 'sage' },
  { title: 'Applications', description: 'Track roles, application stages, and follow-up notes.', path: '/applications', action: 'View applications', icon: BriefcaseBusiness, tint: 'lilac' },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDashboardData(await authService.getDashboard());
    } catch {
      setError('We couldn’t load your workspace. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  const stats = dashboardData?.stats;
  const metrics = [
    { label: 'Resumes', value: stats?.totalResumes, icon: FileText },
    { label: 'Relevant jobs', value: stats?.relevantJobs, icon: Search },
    { label: 'Saved jobs', value: stats?.savedJobs, icon: BriefcaseBusiness },
    { label: 'Published portfolios', value: stats?.publishedPortfolios, icon: Globe2 },
    { label: 'Cover letters', value: stats?.generatedCoverLetters, icon: PenLine },
    { label: 'Applications', value: stats?.trackedApplications, icon: BriefcaseBusiness },
  ];

  return <div className="dashboard-page mx-auto max-w-6xl space-y-9">
    <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.15em] text-[#347c71]">Your career workspace</p>
        <h1 className="text-3xl font-semibold tracking-[-.045em] text-slate-900 sm:text-[2.15rem]">Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">A little progress adds up. Pick up where you left off or take the next step in your search.</p>
      </div>
      <Link to="/resumes" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#123d38] px-4 text-sm font-semibold text-white transition hover:bg-[#19534c]"><Sparkles size={15} />Build a resume<ArrowRight size={15} /></Link>
    </section>

    {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button onClick={() => void fetchDashboard()} className="font-semibold underline underline-offset-2">Try again</button></div>}

    <section aria-label="Workspace summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_-22px_rgba(15,23,42,.2)] sm:p-5">
        <div className="flex items-start justify-between gap-2"><p className="text-xs font-medium leading-5 text-slate-500 sm:text-[13px]">{label}</p><Icon size={16} className="mt-0.5 shrink-0 text-[#43867a]" /></div>
        {loading ? <div className="mt-3 h-8 w-12 animate-pulse rounded-md bg-slate-100" aria-label={`Loading ${label}`} /> : <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value ?? '—'}</p>}
      </article>)}
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight text-slate-900">Your tools</h2><p className="mt-1 text-xs text-slate-500">Small, practical steps toward your next opportunity.</p></div><Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#32776d] hover:text-[#123d38]"><UserRound size={14} />Your profile</Link></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ title, description, path, action, icon: Icon, tint }) => <Link key={path} to={path} className="group flex min-h-[160px] flex-col rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#b8d8ce] hover:shadow-[0_16px_34px_-26px_rgba(18,61,56,.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b8b7e]">
          <div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-lg dashboard-icon-${tint}`}><Icon size={17} /></span><ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#347c71]" /></div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p><span className="mt-auto pt-3 text-[11px] font-semibold text-[#347c71]">{action}</span>
        </Link>)}
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Recently updated</h2><p className="mt-1 text-xs text-slate-500">Your most recent work, all in one place.</p></div><Sparkles size={17} className="text-[#43867a]" /></div>
        {loading ? <div className="mt-5 space-y-3"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></div> : dashboardData?.recentActivities.length ? <ul className="mt-4 divide-y divide-slate-100">{dashboardData.recentActivities.map((activity) => <li key={activity.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{activity.title}</p><p className="mt-0.5 text-xs text-slate-500">{activity.description}</p></div><time className="shrink-0 text-[10px] text-slate-400">{new Date(activity.timestamp).toLocaleDateString()}</time></li>)}</ul> : <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center"><p className="text-sm font-medium text-slate-700">A fresh start looks good on you.</p><p className="mt-1 text-xs text-slate-500">Create your first resume and your saved work will appear here.</p></div>}
      </div>
      <div className="rounded-xl border border-[#dfeae5] bg-[#f0f5f1] p-5 sm:p-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#347c71]"><WandSparkles size={17} /></div>
        <h2 className="mt-4 text-sm font-semibold text-slate-900">A note on AI drafts</h2>
        <p className="mt-2 text-xs leading-5 text-slate-600">Cover-letter generation uses your configured AI provider. You stay in control: edit each draft and verify every detail before sharing it.</p>
        <Link to="/cover-letters" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#286e63] hover:text-[#123d38]">Open cover-letter studio<ArrowRight size={13} /></Link>
      </div>
    </section>
  </div>;
};
