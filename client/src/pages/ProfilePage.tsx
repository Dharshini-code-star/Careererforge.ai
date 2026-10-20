import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { User as UserIcon, Briefcase, Mail, Code, Save, Sparkles, X, Plus } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [saving, setSaving] = useState(false);

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        headline,
        targetRole,
        bio,
        skills,
        avatarUrl,
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserIcon className="w-7 h-7 text-[var(--cf-accent)]" /> Career profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your personal info, target discipline, and skills used for ATS matching & portfolios.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold flex items-center gap-2 border-b border-slate-200 pb-3">
            <Sparkles className="w-4 h-4 text-[var(--cf-accent)]" /> General information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email Address (Account ID)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-600 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Professional Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer | React & Node Expert"
                className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
              />
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Role / Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Lead Frontend Developer"
                  className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Professional Bio & Executive Summary
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your career background, key achievements, and passion areas..."
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-sm text-slate-900 outline-none transition-all resize-none"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        {/* Technical Skills Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2 border-b border-slate-200 pb-3">
            <Code className="w-4 h-4 text-[var(--cf-accent)]" /> Skills & technologies
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Type a skill and press Enter (e.g. GraphQL, Next.js)"
              className="flex-1 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-[var(--cf-navy)] hover:bg-[var(--cf-navy-hover)] text-white font-semibold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <p className="text-xs text-slate-500 italic">No skills added yet. Add some above!</p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[var(--cf-navy)] text-white font-semibold text-sm hover:bg-[var(--cf-navy-hover)] active:scale-[.99] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Profile...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Profile Changes
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
