import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, LogOut, Menu, X, ChevronDown, UserRound } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-navbar sticky top-0 z-50 flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <button onClick={onToggleSidebar} aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isSidebarOpen} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden">
          {isSidebarOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cf-navy)] text-white"><FileText size={16} /></span>
          <span className="text-[15px] font-bold tracking-[-.04em] text-slate-900">careerforge<span className="text-[var(--cf-accent-text)]">.ai</span></span>
          <span className="ml-1 hidden h-5 w-px bg-slate-200 sm:block" />
          <span className="hidden text-xs text-slate-500 sm:block">Career workspace</span>
        </Link>
      </div>
      {user && <div className="relative">
        <button onClick={() => setShowDropdown((open) => !open)} aria-label="Open account menu" aria-expanded={showDropdown} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cf-focus)]">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#eaf0f8] text-xs font-semibold text-[var(--cf-accent-text)]">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}</span>
          <span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-xs font-semibold text-slate-800">{user.name}</span><span className="block max-w-36 truncate text-[10px] text-slate-500">{user.targetRole || 'Career profile'}</span></span>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
        {showDropdown && <>
          <button aria-label="Close account menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_14px_38px_-18px_rgba(15,23,42,.28)]">
            <div className="border-b border-slate-100 px-3 py-2"><p className="truncate text-sm font-semibold text-slate-900">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
            <Link to="/profile" onClick={() => setShowDropdown(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"><UserRound size={15} />Profile & skills</Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"><LogOut size={15} />Sign out</button>
          </div>
        </>}
      </div>}
    </header>
  );
};
