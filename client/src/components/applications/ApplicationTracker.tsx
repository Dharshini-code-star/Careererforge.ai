import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { workspaceService, type WorkspaceItem } from '../../services/workspaceService';
import { useToast } from '../../components/common/Toast';

const stages = ['Saved', 'Planned', 'Applied', 'Interview', 'Offer', 'Rejected'] as const;
type Stage = typeof stages[number];
type Fields = { company: string; role: string; status: Stage; date: string; nextAction: string; notes: string; link: string };
const emptyFields: Fields = { company: '', role: '', status: 'Saved', date: '', nextAction: '', notes: '', link: '' };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#258276] focus:ring-2 focus:ring-[#258276]/15';
const statusClass: Record<Stage, string> = {
  Saved: 'bg-slate-100 text-slate-700', Planned: 'bg-blue-50 text-blue-700', Applied: 'bg-teal-50 text-teal-700', Interview: 'bg-violet-50 text-violet-700', Offer: 'bg-emerald-50 text-emerald-700', Rejected: 'bg-rose-50 text-rose-700',
};

const stringValue = (item: WorkspaceItem, key: string) => typeof item.data[key] === 'string' ? item.data[key] as string : '';
const asStage = (value: string): Stage => stages.includes(value as Stage) ? value as Stage : 'Saved';
const validUrl = (value: string) => { try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''; } catch { return ''; } };

