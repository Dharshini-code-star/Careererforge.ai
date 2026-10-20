import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Sparkles, Mail, Lock, User, Briefcase, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const isRegisterInitial = location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(isRegisterInitial);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledNavigation = useRef(false);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
    setErrorMsg(null);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated && !handledNavigation.current) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Client Validations
    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (isRegister && !name) {
      setErrorMsg('Please provide your full name.');
      return;
    }

    if (isRegister && password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    handledNavigation.current = true;

    try {
      if (isRegister) {
        await register(name, email, password, targetRole);
        showToast('Welcome to CareerForgeAI! Account created successfully.', 'success');
        const template = new URLSearchParams(location.search).get('template');
        navigate(template ? `/resumes?template=${encodeURIComponent(template)}` : '/dashboard');
      } else {
        await login(email, password);
        showToast('Welcome back!', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Header Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="auth-brand-mark w-10 h-10 rounded-xl bg-[var(--cf-navy)] flex items-center justify-center">
          <div className="w-full h-full rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
          careerforge<span className="text-[var(--cf-accent-text)]">.ai</span>
        </span>
      </Link>

      {/* Card Wrapper */}
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-[0_24px_70px_-42px_rgba(15,23,42,.35)] relative z-10">
        {/* Toggle Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
              navigate('/login');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              !isRegister
                ? 'bg-[var(--cf-navy)] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
              navigate('/register');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              isRegister
                ? 'bg-[var(--cf-navy)] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRegister ? 'Start Your Career Journey' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {isRegister
              ? 'Join CareerForgeAI to build ATS resumes & portfolios with AI.'
              : 'Enter your credentials to access your dashboard.'}
          </p>
        </div>

        {/* Error Alert State */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input (Register Only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required={isRegister}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Target Role (Register Only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Role / Discipline
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, Data Scientist"
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--cf-navy)] text-white font-bold text-sm shadow-md hover:bg-[var(--cf-navy-hover)] hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isRegister ? 'Creating Account...' : 'Authenticating...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isRegister ? 'Register & Launch Dashboard' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          CareerForgeAI Authentication powered by JWT & bcrypt encryption.
        </div>
      </div>
    </div>
  );
};
