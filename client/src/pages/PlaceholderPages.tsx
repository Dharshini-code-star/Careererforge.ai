import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowLeft, Bookmark, CheckCircle2, ChevronDown, CircleAlert, CirclePlus,
  Download, ExternalLink, FileText, Globe, LoaderCircle, Plus, Save, Sparkles, Target,
  Trash2, Upload, WandSparkles, X,
} from 'lucide-react';
import { api } from '../services/api';
import { workspaceService } from '../services/workspaceService';
import type { DiscoveredJob, JobMatchResult, JobPosting, JobProviderStatus, JobSearchLink, ResumeAnalysis, ResumeSource, ResumeSuggestion, WorkspaceItem, WorkspaceKind } from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

type Fields = Record<string, string>;
const emptyResume: Fields = {
  name: '', headline: '', email: '', phone: '', location: '', website: '', summary: '', skills: '',
  experience: '', education: '', projects: '', certifications: '', languages: '', additional: '',
  template: 'Meridian', sourceId: '', sourceFileName: '',
};
const emptyPortfolio: Fields = {
  name: '', headline: '', about: '', skills: '', projects: '', email: '', template: 'Editorial',
};
const emptyLetter: Fields = { company: '', position: '', jobDescription: '', content: '' };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#43867a] focus:ring-2 focus:ring-[#43867a]/15';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';
const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-[0_12px_35px_-30px_rgba(15,23,42,.28)]';

function valueOf(data: Record<string, unknown>, key: string): string {
  return typeof data[key] === 'string' ? data[key] as string : '';
}

function PageHeading({ eyebrow, title, description, icon: Icon }: {
  eyebrow: string; title: string; description: string; icon: React.ElementType;
}) {
  return <div className="mb-7 flex items-start gap-4">
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300"><Icon size={22} /></div>
    <div><p className="mb-1 text-[11px] font-bold uppercase tracking-[.2em] text-cyan-300">{eyebrow}</p>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  </div>;
}

function TextField({ label, value, onChange, multiline = false, rows = 4, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (value: string) => void;
  multiline?: boolean; rows?: number; placeholder?: string; type?: string;
}) {
  return <label className="block"><span className={labelClass}>{label}</span>
    {multiline
      ? <textarea className={`${inputClass} resize-y`} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      : <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
  </label>;
}

function WorkspacePicker({ items, selected, onSelect, onNew, kind, onDelete }: {
  items: WorkspaceItem[]; selected: string; onSelect: (id: string) => void; onNew: () => void;
  kind: WorkspaceKind; onDelete: (id: string) => void;
}) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row">
    <div className="relative min-w-0 flex-1">
      <select aria-label="Saved documents" className={`${inputClass} appearance-none pr-10`} value={selected} onChange={(e) => onSelect(e.target.value)}>
        <option value="">New document</option>
        {items.map((item) => <option key={item._id} value={item._id}>{item.title}{item.isPublished ? ' · Published' : ''}</option>)}
      </select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-slate-500" />
    </div>
    <button onClick={onNew} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#8ebcb1] hover:bg-[#f5f8f6] hover:text-[#225e56]">
      <CirclePlus size={16} /> New
    </button>
    {selected && <button onClick={() => onDelete(selected)} aria-label={`Delete ${kind}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
      <Trash2 size={16} /> Delete
    </button>}
  </div>;
}

function useWorkspace(kind: WorkspaceKind, initial: Fields, initialTitle: string) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [fields, setFields] = useState<Fields>(() => ({
    ...initial,
    name: initial.name || user?.name || '',
    email: initial.email || user?.email || '',
    headline: initial.headline || user?.headline || '',
    skills: initial.skills || user?.skills?.join(', ') || '',
  }));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const documents = await workspaceService.list(kind);
      setItems(documents);
    } catch (error) {
      showToast(errorMessage(error, 'Could not load saved work.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [kind, showToast]);
  useEffect(() => { void refresh(); }, [refresh]);
  const choose = (id: string) => {
    setSelected(id);
    const item = items.find((entry) => entry._id === id);
    setTitle(item?.title || initialTitle);
    setFields(item ? Object.fromEntries(Object.keys(initial).map((key) => [key, valueOf(item.data, key)])) : {
      ...initial, name: user?.name || '', email: user?.email || '',
      headline: user?.headline || '', skills: user?.skills?.join(', ') || '',
    });
    if (kind === 'resume' && id) {
      void workspaceService.selectResume(id).then(() => {
        window.dispatchEvent(new CustomEvent('careerforge:resume-updated', { detail: { resumeId: id } }));
      }).catch((error: unknown) => showToast(errorMessage(error, 'Could not select this resume for job matching.'), 'error'));
    }
  };
  const newDocument = () => {
    setSelected('');
    setTitle(initialTitle);
    setFields({
      ...initial, name: user?.name || '', email: user?.email || '',
      headline: user?.headline || '', skills: user?.skills?.join(', ') || '',
    });
  };
  const save = async (titleOverride?: string) => {
    const documentTitle = titleOverride ?? title;
    if (!documentTitle.trim()) {
      showToast('Give this document a title before saving.', 'error');
      return null;
    }
    setBusy(true);
    try {
      const item = selected
        ? await workspaceService.update(kind, selected, documentTitle, fields)
        : await workspaceService.create(kind, documentTitle, fields);
      if (kind === 'resume') {
        try {
          await workspaceService.selectResume(item._id);
          window.dispatchEvent(new CustomEvent('careerforge:resume-updated', { detail: { resumeId: item._id } }));
        } catch (error) {
          showToast(`Resume saved, but could not select it for job matching: ${errorMessage(error, 'selection failed')}`, 'error');
        }
      }
      setSelected(item._id);
      setItems((current) => [item, ...current.filter((entry) => entry._id !== item._id)]);
      showToast('Saved to your workspace.', 'success');
      return item;
    } catch (error) {
      showToast(errorMessage(error, 'Could not save this document.'), 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Delete this document? This action cannot be undone.')) return;
    try {
      await workspaceService.remove(kind, id);
      setItems((current) => current.filter((item) => item._id !== id));
      newDocument();
      showToast('Document deleted.', 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not delete this document.'), 'error');
    }
  };
  const set = (key: string, value: string) => setFields((current) => ({ ...current, [key]: value }));
  return { items, selected, title, setTitle, fields, set, choose, newDocument, save, remove, busy, loading, refresh, setItems };
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

function SaveButton({ onClick, busy, label = 'Save changes' }: { onClick: () => void; busy: boolean; label?: string }) {
  return <button onClick={onClick} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#19534c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43867a] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
    {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{busy ? 'Saving…' : label}
  </button>;
}

function PreviewButton({ label = 'Print / save PDF' }: { label?: string }) {
  return <button onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#8ebcb1] hover:bg-[#f5f8f6]">
    <ArrowDownToLine size={16} />{label}
  </button>;
}

function ResumePreview({ fields }: { fields: Fields }) {
  const template = fields.template || 'Meridian';
  const sections = [
    ['Professional summary', fields.summary],
    ['Experience', fields.experience],
    ['Education', fields.education],
    ['Skills', fields.skills],
    ['Projects', fields.projects],
    ['Certifications', fields.certifications],
    ['Languages', fields.languages],
    ['Additional information', fields.additional],
  ] as const;
  return <article className={`resume-paper resume-template-${template.toLowerCase()} min-h-[680px] bg-white p-7 text-slate-800 shadow-[0_16px_45px_-28px_rgba(15,23,42,.3)] sm:p-10`}>
    <h2 className="text-3xl font-bold tracking-tight">{fields.name || 'Your name'}</h2>
    <p className="mt-1 text-base font-medium text-slate-600">{fields.headline || 'Professional headline'}</p>
    <p className="mt-2 border-b border-slate-300 pb-4 text-xs text-slate-500">{[fields.email, fields.phone, fields.location, fields.website].filter(Boolean).join(' · ') || 'Email · Phone · Location · Website'}</p>
    {sections.map(([heading, content]) => <section key={heading} className="mt-5 break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-[.15em] text-slate-700">{heading}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{content || `Add your ${heading.toLowerCase()} here.`}</p>
    </section>)}
  </article>;
}

function ResumeComparison({ original, current }: { original: Record<string, string>; current: Fields }) {
  const sections = [
    ['headline', 'Professional headline'],
    ['summary', 'Professional summary'],
    ['experience', 'Experience'],
    ['education', 'Education'],
    ['skills', 'Skills'],
    ['projects', 'Projects'],
    ['certifications', 'Certifications'],
    ['languages', 'Languages'],
    ['additional', 'Additional information'],
  ] as const;
  const populated = sections.filter(([key]) => original[key] || current[key]);
  return <section className={`${cardClass} space-y-4 p-5 sm:p-6`} aria-label="Original and edited resume comparison">
    <div><p className="text-sm font-semibold text-slate-900">Original vs. edited version</p><p className="mt-1 text-xs text-slate-500">Your uploaded original stays unchanged. This comparison shows its extracted fields beside the current editable version.</p></div>
    <div className="space-y-4">
      {populated.map(([key, label]) => {
        const originalValue = original[key] || '';
        const currentValue = current[key] || '';
        const changed = originalValue.trim() !== currentValue.trim();
        return <div key={key} className="grid min-w-0 gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Original · {label}</p>
            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{originalValue || 'No extracted content'}</p>
          </div>
          <div className={`min-w-0 rounded-lg border p-3 ${changed ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">Edited · {label}{changed ? ' · Changed' : ''}</p>
            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{currentValue || 'No content'}</p>
          </div>
        </div>;
      })}
      {!populated.length && <p className="text-xs text-slate-500">No fields were extracted from the original.</p>}
    </div>
  </section>;
}