export function ApplicationTracker() {
  const { showToast } = useToast();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'All' | Stage>('All');
  const [editingId, setEditingId] = useState('');
  const [fields, setFields] = useState<Fields>(emptyFields);
  const load = useCallback(async () => {
    try { setItems(await workspaceService.list('application')); }
    catch { showToast('Could not load applications.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { void load(); }, [load]);
  const visibleItems = useMemo(() => filter === 'All' ? items : items.filter((item) => asStage(stringValue(item, 'status')) === filter), [filter, items]);
  const count = (stage: Stage) => items.filter((item) => asStage(stringValue(item, 'status')) === stage).length;
  const update = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields((current) => ({ ...current, [key]: value }));
  const startNew = () => { setEditingId(''); setFields(emptyFields); setShowForm(true); };
  const edit = (item: WorkspaceItem) => {
    setEditingId(item._id);
    setFields({ company: stringValue(item, 'company'), role: stringValue(item, 'role'), status: asStage(stringValue(item, 'status')), date: stringValue(item, 'date'), nextAction: stringValue(item, 'nextAction'), notes: stringValue(item, 'notes'), link: stringValue(item, 'link') });
    setShowForm(true);
  };
  const save = async () => {
    if (!fields.company.trim() || !fields.role.trim()) { showToast('Add a company and job title before saving.', 'error'); return; }
    setSaving(true);
    try {
      const title = `${fields.company.trim()} — ${fields.role.trim()}`;
      const item = editingId ? await workspaceService.update('application', editingId, title, fields) : await workspaceService.create('application', title, fields);
      setItems((current) => [item, ...current.filter((entry) => entry._id !== item._id)]);
      setShowForm(false);
      showToast(editingId ? 'Application updated.' : 'Application added.', 'success');
    } catch { showToast('Could not save this application.', 'error'); }
    finally { setSaving(false); }
  };
  const updateStatus = async (item: WorkspaceItem, status: Stage) => {
    try {
      const updated = await workspaceService.update('application', item._id, item.title, { ...item.data, status });
      setItems((current) => current.map((entry) => entry._id === item._id ? updated : entry));
      showToast('Application stage updated.', 'success');
    } catch { showToast('Could not update the application stage.', 'error'); }
  };
  const remove = async (item: WorkspaceItem) => {
    if (!window.confirm(`Delete ${item.title}?`)) return;
    try { await workspaceService.remove('application', item._id); setItems((current) => current.filter((entry) => entry._id !== item._id)); showToast('Application deleted.', 'success'); }
    catch { showToast('Could not delete this application.', 'error'); }
  };
  return <div className="career-module mx-auto max-w-[1280px] space-y-6">
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#287569]">Job search workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Application Tracker</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep application stages, follow-ups, notes, and original employer links together.</p></div><button onClick={startNew} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#123d38] px-4 text-sm font-semibold text-white transition hover:bg-[#19534c]"><Plus size={16} />Add Application</button></header>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Application summary">{([{ label: 'Total saved', value: items.length, tone: 'text-slate-900' }, { label: 'Applied', value: count('Applied'), tone: 'text-teal-700' }, { label: 'Interviews', value: count('Interview'), tone: 'text-violet-700' }, { label: 'Offers', value: count('Offer'), tone: 'text-emerald-700' }]).map((metric) => <article key={metric.label} className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_18px_-16px_rgba(15,23,42,.24)]"><p className="text-xs font-medium text-slate-500">{metric.label}</p><p className={`mt-1 text-2xl font-bold tracking-tight ${metric.tone}`}>{loading ? '—' : metric.value}</p></article>)}</section>
    {showForm && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-26px_rgba(15,23,42,.32)] sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold text-slate-900">{editingId ? 'Edit application' : 'Add application'}</h2><p className="mt-1 text-xs text-slate-500">Saving here tracks your preparation; it does not submit an application.</p></div><button onClick={() => setShowForm(false)} aria-label="Close application form" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Company"><input className={inputClass} value={fields.company} onChange={(event) => update('company', event.target.value)} placeholder="Company name" /></Field><Field label="Job title"><input className={inputClass} value={fields.role} onChange={(event) => update('role', event.target.value)} placeholder="Role title" /></Field><Field label="Application stage"><select className={inputClass} value={fields.status} onChange={(event) => update('status', asStage(event.target.value))}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></Field><Field label="Date"><input className={inputClass} type="date" value={fields.date} onChange={(event) => update('date', event.target.value)} /></Field><Field label="Next action"><input className={inputClass} value={fields.nextAction} onChange={(event) => update('nextAction', event.target.value)} placeholder="Follow up with recruiter" /></Field><Field label="Original job URL"><input className={inputClass} type="url" value={fields.link} onChange={(event) => update('link', event.target.value)} placeholder="https://…" /></Field></div><Field label="Notes"><textarea className={`${inputClass} mt-1 resize-y`} rows={4} value={fields.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Interview notes, recruiter details, or preparation reminders" /></Field><div className="mt-5 flex flex-wrap justify-end gap-2"><button onClick={() => setShowForm(false)} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={saving} onClick={() => void save()} className="min-h-10 rounded-lg bg-[#123d38] px-4 text-sm font-semibold text-white hover:bg-[#19534c] disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Save application'}</button></div></section>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_6px_18px_-16px_rgba(15,23,42,.24)]"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Saved applications</h2><p className="mt-0.5 text-xs text-slate-500">{visibleItems.length} {visibleItems.length === 1 ? 'application' : 'applications'} shown</p></div><label className="flex items-center gap-2 text-xs font-medium text-slate-600">Stage <select className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#258276]" value={filter} onChange={(event) => setFilter(event.target.value as 'All' | Stage)}><option>All</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label></div>
      {loading ? <div className="space-y-3 p-4"><div className="h-14 animate-pulse rounded-lg bg-slate-100" /><div className="h-14 animate-pulse rounded-lg bg-slate-100" /></div> : !visibleItems.length ? <div className="px-5 py-14 text-center"><Plus className="mx-auto h-8 w-8 text-[#43867a]" /><h3 className="mt-3 text-sm font-semibold text-slate-800">{items.length ? 'No applications match this stage' : 'No applications saved yet'}</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{items.length ? 'Choose a different filter or add another application.' : 'Add a role to track its status, follow-up action, notes, and employer link.'}</p>{!items.length && <button onClick={startNew} className="mt-4 text-sm font-semibold text-[#286b60] hover:text-[#123d38]">Add your first application</button>}</div> : <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Company</th><th className="px-4 py-3">Job title</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Next action</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleItems.map((item) => <ApplicationRow key={item._id} item={item} onEdit={edit} onDelete={remove} onStatus={updateStatus} />)}</tbody></table></div><div className="space-y-3 p-4 md:hidden">{visibleItems.map((item) => <ApplicationCard key={item._id} item={item} onEdit={edit} onDelete={remove} onStatus={updateStatus} />)}</div></>}</section>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>; }
function ApplicationRow({ item, onEdit, onDelete, onStatus }: { item: WorkspaceItem; onEdit: (item: WorkspaceItem) => void; onDelete: (item: WorkspaceItem) => void; onStatus: (item: WorkspaceItem, status: Stage) => void }) { const status = asStage(stringValue(item, 'status')); const link = validUrl(stringValue(item, 'link')); return <tr className="text-sm text-slate-700"><td className="px-5 py-4 font-medium text-slate-900">{stringValue(item, 'company')}</td><td className="px-4 py-4"><div className="font-medium text-slate-800">{stringValue(item, 'role')}</div>{link && <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#286b60] hover:text-[#123d38]">Job link <ExternalLink size={12} /></a>}</td><td className="px-4 py-4"><select aria-label={`Update stage for ${item.title}`} value={status} onChange={(event) => void onStatus(item, asStage(event.target.value))} className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none ${statusClass[status]}`}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></td><td className="px-4 py-4 text-sm text-slate-500">{stringValue(item, 'date') || '—'}</td><td className="max-w-52 px-4 py-4 text-sm text-slate-600">{stringValue(item, 'nextAction') || '—'}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={15} /></button><button onClick={() => void onDelete(item)} aria-label={`Delete ${item.title}`} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button></div></td></tr>; }
function ApplicationCard({ item, onEdit, onDelete, onStatus }: { item: WorkspaceItem; onEdit: (item: WorkspaceItem) => void; onDelete: (item: WorkspaceItem) => void; onStatus: (item: WorkspaceItem, status: Stage) => void }) { const status = asStage(stringValue(item, 'status')); const link = validUrl(stringValue(item, 'link')); return <article className="rounded-lg border border-slate-200 p-4"><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{stringValue(item, 'company')}</p><p className="mt-1 text-sm text-slate-600">{stringValue(item, 'role')}</p></div><select aria-label={`Update stage for ${item.title}`} value={status} onChange={(event) => void onStatus(item, asStage(event.target.value))} className={`h-fit rounded-full px-2.5 py-1 text-xs font-semibold outline-none ${statusClass[status]}`}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="font-semibold text-slate-500">Date</p><p className="mt-1 text-slate-700">{stringValue(item, 'date') || '—'}</p></div><div><p className="font-semibold text-slate-500">Next action</p><p className="mt-1 text-slate-700">{stringValue(item, 'nextAction') || '—'}</p></div></div>{stringValue(item, 'notes') && <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">{stringValue(item, 'notes')}</p>}<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">{link ? <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#286b60]">Original job <ExternalLink size={12} /></a> : <span /> }<div className="flex gap-1"><button onClick={() => onEdit(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button><button onClick={() => void onDelete(item)} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button></div></div></article>; }
