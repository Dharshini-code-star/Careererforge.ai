import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Globe2, PenLine, Search, Target, BriefcaseBusiness, UserRound,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const groups = [
  {
    label: 'Workspace',
    items: [
      { title: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
      { title: 'Resume builder', icon: FileText, path: '/resumes' },
      { title: 'Portfolio', icon: Globe2, path: '/portfolio' },
      { title: 'Cover letters', icon: PenLine, path: '/cover-letters' },
    ],
  },
  {
    label: 'Your search',
    items: [
      { title: 'Job match', icon: Search, path: '/job-analyzer' },
      { title: 'Skill gaps', icon: Target, path: '/skill-gap' },
      { title: 'Applications', icon: BriefcaseBusiness, path: '/applications' },
    ],
  },
  {
    label: 'Account',
    items: [{ title: 'Profile & skills', icon: UserRound, path: '/profile' }],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => (
  <>
    {isOpen && <button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={onClose} />}
    <aside aria-label="Workspace navigation" className={`app-sidebar fixed bottom-0 left-0 top-[65px] z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="space-y-7 overflow-y-auto px-3.5 py-6">
        {groups.map((group) => <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map(({ title, icon: Icon, path }) => <NavLink key={path} to={path} onClick={onClose} className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b8b7e] ${isActive ? 'bg-[#edf5f1] text-[#20665d]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
              {({ isActive }) => <><Icon size={17} strokeWidth={isActive ? 2 : 1.75} /><span>{title}</span>{isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#418a7d]" />}</>}
            </NavLink>)}
          </div>
        </div>)}
      </nav>
      <div className="mt-auto border-t border-slate-100 p-4">
        <div className="rounded-xl bg-[#f5f7f4] p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#347b70] shadow-sm"><FileText size={13} /></span>Your work, in one place</div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Your saved documents and career notes stay in your private workspace.</p>
        </div>
      </div>
    </aside>
  </>
);