export const ResumeBuilderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedTemplate = searchParams.get('template');
  const templateOptions = ['Meridian', 'Clifton', 'Sora'] as const;
  const selectedTemplate = templateOptions.find((template) => template === requestedTemplate) || 'Meridian';
  const resumeDefaults = { ...emptyResume, template: selectedTemplate };
  const workspace = useWorkspace('resume', resumeDefaults, 'Untitled resume');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analysisSignature, setAnalysisSignature] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [sources, setSources] = useState<ResumeSource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const loadSources = useCallback(async () => {
    try {
      setSources(await workspaceService.listResumeSources());
    } catch (error) {
      showToast(errorMessage(error, 'Could not load uploaded resumes.'), 'error');
    }
  }, [showToast]);
  useEffect(() => { void loadSources(); }, [loadSources]);
  const resumeText = (fields: Fields) => Object.entries(fields)
    .filter(([key]) => !['template', 'sourceId', 'sourceFileName'].includes(key))
    .map(([key, value]) => `${key}:\n${value}`)
    .join('\n\n');
  const signatureFor = (fields: Fields, description: string, pageCount?: number) =>
    JSON.stringify([resumeText(fields), description.trim(), pageCount ?? null]);
  const analyze = async () => {
    setAnalyzing(true);
    try {
      const pageCount = sources.find((source) => source._id === workspace.fields.sourceId)?.pageCount;
      const { data } = await api.post('/workspace/resume/ats-analysis', {
        resume: workspace.fields,
        jobDescription: jobDescription.trim() || undefined,
        pageCount,
      });
      setAnalysis(data.analysis);
      setAnalysisSignature(signatureFor(workspace.fields, jobDescription, pageCount));
      showToast('Resume analysis updated from your current content.', 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not analyze this resume.'), 'error');
    } finally { setAnalyzing(false); }
  };
  const applySource = (source: ResumeSource): Fields => {
    const parsed: Fields = { ...emptyResume, ...Object.fromEntries(
      Object.entries(source.extractedFields).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    ) };
    parsed.sourceId = source._id;
    parsed.sourceFileName = source.filename;
    parsed.template = 'Meridian';
    workspace.choose('');
    workspace.setTitle(`Improved · ${source.filename.replace(/\.(pdf|docx)$/i, '')}`);
    Object.entries(parsed).forEach(([key, value]) => workspace.set(key, value));
    setAnalysis(null);
    setAnalysisSignature('');
    setSuggestions([]);
    showToast('Extracted content loaded into a new version. The original upload is preserved.', 'success');
    return parsed;
  };
  const uploadResume = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Choose a PDF or DOCX file smaller than 5 MB.', 'error');
      return;
    }
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      showToast('Unsupported file. Upload a PDF or DOCX resume.', 'error');
      return;
    }
    setUploading(true);
    try {
      const { source, analysis: initialAnalysis } = await workspaceService.uploadResume(file);
      setSources((current) => [source, ...current.filter((item) => item._id !== source._id)]);
      const parsed = applySource(source);
      setAnalysis(initialAnalysis);
      setAnalysisSignature(signatureFor(parsed, jobDescription, source.pageCount));
    } catch (error) {
      showToast(errorMessage(error, 'The resume could not be uploaded or extracted.'), 'error');
    } finally {
      setUploading(false);
    }
  };
  const loadSource = async (sourceId: string) => {
    const listedSource = sources.find((item) => item._id === sourceId);
    if (listedSource) {
      applySource(listedSource);
      return;
    }
    try {
      applySource(await workspaceService.getResumeSource(sourceId));
    } catch (error) {
      showToast(errorMessage(error, 'Could not load the original resume.'), 'error');
    }
  };
  const ensureSource = async (sourceId: string) => {
    if (!sourceId || sources.some((source) => source._id === sourceId)) return;
    try {
      const source = await workspaceService.getResumeSource(sourceId);
      setSources((current) => [source, ...current.filter((item) => item._id !== source._id)]);
    } catch (error) {
      showToast(errorMessage(error, 'Could not load the original resume for comparison.'), 'error');
    }
  };
  const improveResume = async () => {
    setImproving(true);
    try {
      const { data } = await api.post('/workspace/improve-resume', {
        resume: workspace.fields,
        jobDescription: jobDescription.trim() || undefined,
      });
      setSuggestions(data.suggestions);
      showToast(`${data.suggestions.length} grounded suggestion${data.suggestions.length === 1 ? '' : 's'} ready to review.`, 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not improve this resume.'), 'error');
    } finally {
      setImproving(false);
    }
  };
  const rejectSuggestion = (id: string) => {
    setSuggestions((current) => current.filter((suggestion) => suggestion.id !== id));
  };
  const acceptSuggestion = async (suggestion: ResumeSuggestion) => {
    const current = workspace.fields[suggestion.field] || '';
    if (!current.includes(suggestion.originalText)) {
      showToast('This text has changed since the suggestion was generated. Generate a fresh review.', 'error');
      setSuggestions((existing) => existing.filter((entry) => entry.id !== suggestion.id));
      return;
    }
    const nextFields = {
      ...workspace.fields,
      [suggestion.field]: current.replace(suggestion.originalText, suggestion.suggestedText),
    };
    workspace.set(suggestion.field, nextFields[suggestion.field]);
    rejectSuggestion(suggestion.id);
    setAnalyzing(true);
    try {
      const pageCount = sources.find((source) => source._id === nextFields.sourceId)?.pageCount;
      const { data } = await api.post('/workspace/resume/ats-analysis', {
        resume: nextFields,
        jobDescription: jobDescription.trim() || undefined,
        pageCount,
      });
      setAnalysis(data.analysis);
      setAnalysisSignature(signatureFor(nextFields, jobDescription, pageCount));
    } catch (error) {
      setAnalysis(null);
      setAnalysisSignature('');
      showToast(errorMessage(error, 'Suggestion accepted, but the ATS analysis could not be recalculated.'), 'error');
    } finally {
      setAnalyzing(false);
    }
  };
  const downloadPdf = async () => {
    setDownloadBusy(true);
    try {
    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ unit: 'pt', format: 'letter' });
    const left = 52;
    const width = 508;
    const bottom = document.internal.pageSize.getHeight() - 52;
    let y = 58;
    const addText = (text: string, size: number, bold = false) => {
      document.setFont('helvetica', bold ? 'bold' : 'normal');
      document.setFontSize(size);
      const lines = document.splitTextToSize(text, width) as string[];
      for (const line of lines) {
        if (y + size * 1.5 > bottom) {
          document.addPage();
          y = 58;
        }
        document.text(line, left, y);
        y += size * 1.45;
      }
    };
    addText(workspace.fields.name || 'Resume', 21, true);
    if (workspace.fields.headline) addText(workspace.fields.headline, 11);
    const contact = [workspace.fields.email, workspace.fields.phone, workspace.fields.location, workspace.fields.website].filter(Boolean).join('  ·  ');
    if (contact) {
      y += 4;
      addText(contact, 9);
    }
    const sections = [
      ['Professional Summary', workspace.fields.summary],
      ['Experience', workspace.fields.experience],
      ['Education', workspace.fields.education],
      ['Skills', workspace.fields.skills],
      ['Projects', workspace.fields.projects],
      ['Certifications', workspace.fields.certifications],
      ['Languages', workspace.fields.languages],
      ['Additional Information', workspace.fields.additional],
    ];
    for (const [heading, content] of sections) {
      if (!content?.trim()) continue;
      y += 10;
      addText(heading.toUpperCase(), 10, true);
      y += 2;
      addText(content.trim(), 9);
    }
    const filename = `${(workspace.title || workspace.fields.name || 'resume').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 80)}.pdf`;
    const href = URL.createObjectURL(document.output('blob'));
    const anchor = window.document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (error) {
      showToast(errorMessage(error, 'Could not create a PDF from this resume.'), 'error');
    } finally {
      setDownloadBusy(false);
    }
  };
  const originalSource = sources.find((source) => source._id === workspace.fields.sourceId);
  const currentAnalysisSignature = signatureFor(workspace.fields, jobDescription, originalSource?.pageCount);
  return <div className="career-module mx-auto max-w-7xl">
    <PageHeading eyebrow="Resume studio" title="Tell your story, clearly." description="Start with a blank resume or upload a PDF or DOCX. Review extracted content, measure real ATS-readability signals, and save evidence-grounded improvements as a separate version." icon={FileText} />
    <WorkspacePicker {...workspace} kind="resume" onSelect={(id) => {
      workspace.choose(id);
      const item = workspace.items.find((entry) => entry._id === id);
      if (typeof item?.data.sourceId === 'string') void ensureSource(item.data.sourceId);
    }} onNew={workspace.newDocument} onDelete={workspace.remove} />
    {workspace.loading ? <LoadingState /> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
      <div className="space-y-5">
        <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf5f1] text-[#367b70]"><Upload size={17} /></span>
            <div><h2 className="text-sm font-semibold text-slate-900">Upload an existing resume</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Original PDFs and DOCX files are stored privately in your account. Extracted fields are editable; each improved version is saved separately without overwriting the upload.</p></div>
          </div>
          <input ref={uploadRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" aria-label="Upload an existing resume as PDF or DOCX" onChange={(event) => { void uploadResume(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => uploadRef.current?.click()} disabled={uploading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#19534c] disabled:cursor-wait disabled:opacity-60">
              {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{uploading ? 'Uploading & extracting…' : 'Choose PDF or DOCX'}
            </button>
            <label className="sr-only" htmlFor="existing-resume-select">Select a previously uploaded original resume</label>
            <select id="existing-resume-select" aria-label="Previously uploaded original resumes" className={`${inputClass} max-w-full flex-1 sm:max-w-[350px]`} value="" onChange={(event) => { if (event.target.value) void loadSource(event.target.value); }}>
              <option value="">Load a previous original upload…</option>
              {sources.map((source) => <option key={source._id} value={source._id}>{source.filename} · {new Date(source.createdAt).toLocaleDateString()}</option>)}
            </select>
          </div>
          <p className="text-[11px] leading-5 text-slate-400">PDF and DOCX · Up to 5 MB · Text-based PDFs only (OCR is not performed). Your source file remains unchanged.</p>
          {workspace.fields.sourceId && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d9e8e2] bg-[#f5f9f6] px-4 py-3">
            <div><p className="text-xs font-semibold text-slate-800">Original preserved: {workspace.fields.sourceFileName}</p><p className="mt-1 text-[11px] text-slate-500">Editing a separate version{originalSource?.pageCount ? ` · ${originalSource.pageCount} original PDF pages` : ' · DOCX original'}</p></div>
            <button disabled={downloadBusy || !sources.some((source) => source._id === workspace.fields.sourceId)} onClick={() => {
              const source = sources.find((item) => item._id === workspace.fields.sourceId);
              if (!source) return;
              setDownloadBusy(true);
              void workspaceService.downloadOriginalResume(source)
                .catch((error: unknown) => showToast(errorMessage(error, 'Could not download the original.'), 'error'))
                .finally(() => setDownloadBusy(false));
            }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#8ebcb1] disabled:opacity-60">
              {downloadBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}Download original
            </button>
          </div>}
        </section>
        {originalSource && <ResumeComparison original={originalSource.extractedFields} current={workspace.fields} />}
        <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-slate-900">Resume details</p><p className="mt-1 text-xs text-slate-500">Your changes appear in the preview as you type.</p></div>
            <div className="flex flex-wrap gap-2">
              <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">Style
                <select aria-label="Resume template" className="bg-transparent font-semibold text-slate-700 outline-none" value={workspace.fields.template || 'Meridian'} onChange={(event) => workspace.set('template', event.target.value)}><option>Meridian</option><option>Clifton</option><option>Sora</option></select>
              </label>
            </div>
          </div>
          <TextField label="Document name" value={workspace.title} onChange={workspace.setTitle} placeholder="e.g. Product designer — Acme" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" value={workspace.fields.name} onChange={(v) => workspace.set('name', v)} />
            <TextField label="Professional headline" value={workspace.fields.headline} onChange={(v) => workspace.set('headline', v)} placeholder="Senior product designer" />
            <TextField label="Email" type="email" value={workspace.fields.email} onChange={(v) => workspace.set('email', v)} />
            <TextField label="Phone" value={workspace.fields.phone} onChange={(v) => workspace.set('phone', v)} />
            <TextField label="Location" value={workspace.fields.location} onChange={(v) => workspace.set('location', v)} placeholder="City, region" />
            <TextField label="Website / LinkedIn" value={workspace.fields.website} onChange={(v) => workspace.set('website', v)} />
          </div>
          <TextField label="Professional summary" value={workspace.fields.summary} onChange={(v) => workspace.set('summary', v)} multiline rows={4} placeholder="Summarize your experience and the impact you bring…" />
          <TextField label="Skills (comma separated)" value={workspace.fields.skills} onChange={(v) => workspace.set('skills', v)} placeholder="Product strategy, Figma, research…" />
          <TextField label="Experience" value={workspace.fields.experience} onChange={(v) => workspace.set('experience', v)} multiline rows={6} placeholder="Role — Company — Dates&#10;Describe outcomes and measurable impact…" />
          <TextField label="Education" value={workspace.fields.education} onChange={(v) => workspace.set('education', v)} multiline rows={3} placeholder="Degree — Institution — Graduation year" />
          <TextField label="Projects (optional)" value={workspace.fields.projects} onChange={(v) => workspace.set('projects', v)} multiline rows={3} placeholder="Project, your contribution, and verified outcomes" />
          <TextField label="Certifications (optional)" value={workspace.fields.certifications} onChange={(v) => workspace.set('certifications', v)} multiline rows={2} />
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <SaveButton onClick={() => void workspace.save()} busy={workspace.busy} label={workspace.selected ? 'Save version changes' : workspace.fields.sourceId ? 'Save as new version' : 'Save resume'} />
            <button onClick={() => void downloadPdf()} disabled={!resumeText(workspace.fields).trim() || downloadBusy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#8ebcb1] hover:bg-[#f5f8f6] disabled:opacity-60">
              {downloadBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}Download PDF
            </button>
            <PreviewButton />
          </div>
        </section>
        <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf5f1] text-[#367b70]"><Sparkles size={17} /></span><div><h2 className="text-sm font-semibold text-slate-900">ATS readability & job match</h2><p className="mt-1 text-xs leading-5 text-slate-500">The resume score reflects transparent content, contact, section, length, skills, and impact checks. Job-match coverage is a separate comparison of your content with the job description.</p></div></div>
          <TextField label="Job description (optional)" value={jobDescription} onChange={setJobDescription} multiline rows={4} placeholder="Paste at least 30 characters of a job description for role-specific keyword matching…" />
          <div className="flex flex-wrap gap-2">
            <button disabled={analyzing} onClick={() => void analyze()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#8ebcb1] disabled:opacity-60">
              {analyzing ? <LoaderCircle size={16} className="animate-spin" /> : <Target size={16} />}Analyze ATS readiness & match
            </button>
            <button disabled={improving} onClick={() => void improveResume()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#edf5f1] px-4 py-2 text-sm font-semibold text-[#286b60] transition hover:bg-[#e0eee8] disabled:opacity-60">
              {improving ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}Review AI improvements
            </button>
          </div>
          {suggestions.length > 0 && <section aria-label="Review individual AI suggestions" className="space-y-3">
            <p className="text-xs font-semibold text-slate-700">Compare each suggestion with the original text. Accept or dismiss them individually.</p>
            {suggestions.map((suggestion) => <article key={suggestion.id} className="rounded-lg border border-[#d9e8e2] bg-[#f7faf8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#39796e]">{suggestion.field} · {suggestion.category}</span><span className="text-[10px] text-slate-500">{suggestion.reason}</span></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-rose-100 bg-rose-50/60 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Original</p><p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">{suggestion.originalText}</p></div><div className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Suggested</p><p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">{suggestion.suggestedText}</p></div></div>
              <div className="mt-3 flex gap-2"><button onClick={() => acceptSuggestion(suggestion)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#123d38] px-3 text-xs font-semibold text-white hover:bg-[#19534c]"><CheckCircle2 size={14} />Accept</button><button onClick={() => rejectSuggestion(suggestion.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><X size={14} />Dismiss</button></div>
            </article>)}
            <button onClick={() => setSuggestions([])} className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800">Dismiss all remaining suggestions</button>
          </section>}
          {analysis && analysisSignature === currentAnalysisSignature && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold text-slate-800">Content-based ATS readiness</p><p className="mt-1 text-[11px] text-slate-500">A transparent checklist, not a prediction of employer ATS software.</p></div><p className="text-2xl font-semibold tracking-tight text-[#286b60]">{analysis.score}<span className="text-sm text-slate-500">/100</span></p></div>
            <p className="mt-2 text-xs text-slate-600">{analysis.wordCount} words · score uses only your current saved editor content.</p>
            <div className="mt-3 space-y-2">{analysis.components.map((component) => <div key={component.name}><div className="flex justify-between gap-3 text-[11px]"><span className="font-medium text-slate-700">{component.name}</span><span className="shrink-0 text-slate-500">{component.score}/{component.maxScore}</span></div><p className="mt-0.5 text-[10px] leading-4 text-slate-500">{component.detail}</p></div>)}</div>
            {analysis.jobMatch && <div className="mt-4 border-t border-slate-200 pt-3"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold text-slate-800">Job-description match</p><p className="mt-1 text-[11px] text-slate-500">{analysis.jobMatch.matchedKeywords.length} of {analysis.jobMatch.analyzedKeywordCount} distinct keywords appear in the resume.</p></div><p className="text-xl font-semibold text-[#286b60]">{analysis.jobMatch.score}%</p></div>
              {analysis.jobMatch.missingKeywords.length > 0 && <div className="mt-3"><p className="text-[11px] font-semibold text-slate-600">Keywords to consider only if they reflect your experience</p><div className="mt-2 flex flex-wrap gap-1.5">{analysis.jobMatch.missingKeywords.map((word) => <span key={word} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">{word}</span>)}</div></div>}
            </div>}
            {analysis && analysisSignature !== currentAnalysisSignature && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">Resume content or the job description has changed. Re-analyze to see a current score.</p>}
            {analysis.issues.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3"><p className="text-[11px] font-semibold text-slate-700">Items to review</p><ul className="mt-2 space-y-2">{analysis.issues.map((issue, index) => <li key={`${index}-${issue.message}`} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600"><CircleAlert size={14} className={`mt-0.5 shrink-0 ${issue.severity === 'high' ? 'text-rose-600' : issue.severity === 'medium' ? 'text-amber-600' : 'text-slate-400'}`} />{issue.message}</li>)}</ul></div>}
          </div>}
          <p className="text-[11px] leading-5 text-slate-400">AI suggestions require the server-side Gemini provider. Changes are never applied automatically. Check every accepted detail for accuracy; suggested metrics must be independently verified before you add them.</p>
        </section>
      </div>
      <div className="xl:sticky xl:top-[84px] xl:self-start"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Live document preview</p><span className="text-[10px] text-slate-400">{workspace.fields.template} · ATS-readable</span></div><ResumePreview fields={workspace.fields} /></div>
    </div>}
  </div>;
};

function PortfolioPreview({ fields }: { fields: Fields }) {
  const minimal = fields.template === 'Minimal';
  const dark = fields.template === 'Studio';
  const projectList = fields.projects.split('\n').map((project) => project.trim()).filter(Boolean);
  const skillList = fields.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  return <article className={`portfolio-paper min-h-[570px] overflow-hidden ${dark ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-900'} ${dark ? 'font-mono' : ''}`}>
    {minimal ? <div className="h-px bg-slate-200" /> : <div className={`h-1.5 ${dark ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400' : 'bg-[#dcebe5]'}`} />}
    <div className="p-7 sm:p-9">
      <p className={`text-xs font-bold uppercase tracking-[.22em] ${dark ? 'text-cyan-300' : 'text-slate-500'}`}>{fields.template} · Portfolio</p>
      <h2 className="mt-8 text-4xl font-bold tracking-tight">{fields.name || 'Your name'}</h2><p className={`mt-2 text-lg ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{fields.headline || 'Your professional headline'}</p>
      <p className={`mt-6 whitespace-pre-wrap text-sm leading-7 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{fields.about || 'A short introduction about what you do and what you care about.'}</p>
      <h3 className={`mt-8 text-sm font-bold uppercase tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>Selected work</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{projectList.length ? projectList.map((project, index) => <div key={`${index}-${project}`} className={`rounded-xl border p-4 text-sm ${dark ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{project}</div>) : <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Add projects, one per line.</div>}</div>
      <h3 className={`mt-8 text-sm font-bold uppercase tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>Expertise</h3><div className="mt-3 flex flex-wrap gap-2">{skillList.map((skill) => <span key={skill} className={`rounded-full px-3 py-1.5 text-xs ${dark ? 'bg-cyan-300/10 text-cyan-200' : 'bg-[#edf5f1] text-[#286e63]'}`}>{skill}</span>)}</div>
      <a href={`mailto:${fields.email}`} className={`mt-8 inline-flex items-center gap-2 text-sm font-semibold ${dark ? 'text-cyan-200' : 'text-[#286e63]'}`}>{fields.email || 'Contact me'} <ExternalLink size={14} /></a>
    </div>
  </article>;
}

export const PortfolioPage: React.FC = () => {
  const workspace = useWorkspace('portfolio', emptyPortfolio, 'My portfolio');
  const { showToast } = useToast();
  const [publishing, setPublishing] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const publish = async () => {
    const saved = await workspace.save();
    if (!saved) return;
    setPublishing(true);
    try {
      const { data } = await api.post(`/workspace/portfolio/${saved._id}/publish`);
      setPublicUrl(`${window.location.origin}/portfolio/${encodeURIComponent(data.slug)}`);
      workspace.setItems((items) => items.map((item) => item._id === saved._id ? data.item : item));
      showToast('Your portfolio is now publicly available.', 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not publish this portfolio.'), 'error');
    } finally { setPublishing(false); }
  };
  return <div className="career-module mx-auto max-w-7xl">
    <PageHeading eyebrow="Share your work" title="Portfolio builder" description="Shape a polished personal portfolio, switch visual styles, and publish a shareable page when it is ready." icon={Globe} />
    <WorkspacePicker {...workspace} kind="portfolio" onSelect={workspace.choose} onNew={workspace.newDocument} onDelete={workspace.remove} />
    {workspace.loading ? <LoadingState /> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)]">
      <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
        <div><p className="text-sm font-semibold text-slate-900">Your story</p><p className="mt-1 text-xs text-slate-500">The public portfolio is generated from the saved content below.</p></div>
        <TextField label="Portfolio title" value={workspace.title} onChange={workspace.setTitle} placeholder="My design portfolio" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={workspace.fields.name} onChange={(v) => workspace.set('name', v)} />
          <TextField label="Headline" value={workspace.fields.headline} onChange={(v) => workspace.set('headline', v)} />
          <TextField label="Contact email" type="email" value={workspace.fields.email} onChange={(v) => workspace.set('email', v)} />
          <label className="block"><span className={labelClass}>Visual style</span><select className={inputClass} value={workspace.fields.template} onChange={(e) => workspace.set('template', e.target.value)}><option>Editorial</option><option>Studio</option><option>Minimal</option></select></label>
        </div>
        <TextField label="About" value={workspace.fields.about} onChange={(v) => workspace.set('about', v)} multiline rows={5} placeholder="Introduce yourself, your approach, and the kind of work you love…" />
        <TextField label="Skills (comma separated)" value={workspace.fields.skills} onChange={(v) => workspace.set('skills', v)} placeholder="Research, Figma, TypeScript…" />
        <TextField label="Projects (one per line)" value={workspace.fields.projects} onChange={(v) => workspace.set('projects', v)} multiline rows={5} placeholder="Project name — what you built and its impact" />
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><SaveButton onClick={() => void workspace.save()} busy={workspace.busy} /><button onClick={() => void publish()} disabled={publishing || workspace.busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#19534c] disabled:opacity-60">{publishing ? <LoaderCircle size={16} className="animate-spin" /> : <Globe size={16} />} Publish portfolio</button></div>
        {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="block break-all rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{publicUrl} <ExternalLink size={14} className="inline" /></a>}
      </section>
      <div className="xl:sticky xl:top-5 xl:self-start"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Portfolio preview</p><PortfolioPreview fields={workspace.fields} /></div>
    </div>}
  </div>;
};

export const CoverLetterPage: React.FC = () => {
  const workspace = useWorkspace('coverLetter', emptyLetter, 'Untitled cover letter');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [generating, setGenerating] = useState(false);
  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/workspace/generate-cover-letter', {
        company: workspace.fields.company, position: workspace.fields.position,
        jobDescription: workspace.fields.jobDescription,
        resume: { name: user?.name, headline: user?.headline, skills: user?.skills, targetRole: user?.targetRole },
      });
      workspace.set('content', data.content);
      showToast('Draft generated. Review it carefully before sending.', 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not generate a cover letter.'), 'error');
    } finally { setGenerating(false); }
  };
  const download = () => {
    const blob = new Blob([workspace.fields.content], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${workspace.fields.company || 'cover-letter'}.txt`;
    anchor.click();
    URL.revokeObjectURL(href);
  };
  return <div className="career-module mx-auto max-w-6xl">
    <PageHeading eyebrow="Make the introduction count" title="AI cover letter studio" description="Create a role-specific first draft grounded in your profile, then edit, save, and export it. AI generation requires your server-side Gemini API key." icon={Sparkles} />
    <WorkspacePicker {...workspace} kind="coverLetter" onSelect={workspace.choose} onNew={workspace.newDocument} onDelete={workspace.remove} />
    {workspace.loading ? <LoadingState /> : <div className="grid gap-5 lg:grid-cols-2">
      <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
        <TextField label="Document title" value={workspace.title} onChange={workspace.setTitle} placeholder="Product Designer — Acme" />
        <div className="grid gap-4 sm:grid-cols-2"><TextField label="Company" value={workspace.fields.company} onChange={(v) => workspace.set('company', v)} placeholder="Company name" /><TextField label="Position" value={workspace.fields.position} onChange={(v) => workspace.set('position', v)} placeholder="Role title" /></div>
        <TextField label="Job description" value={workspace.fields.jobDescription} onChange={(v) => workspace.set('jobDescription', v)} multiline rows={8} placeholder="Paste the job description to personalize your letter…" />
        <button onClick={() => void generate()} disabled={generating} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#edf5f1] px-4 py-2 text-sm font-semibold text-[#286b60] transition hover:bg-[#e0eee8] disabled:opacity-60">{generating ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />} Generate personalized draft</button>
        <p className="text-xs leading-5 text-slate-500">The AI provider may process the profile and job description you submit. Review the output for accuracy; it should never claim experience you do not have.</p>
      </section>
      <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
        <TextField label="Edit your letter" value={workspace.fields.content} onChange={(v) => workspace.set('content', v)} multiline rows={18} placeholder="Generate a draft or write your letter here…" />
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><SaveButton onClick={() => void workspace.save()} busy={workspace.busy} /><button onClick={download} disabled={!workspace.fields.content.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#8ebcb1] disabled:opacity-40"><ArrowDownToLine size={16} /> Download .txt</button><PreviewButton label="Print / save PDF" /></div>
        <article className="print-document whitespace-pre-wrap text-sm leading-7 text-slate-800">{workspace.fields.content}</article>
      </section>
    </div>}
  </div>;
};

const emptyJob = { title: '', company: '', description: '' };
const pillClass = 'rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700';

function JobWorkspacePage({ skillFocus = false }: { skillFocus?: boolean }) {
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<WorkspaceItem[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredJob[]>([]);
  const [providers, setProviders] = useState<JobProviderStatus[]>([]);
  const [searchLinks, setSearchLinks] = useState<JobSearchLink[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState('all');
  const [employmentFilter, setEmploymentFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [visibleJobCount, setVisibleJobCount] = useState(20);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [results, setResults] = useState<Record<string, JobMatchResult>>({});
  const [form, setForm] = useState(emptyJob);
  const [editingJobId, setEditingJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const selectedJobIdRef = useRef('');
  const matchRequestRef = useRef(0);
  const discoveryRequestRef = useRef(0);
  selectedJobIdRef.current = selectedJobId;

  const calculateMatches = useCallback(async (
    resumeId: string,
    jobList: JobPosting[]
  ) => {
    const requestId = ++matchRequestRef.current;
    if (!resumeId || !jobList.length) {
      setResults({});
      setMatching(false);
      return;
    }
    setMatching(true);
    try {
      const outcomes = await Promise.all(jobList.map(async (job) => ({
        jobId: job._id,
        result: await workspaceService.matchJob(job._id, resumeId),
      })));
      if (requestId === matchRequestRef.current) {
        setResults(Object.fromEntries(outcomes.map(({ jobId, result }) => [jobId, result])));
      }
    } catch (error) {
      if (requestId === matchRequestRef.current) {
        setResults({});
        showToast(errorMessage(error, 'Could not refresh job matches for this saved resume.'), 'error');
      }
    } finally {
      if (requestId === matchRequestRef.current) setMatching(false);
    }
  }, [showToast]);

  const loadWorkspace = useCallback(async (selectFirst = true) => {
    setLoading(true);
    setLoadError('');
    try {
      const [resumeItems, jobItems, selection] = await Promise.all([
        workspaceService.list('resume'),
        workspaceService.listJobs(),
        workspaceService.getSelectedResume(),
      ]);
      setResumes(resumeItems);
      setJobs(jobItems);
      const savedSelection = resumeItems.find((resume) => resume._id === selection.resumeId);
      let resumeId = savedSelection?._id || '';
      if (!resumeId && selectFirst && resumeItems.length) {
        const selected = await workspaceService.selectResume(resumeItems[0]._id);
        resumeId = selected.resumeId;
      }
      setSelectedResumeId(resumeId);
      if (jobItems.length && !jobItems.some((job) => job._id === selectedJobIdRef.current)) {
        setSelectedJobId(jobItems[0]._id);
        selectedJobIdRef.current = jobItems[0]._id;
        setForm({ title: jobItems[0].title, company: jobItems[0].company, description: jobItems[0].description });
        setEditingJobId(jobItems[0]._id);
      }
      await calculateMatches(resumeId, jobItems);
    } catch (error) {
      setLoadError(errorMessage(error, 'Could not load your saved resumes and job descriptions.'));
    } finally {
      setLoading(false);
    }
  }, [calculateMatches]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => {
    const onResumeUpdated = () => {
      void loadWorkspace(false);
      setRefreshCount((count) => count + 1);
    };
    window.addEventListener('careerforge:resume-updated', onResumeUpdated);
    return () => window.removeEventListener('careerforge:resume-updated', onResumeUpdated);
  }, [loadWorkspace]);

  const refreshDiscovery = useCallback(async () => {
    const requestId = ++discoveryRequestRef.current;
    if (!selectedResumeId) {
      setDiscovered([]);
      setProviders([]);
      setSearchLinks([]);
      return;
    }
    setDiscoveryBusy(true);
    setDiscoveryError('');
    try {
      const response = await workspaceService.discoverJobs(selectedResumeId, {
        role: roleFilter.trim() || undefined,
        location: locationFilter.trim() || undefined,
      });
      if (requestId !== discoveryRequestRef.current) return;
      setDiscovered(response.jobs);
      setProviders(response.providers);
      setSearchLinks(response.searchLinks);
    } catch (error) {
      if (requestId === discoveryRequestRef.current) {
        setDiscovered([]);
        setDiscoveryError(errorMessage(error, 'Could not discover jobs from the configured providers.'));
      }
    } finally {
      if (requestId === discoveryRequestRef.current) setDiscoveryBusy(false);
    }
  }, [selectedResumeId, roleFilter, locationFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void refreshDiscovery(); }, selectedResumeId ? 450 : 0);
    return () => window.clearTimeout(timeout);
  }, [refreshDiscovery, refreshCount, selectedResumeId]);

  const selectResume = async (resumeId: string) => {
    if (!resumeId) return;
    try {
      const selection = await workspaceService.selectResume(resumeId);
      setSelectedResumeId(selection.resumeId);
      await calculateMatches(selection.resumeId, jobs);
    } catch (error) {
      showToast(errorMessage(error, 'Could not select that resume for job matching.'), 'error');
    }
  };
  const selectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    selectedJobIdRef.current = jobId;
    const job = jobs.find((item) => item._id === jobId);
    setEditingJobId(jobId);
    setForm(job ? { title: job.title, company: job.company, description: job.description } : emptyJob);
  };
  const saveJob = async () => {
    setSaving(true);
    try {
      const job = await workspaceService.saveJob(form, editingJobId || undefined);
      const nextJobs = [job, ...jobs.filter((item) => item._id !== job._id)];
      setJobs(nextJobs);
      setSelectedJobId(job._id);
      selectedJobIdRef.current = job._id;
      setEditingJobId(job._id);
      setForm({ title: job.title, company: job.company, description: job.description });
      showToast(editingJobId ? 'Job description updated.' : 'Job description saved.', 'success');
      await calculateMatches(selectedResumeId, nextJobs);
    } catch (error) {
      showToast(errorMessage(error, 'Could not save this job description.'), 'error');
    } finally {
      setSaving(false);
    }
  };
  const deleteJob = async () => {
    const job = jobs.find((item) => item._id === selectedJobId);
    if (!job || !window.confirm(`Delete the saved description for ${job.title} at ${job.company}?`)) return;
    try {
      await workspaceService.removeJob(job._id);
      const nextJobs = jobs.filter((item) => item._id !== job._id);
      setJobs(nextJobs);
      setResults((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== job._id)));
      if (nextJobs.length) selectJob(nextJobs[0]._id);
      else {
        setSelectedJobId('');
        selectedJobIdRef.current = '';
        setEditingJobId('');
        setForm(emptyJob);
      }
      showToast('Job description deleted.', 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not delete this job description.'), 'error');
    }
  };
  const toggleSaved = async (job: DiscoveredJob) => {
    try {
      await workspaceService.saveDiscoveredJob(job._id, !job.isSaved);
      setDiscovered((current) => current.map((item) => item._id === job._id ? { ...item, isSaved: !item.isSaved } : item));
      showToast(job.isSaved ? 'Removed from saved jobs.' : 'Job saved to your account.', 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not update this saved job.'), 'error');
    }
  };
  const trackJob = async (job: DiscoveredJob) => {
    try {
      await workspaceService.trackDiscoveredJob(job._id);
      showToast(`${job.title} at ${job.company} was added to your application tracker.`, 'success');
    } catch (error) {
      showToast(errorMessage(error, 'Could not add this job to your application tracker.'), 'error');
    }
  };
  const filteredDiscovered = discovered.filter((job) => {
    const searchable = `${job.title} ${job.company} ${job.description} ${(job.tags || []).join(' ')}`.toLowerCase();
    if (roleFilter.trim() && !job.title.toLowerCase().includes(roleFilter.trim().toLowerCase()) &&
        !(job.tags || []).some((tag) => tag.toLowerCase().includes(roleFilter.trim().toLowerCase()))) return false;
    if (locationFilter.trim() && !job.location.toLowerCase().includes(locationFilter.trim().toLowerCase())) return false;
    if (workplaceFilter !== 'all' && job.workplace !== workplaceFilter) return false;
    if (employmentFilter === 'internship' && !/\b(intern|internship|trainee|graduate)\b/i.test(`${job.employmentType} ${job.title} ${searchable}`)) return false;
    if (employmentFilter === 'full-time' && !/\b(full.?time|permanent)\b/i.test(job.employmentType)) return false;
    if (employmentFilter === 'contract' && !/\b(contract|part.?time|temporary|freelance)\b/i.test(job.employmentType)) return false;
    if (experienceFilter === 'entry' && !/entry|intern|graduate|junior/i.test(job.experienceLevel)) return false;
    if (experienceFilter === 'mid' && !/mid/i.test(job.experienceLevel)) return false;
    if (experienceFilter === 'senior' && !/senior|lead/i.test(job.experienceLevel)) return false;
    if (savedOnly && !job.isSaved) return false;
    if (dateFilter !== 'all') {
      if (!job.postedAt) return false;
      const ageDays = (Date.now() - new Date(job.postedAt).getTime()) / 86400000;
      const maxDays = Number(dateFilter);
      if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > maxDays) return false;
    }
    return true;
  });
  useEffect(() => {
    setVisibleJobCount(20);
  }, [roleFilter, locationFilter, workplaceFilter, employmentFilter, experienceFilter, dateFilter, savedOnly, selectedResumeId]);
  const result = results[selectedJobId];
  const activeJob = jobs.find((job) => job._id === selectedJobId);

  return <div className="career-module mx-auto max-w-7xl">
    <PageHeading
      eyebrow={skillFocus ? 'Resume-grounded skill gaps' : 'Make informed applications'}
      title={skillFocus ? 'Skill gap & readiness' : 'Job analyzer & match'}
      description="Save a real job description, select one of your saved resumes, and review evidence-based skill matches, gaps, and a separate readiness assessment. No external job feed or employer prediction is implied."
      icon={skillFocus ? Target : WandSparkles}
    />
    {loading ? <LoadingState /> : loadError ? <section className={`${cardClass} p-6`} role="alert">
      <p className="font-semibold text-rose-800">Your job workspace could not be loaded.</p>
      <p className="mt-2 text-sm text-slate-600">{loadError}</p>
      <button onClick={() => void loadWorkspace()} className="mt-4 rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white">Try again</button>
    </section> : <div className="space-y-5">
      <section className={`${cardClass} grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5`}>
        <label className="block"><span className={labelClass}>Resume used for all matches</span>
          <div className="flex gap-2">
            <select aria-label="Saved resume for job matching" className={`${inputClass} min-w-0`} value={selectedResumeId} onChange={(event) => void selectResume(event.target.value)}>
              <option value="">Select a saved resume…</option>
              {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title} · updated {new Date(resume.updatedAt).toLocaleDateString()}</option>)}
            </select>
            <button type="button" onClick={() => { void loadWorkspace(false); setRefreshCount((count) => count + 1); }} disabled={matching || discoveryBusy} className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" aria-label="Refresh resume and job matches">
              {matching || discoveryBusy ? <LoaderCircle size={16} className="animate-spin" /> : 'Refresh'}
            </button>
          </div>
        </label>
        <p className="text-xs leading-5 text-slate-500 sm:max-w-xs">Each result uses the selected saved version. Saving or selecting a resume refreshes matches.</p>
      </section>

      {!resumes.length && <section className={`${cardClass} p-6`}>
        <h2 className="font-semibold text-slate-900">Save a resume to start matching</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create a resume or upload an existing one in the resume studio, review the extracted fields, then save it. Only saved resume data is used for matching.</p>
        <Link to="/resumes" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white">Open resume studio</Link>
      </section>}

      <section className={`${cardClass} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-semibold text-slate-900">Discover real jobs & internships</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Public provider listings are imported with source links. Unavailable boards are provided as direct search links instead.</p></div>
          <button onClick={() => setRefreshCount((count) => count + 1)} disabled={!selectedResumeId || discoveryBusy} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {discoveryBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Target size={14} />} {discoveryBusy ? 'Searching…' : 'Refresh discovery'}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField label="Role / keywords" value={roleFilter} onChange={setRoleFilter} placeholder="Use resume role or refine search" />
          <TextField label="Location" value={locationFilter} onChange={setLocationFilter} placeholder="City, region, or country" />
          <label className="block"><span className={labelClass}>Workplace</span><select className={inputClass} value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value)}><option value="all">Any workplace</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on-site">On-site</option></select></label>
          <label className="block"><span className={labelClass}>Employment</span><select className={inputClass} value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)}><option value="all">Any type</option><option value="internship">Internship / graduate</option><option value="full-time">Full-time</option><option value="contract">Contract / part-time</option></select></label>
          <label className="block"><span className={labelClass}>Experience level</span><select className={inputClass} value={experienceFilter} onChange={(event) => setExperienceFilter(event.target.value)}><option value="all">Any level</option><option value="entry">Entry / internship</option><option value="mid">Mid-level</option><option value="senior">Senior / lead</option></select></label>
          <label className="block"><span className={labelClass}>Date posted</span><select className={inputClass} value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">Any date</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option><option value="90">Past 90 days</option></select></label>
          <label className="flex min-h-10 items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} className="h-4 w-4 accent-[#286b60]" />Saved jobs only</label>
          <div className="self-end text-xs text-slate-500" aria-live="polite">{filteredDiscovered.length} matching listings</div>
        </div>
        {providers.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Job provider status">{providers.map((provider) => <span key={provider.id} title={provider.message} className={`rounded-full border px-2.5 py-1 text-[11px] ${provider.status === 'available' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : provider.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{provider.name}: {provider.status === 'available' ? `${provider.resultCount} fetched` : provider.status}</span>)}</div>}
        {providers.map((provider) => provider.status !== 'available' && <p key={`${provider.id}-message`} className="text-xs leading-5 text-amber-800">{provider.name}: {provider.message}</p>)}
        {discoveryError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{discoveryError}</p>}
        {searchLinks.length > 0 && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">Search other job boards directly</p>
          <div className="mt-2 flex flex-wrap gap-2">{searchLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" title={link.message} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#286b60] hover:border-[#8ebcb1]">{link.name}<ExternalLink size={11} /></a>)}</div>
          <p className="mt-2 text-[11px] leading-4 text-slate-500">LinkedIn, Naukri, Indeed, Internshala and Wellfound do not provide a supported public listing API for this app. These links open their search pages; no listings are scraped or fabricated.</p>
        </div>}
        {discoveryBusy && !discovered.length && <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600" role="status"><LoaderCircle size={16} className="animate-spin" />Searching available job providers using this saved resume…</div>}
        {!discoveryBusy && !discoveryError && selectedResumeId && !filteredDiscovered.length && <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
          <p className="font-semibold text-slate-800">{discovered.length ? 'No listings match these filters' : 'No relevant provider listings found'}</p>
          <p className="mt-1 text-sm leading-5 text-slate-500">{discovered.length ? 'Adjust location, role, or other filters.' : 'Try a broader role or location, or use the direct job-board searches above.'}</p>
        </div>}
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredDiscovered.slice(0, visibleJobCount).map((job) => <article key={job._id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#b8d4ca] hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="font-semibold text-slate-900">{job.title}</h3><p className="mt-1 text-sm text-slate-600">{job.company} · {job.location || 'Location not provided'}</p></div>
              <div className="flex shrink-0 gap-3 text-center"><div><p className="text-[9px] font-bold uppercase text-slate-500">Match</p><p className="text-xl font-bold text-[#286b60]">{job.matchScore}%</p></div><div><p className="text-[9px] font-bold uppercase text-slate-500">ATS</p><p className="text-xl font-bold text-slate-600">{job.resumeQualityScore}%</p></div><div><p className="text-[9px] font-bold uppercase text-slate-500">Ready</p><p className="text-xl font-bold text-slate-800">{job.readinessScore}%</p></div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
              <span className={pillClass}>{job.source}</span>
              {job.workplace && <span className={pillClass}>{job.workplace}</span>}
              {job.employmentType && <span className={pillClass}>{job.employmentType}</span>}
              {job.experienceLevel && <span className={pillClass}>{job.experienceLevel}</span>}
              {job.requiredExperienceYears !== null && <span className={pillClass}>{job.requiredExperienceYears}+ years stated</span>}
              {job.salary && <span className={pillClass}>{job.salary}</span>}
              {job.postedAt && <span className={pillClass}>Posted {new Date(job.postedAt).toLocaleDateString()}</span>}
            </div>
            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{job.description || 'The source did not provide a description snippet.'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(job.requiredSkills || []).slice(0, 7).map((skill) => <span key={skill} className={`rounded border px-2 py-1 text-[10px] ${job.matchedSkills.includes(skill) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{skill}{job.matchedSkills.includes(skill) ? ' ✓' : ' · gap'}</span>)}
              {(job.preferredSkills || []).slice(0, 3).map((skill) => <span key={skill} className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] text-sky-800">{skill} · preferred</span>)}
              {!job.requiredSkills?.length && !job.preferredSkills?.length && (job.tags || []).slice(0, 5).map((tag) => <span key={tag} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600">{tag}</span>)}
            </div>
            {job.matchingEvidence.length > 0 && <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">Why it matches: {job.matchingEvidence.slice(0, 2).map((evidence) => `${evidence.skill} (${evidence.evidence})`).join(' · ')}</p>}
            {job.skillsToLearn.length > 0 && <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-amber-800">Skills to review: {job.skillsToLearn.slice(0, 5).join(', ')}{job.skillsToLearn.length > 5 ? '…' : ''}</p>}
            {job.recommendedActions.length > 0 && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">Next step: {job.recommendedActions[0]}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="text-[10px] text-slate-500">Source: {job.source}{job.isStale ? ' · last seen earlier' : ''}</span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void toggleSaved(job)} className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Bookmark size={13} fill={job.isSaved ? 'currentColor' : 'none'} />{job.isSaved ? 'Saved' : 'Save'}</button>
                <button onClick={() => void trackJob(job)} className="min-h-8 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Track</button>
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 rounded-md bg-[#123d38] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#19534c]">Apply at source<ExternalLink size={12} /></a>
              </div>
            </div>
          </article>)}
        </div>
        {filteredDiscovered.length > visibleJobCount && <button type="button" onClick={() => setVisibleJobCount((count) => count + 20)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#8ebcb1] hover:bg-slate-50">
          Show more jobs ({filteredDiscovered.length - visibleJobCount} remaining)
        </button>}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(310px,.8fr)_minmax(0,1.2fr)]">
        <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-base font-semibold text-slate-900">{editingJobId ? 'Edit saved job' : 'Add a job description'}</h2>
              <p className="mt-1 text-xs text-slate-500">Source: job description you provide</p></div>
            {selectedJobId && <button onClick={() => void deleteJob()} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label="Delete selected job"><Trash2 size={16} /></button>}
          </div>
          <label className="block"><span className={labelClass}>Saved jobs</span>
            <select aria-label="Saved job descriptions" className={inputClass} value={selectedJobId} onChange={(event) => selectJob(event.target.value)}>
              <option value="">New job description…</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} — {job.company}</option>)}
            </select>
          </label>
          <TextField label="Role title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="e.g. Senior Product Designer" />
          <TextField label="Company" value={form.company} onChange={(value) => setForm((current) => ({ ...current, company: value }))} placeholder="Company name" />
          <TextField label="Job description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} multiline rows={11} placeholder="Paste the full job description, including skills and experience requirements…" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void saveJob()} disabled={saving || form.title.trim().length === 0 || form.company.trim().length === 0 || form.description.trim().length < 30} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Saving…' : editingJobId ? 'Update job & refresh matches' : 'Save job & match'}
            </button>
            {editingJobId && <button onClick={() => { setEditingJobId(''); setSelectedJobId(''); setForm(emptyJob); }} className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">New job</button>}
          </div>
          <p className="text-xs leading-5 text-slate-500">Descriptions are private to your account. Matching is recalculated against this text when you save, select, or refresh.</p>
        </section>

        <section className={`${cardClass} min-h-96 p-5 sm:p-6`}>
          {matching && <div className="mb-4 flex items-center gap-2 text-sm text-slate-500" role="status"><LoaderCircle size={15} className="animate-spin" />Recalculating matches from your saved resume…</div>}
          {!activeJob ? <div className="flex min-h-80 flex-col items-center justify-center text-center">
            <FileText className="mb-4 text-[#43867a]" size={30} />
            <h2 className="font-semibold text-slate-900">Your job analysis will appear here</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Save a job description and select a saved resume to see the comparison.</p>
          </div> : !selectedResumeId ? <div className="py-10 text-center">
            <h2 className="font-semibold text-slate-900">{activeJob.title} · {activeJob.company}</h2>
            <p className="mt-2 text-sm text-slate-600">Select or save a resume to analyze this job description.</p>
          </div> : !result ? <div className="py-10 text-center">
            <h2 className="font-semibold text-slate-900">Match results are not available yet</h2>
            <p className="mt-2 text-sm text-slate-600">Check your connection and refresh to recalculate against {activeJob.title}.</p>
          </div> : <div>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saved job · user-provided description</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{result.jobTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{result.company} <span className="text-slate-400">· Matched with {result.resumeTitle}</span></p></div>
              <div className="flex gap-5 text-center">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Match</p><p className="mt-1 text-3xl font-bold text-[#286b60]">{result.matchScore}<span className="text-base">%</span></p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Readiness</p><p className="mt-1 text-3xl font-bold text-slate-800">{result.readinessScore}<span className="text-base">%</span></p></div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume quality</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{result.resumeQualityScore}/100</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">ATS-readable resume content quality; distinct from job readiness and match.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness breakdown</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Based on identified role skills, experience/project evidence, stated education, completeness, and job-specific terms. Not an employment prediction.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {result.scoreDetails.map((detail) => <div key={detail.name}>
                <div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{detail.name}</span><span className="text-slate-500">{detail.score}/{detail.maxScore}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#43867a]" style={{ width: `${detail.maxScore ? (detail.score / detail.maxScore) * 100 : 0}%` }} /></div>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{detail.detail}</p>
              </div>)}
            </div>
            {result.requirements.length > 0 && <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Skills identified in the job description</h3>
              <div className="mt-2 flex flex-wrap gap-2">{result.requirements.map((skill) => <span key={skill} className={`${pillClass} ${result.matchedSkills.includes(skill) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{skill}{result.matchedSkills.includes(skill) ? ' · in resume' : ' · not found'}</span>)}</div>
              <p className="mt-2 text-[11px] text-slate-500">“Not found” means absent from the saved resume text, not necessarily absent from your experience.</p>
            </div>}
            <InfoList title="Skills to review or learn (if applicable)" items={result.skillsToLearn} />
            {result.strengths.length > 0 && <InfoList title="Resume evidence & strengths" items={result.strengths} />}
            {result.gaps.length > 0 && <InfoList title="Gaps to review" items={result.gaps} />}
            {result.matchingEvidence.length > 0 && <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Evidence from the selected resume</h3>
              <ul className="mt-2 space-y-2">{result.matchingEvidence.slice(0, 12).map((entry, index) => <li key={`${entry.skill}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600"><span className="font-semibold text-[#286b60]">{entry.skill}: </span>{entry.evidence}</li>)}</ul>
            </div>}
            {result.missingJobKeywords.length > 0 && <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Other job-description terms not found</h3>
              <div className="mt-2 flex flex-wrap gap-2">{result.missingJobKeywords.slice(0, 20).map((term) => <span key={term} className={pillClass}>{term}</span>)}</div>
            </div>}
            <InfoList title="Recommended next steps" items={result.recommendedActions} />
            <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500">
              Education and experience are inferred only from resume and job-description text. Missing information is not proof of ineligibility; review the original posting and confirm requirements yourself.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/resumes" className="rounded-lg bg-[#123d38] px-4 py-2 text-sm font-semibold text-white hover:bg-[#19534c]">Review selected resume</Link>
              <button onClick={() => void calculateMatches(selectedResumeId, jobs)} disabled={matching} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Recalculate match</button>
            </div>
          </div>}
        </section>
      </div>
    </div>}
  </div>;
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div className="mt-6">
    <h3 className="text-sm font-semibold text-slate-900">{title} <span className="font-normal text-slate-500">({items.length})</span></h3>
    {items.length ? <ul className="mt-2 space-y-2">{items.map((item, index) => <li key={`${index}-${item}`} className="flex gap-2 text-sm leading-5 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#43867a]" />{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No items were identified.</p>}
  </div>;
}

export const JobAnalyzerPage: React.FC = () => <JobWorkspacePage />;
export const SkillGapPage: React.FC = () => <JobWorkspacePage skillFocus />;

const stages = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
export const ApplicationTrackerPage: React.FC = () => {
  const workspace = useWorkspace('application', { company: '', role: '', status: 'Saved', date: '', notes: '', link: '' }, 'Application');
  const { showToast } = useToast();
  const setStatus = (status: string) => workspace.set('status', status);
  const saveApplication = async () => {
    if (!workspace.fields.company.trim() || !workspace.fields.role.trim()) {
      showToast('Add both a company and a role before saving this application.', 'error');
      return;
    }
    const documentTitle = `${workspace.fields.company.trim()} — ${workspace.fields.role.trim()}`;
    await workspace.save(workspace.selected ? workspace.title : documentTitle);
  };
  return <div className="career-module mx-auto max-w-6xl"><PageHeading eyebrow="Keep your search organized" title="Application tracker" description="Save roles, track your progress through each hiring stage, and keep notes close to the application." icon={FileText} />
    <WorkspacePicker {...workspace} kind="application" onSelect={workspace.choose} onNew={workspace.newDocument} onDelete={workspace.remove} />
    {workspace.loading ? <LoadingState /> : <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><section className={`${cardClass} space-y-4 p-5 sm:p-6`}><TextField label="Company" value={workspace.fields.company} onChange={(v) => workspace.set('company', v)} placeholder="Company name" /><TextField label="Role" value={workspace.fields.role} onChange={(v) => workspace.set('role', v)} placeholder="Job title" /><label className="block"><span className={labelClass}>Stage</span><select className={inputClass} value={workspace.fields.status} onChange={(e) => setStatus(e.target.value)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label><TextField label="Applied / saved date" type="date" value={workspace.fields.date} onChange={(v) => workspace.set('date', v)} /><TextField label="Job link" value={workspace.fields.link} onChange={(v) => workspace.set('link', v)} placeholder="https://…" /><TextField label="Notes" value={workspace.fields.notes} onChange={(v) => workspace.set('notes', v)} multiline rows={5} placeholder="Recruiter, follow-up, interview notes…" />    <SaveButton onClick={() => void saveApplication()} busy={workspace.busy} label={workspace.selected ? 'Update application' : 'Save application'} /></section>
      <section className={`${cardClass} p-5 sm:p-6`}><p className="mb-4 text-sm font-bold text-white">Your pipeline <span className="text-slate-500">· {workspace.items.length} roles</span></p>{workspace.items.length ? <div className="space-y-3">{workspace.items.map((item) => <button key={item._id} onClick={() => workspace.choose(item._id)} className={`w-full rounded-xl border p-4 text-left transition ${item._id === workspace.selected ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-white">{valueOf(item.data, 'role') || item.title}</p><span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-cyan-200">{valueOf(item.data, 'status') || 'Saved'}</span></div><p className="mt-1 text-sm text-slate-400">{valueOf(item.data, 'company') || 'Company not set'}{valueOf(item.data, 'date') ? ` · ${valueOf(item.data, 'date')}` : ''}</p>{valueOf(item.data, 'notes') && <p className="mt-3 line-clamp-2 text-xs text-slate-500">{valueOf(item.data, 'notes')}</p>}</button>)}</div> : <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center"><Plus className="mx-auto mb-3 text-slate-500" /><p className="font-semibold text-slate-200">No applications yet</p><p className="mt-1 text-sm text-slate-500">Save a role to start tracking your search.</p></div>}</section>
    </div>}</div>;
};

export const PublicPortfolioPage: React.FC = () => {
  const { slug } = useParams();
  const [item, setItem] = useState<WorkspaceItem | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!slug) return;
    api.get(`/workspace/public/portfolio/${encodeURIComponent(slug)}`)
      .then(({ data }) => setItem(data.item))
      .catch((reason: unknown) => setError(errorMessage(reason, 'This portfolio could not be found.')));
  }, [slug]);
  if (error) return <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center"><div><h1 className="text-2xl font-bold text-white">Portfolio unavailable</h1><p className="mt-2 text-slate-400">{error}</p><Link to="/" className="mt-5 inline-block text-cyan-300">CareerForgeAI home</Link></div></div>;
  if (!item) return <LoadingState />;
  const fields = Object.fromEntries(Object.entries(item.data).map(([key, value]) => [key, typeof value === 'string' ? value : '']));
  return <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-8"><div className="mx-auto max-w-4xl"><Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> CareerForgeAI</Link><PortfolioPreview fields={fields} /></div></main>;
};

function LoadingState() {
  return <div aria-label="Loading your saved documents" className="grid gap-5 xl:grid-cols-2">
    <div className={`${cardClass} space-y-5 p-5 sm:p-6`}>
      <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
      <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div>
      <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
    </div>
    <div className={`${cardClass} min-h-[420px] animate-pulse p-7`}><div className="mx-auto h-5 w-40 rounded bg-slate-100" /><div className="mx-auto mt-8 h-72 max-w-sm rounded-lg border border-slate-100 bg-slate-50" /></div>
  </div>;
}
