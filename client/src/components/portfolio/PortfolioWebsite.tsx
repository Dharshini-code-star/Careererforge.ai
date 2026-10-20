import { useState } from 'react';
import { ArrowRight, Code2, ExternalLink, Github, Linkedin, Mail, Menu, X } from 'lucide-react';

export type PortfolioFields = Record<string, string>;
type Template = 'Modern Developer' | 'Creative Portfolio' | 'Minimal Professional' | 'Dark Tech';

const isUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch { return ''; }
};

const isImageUrl = (value: string) => Boolean(isUrl(value)) || /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value);

const luminanceOf = (hex: string) => {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => parseInt(channel, 16) / 255) ?? [0, 0, 0];
  return channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
};

const contrastTextFor = (background: string) => {
  const backgroundLuminance = luminanceOf(background);
  const contrast = (foregroundLuminance: number) => (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
  if (contrast(1) >= 4.5) return '#ffffff';
  if (contrast(luminanceOf('#0f172a')) >= 4.5) return '#0f172a';
  return '#000000';
};

const split = (value: string, expression = /[,\n;]/) => value.split(expression).map((entry) => entry.trim()).filter(Boolean);

type Project = { title: string; description: string; technologies: string[]; github: string; demo: string; image: string; highlights: string[] };
const projectsFrom = (value: string): Project[] => value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
  const [title = '', description = '', third = '', fourth = '', fifth = '', sixth = '', seventh = ''] = line.split('|').map((part) => part.trim());
  // Legacy project entries used title | description | github | demo. New entries add technologies, image and highlights.
  const legacy = Boolean(isUrl(third));
  return {
    title,
    description,
    technologies: legacy ? [] : split(third),
    github: isUrl(legacy ? third : fourth),
    demo: isUrl(legacy ? fourth : fifth),
    image: isUrl(legacy ? '' : sixth),
    highlights: split(legacy ? fifth : seventh, /[;,]/),
  };
});

const templateClasses: Record<Template, { page: string; shell: string; label: string; primary: string; chip: string; section: string }> = {
  'Modern Developer': { page: 'bg-[var(--cf-canvas)] text-slate-900', shell: 'max-w-6xl', label: 'text-[var(--cf-accent-text)]', primary: 'bg-[var(--cf-navy)] hover:bg-[var(--cf-navy-hover)]', chip: 'bg-[var(--cf-accent-soft)] text-[var(--cf-accent-text)] ring-1 ring-blue-100', section: 'border-slate-200' },
  'Creative Portfolio': { page: 'bg-[var(--cf-canvas)] text-slate-900', shell: 'max-w-7xl', label: 'text-[var(--cf-accent-text)]', primary: 'bg-[var(--cf-navy)] hover:bg-[var(--cf-navy-hover)]', chip: 'bg-slate-100 text-slate-700', section: 'border-slate-200' },
  'Minimal Professional': { page: 'bg-white text-slate-900', shell: 'max-w-5xl', label: 'text-slate-600', primary: 'bg-[var(--cf-navy)] hover:bg-[var(--cf-navy-hover)]', chip: 'bg-slate-100 text-slate-700', section: 'border-slate-200' },
  'Dark Tech': { page: 'bg-[#07111f] text-slate-100', shell: 'max-w-6xl', label: 'text-blue-300', primary: 'bg-blue-300 text-[#06101d] hover:bg-blue-200', chip: 'bg-blue-300/10 text-blue-200 ring-1 ring-blue-300/20', section: 'border-slate-700/80' },
};

function SocialLinks({ fields, className = '' }: { fields: PortfolioFields; className?: string }) {
  const links = [
    { href: isUrl(fields.github || ''), label: 'GitHub', icon: Github },
    { href: isUrl(fields.linkedin || ''), label: 'LinkedIn', icon: Linkedin },
    { href: isUrl(fields.website || ''), label: 'Website', icon: Code2 },
  ].filter((link) => link.href);
  if (!links.length) return null;
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{links.map(({ href, label, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:opacity-70"><Icon size={17} />{label}</a>)}</div>;
}

function SiteNav({ name, sections, dark }: { name: string; sections: Array<{ id: string; label: string }>; dark: boolean }) {
  const [open, setOpen] = useState(false);
  return <nav className={`sticky top-0 z-20 border-b backdrop-blur-xl ${dark ? 'border-slate-800 bg-[#07111f]/85' : 'border-black/5 bg-white/80'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><a href="#top" className="font-bold tracking-tight">{name || 'Portfolio'}<span className={dark ? 'text-blue-300' : 'text-[var(--cf-accent)]'}>.</span></a>
      <div className="hidden items-center gap-6 md:flex">{sections.map((section) => <a className="text-sm font-medium opacity-70 transition hover:opacity-100" key={section.id} href={`#${section.id}`}>{section.label}</a>)}</div>
      <button className="rounded-lg p-2 md:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
    {open && <div className={`border-t px-5 pb-4 md:hidden ${dark ? 'border-slate-800 bg-[#07111f]' : 'border-black/5 bg-white'}`}>{sections.map((section) => <a onClick={() => setOpen(false)} className="block py-2 text-sm font-medium" key={section.id} href={`#${section.id}`}>{section.label}</a>)}</div>}
  </nav>;
}

export function PortfolioWebsite({ fields, preview = false }: { fields: PortfolioFields; preview?: boolean }) {
  const template = (['Modern Developer', 'Creative Portfolio', 'Minimal Professional', 'Dark Tech'].includes(fields.template) ? fields.template : 'Modern Developer') as Template;
  const styles = templateClasses[template];
  const accent = /^#[0-9a-fA-F]{6}$/.test(fields.accentColor || '') ? fields.accentColor : '';
  const accentForeground = contrastTextFor(accent || (template === 'Dark Tech' ? '#93c5fd' : '#17365d'));
  const projects = projectsFrom(fields.projects || '');
  const skills = split(fields.skills || '');
  const experience = fields.experience?.trim();
  const education = fields.education?.trim();
  const certifications = fields.certifications?.trim();
  const achievements = fields.achievements?.trim();
  const email = fields.email?.trim();
  const photoCandidate = fields.photoUrl || '';
  const photo = isImageUrl(photoCandidate) ? photoCandidate : '';
  const hasContact = Boolean(email || isUrl(fields.github || '') || isUrl(fields.linkedin || '') || isUrl(fields.website || ''));
  const sections = [
    ...(fields.about?.trim() ? [{ id: 'about', label: 'About' }] : []),
    ...(skills.length ? [{ id: 'skills', label: 'Skills' }] : []),
    ...(experience ? [{ id: 'experience', label: 'Experience' }] : []),
    ...(projects.length ? [{ id: 'projects', label: 'Projects' }] : []),
    ...(education ? [{ id: 'education', label: 'Education' }] : []),
    ...(hasContact ? [{ id: 'contact', label: 'Contact' }] : []),
  ];
  const dark = template === 'Dark Tech';
  const creative = template === 'Creative Portfolio';
  const minimal = template === 'Minimal Professional';
  const frame = preview ? 'portfolio-preview-frame rounded-2xl shadow-2xl' : 'min-h-screen';
  return <article id="top" className={`${frame} ${styles.page} overflow-hidden`}>
    <SiteNav name={fields.name} sections={sections} dark={dark} />
    <main className={`mx-auto ${styles.shell} px-5 sm:px-8`}>
      <section className={`relative grid items-center gap-10 py-16 sm:py-24 ${creative ? 'lg:grid-cols-[1.1fr_.9fr]' : photo ? 'lg:grid-cols-[1.3fr_.7fr]' : ''}`}>
        {dark && <div className="pointer-events-none absolute inset-0 -z-0 opacity-40 [background-image:linear-gradient(rgba(96,165,250,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,.08)_1px,transparent_1px)] [background-size:36px_36px]" />}
        {creative && <div className="pointer-events-none absolute right-0 top-0 -z-0 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />}
        <div className="relative z-10"><p className={`mb-5 text-xs font-extrabold uppercase tracking-[.22em] ${styles.label}`}>{template === 'Dark Tech' ? '// available for opportunities' : template === 'Creative Portfolio' ? 'Independent creator & problem solver' : 'Portfolio / 2026'}</p>
          <h1 className={`max-w-3xl font-black tracking-[-.06em] ${minimal ? 'text-5xl leading-[.98] sm:text-7xl' : 'text-5xl leading-[.95] sm:text-7xl'}`}>Hi, I’m {fields.name || 'a professional'}<span className={dark ? 'text-blue-300' : 'text-[var(--cf-accent)]'} style={accent ? { color: accent } : undefined}>.</span></h1>
          {fields.headline && <p className={`mt-6 max-w-2xl text-xl font-medium leading-8 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{fields.headline}</p>}
          {fields.about && <p className={`mt-5 max-w-xl text-base leading-7 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{fields.about}</p>}
          <div className="mt-8 flex flex-wrap gap-3">{projects.length > 0 && <a href="#projects" style={{ backgroundColor: accent || undefined, color: accentForeground }} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${styles.primary}`}>View projects <ArrowRight size={17} /></a>}{hasContact && <a href="#contact" className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition hover:bg-black/5 ${styles.section}`}>Contact me <Mail size={16} /></a>}</div>
          <SocialLinks fields={fields} className={`mt-7 ${dark ? 'text-slate-300' : 'text-slate-700'}`} />
        </div>
        {photo && <div className={`relative z-10 mx-auto ${creative ? 'rotate-3' : ''}`}><div className={`absolute -inset-3 -z-10 rounded-[2rem] ${dark ? 'bg-blue-300/20 blur-xl' : 'bg-blue-100'}`} /><img src={photo} alt={`${fields.name}'s portrait`} className={`h-64 w-64 object-cover shadow-2xl sm:h-80 sm:w-80 ${minimal ? 'rounded-none grayscale' : 'rounded-[2rem]'}`} /></div>}
      </section>

      {skills.length > 0 && <section id="skills" className={`border-t py-14 sm:py-20 ${styles.section}`}><SectionTitle number="01" title={creative ? 'My creative toolkit' : 'Skills & expertise'} dark={dark} /><div className={`mt-8 flex flex-wrap gap-2 ${minimal ? 'max-w-3xl' : ''}`}>{skills.map((skill) => <span key={skill} className={`rounded-full px-4 py-2 text-sm font-semibold ${styles.chip}`}>{skill}</span>)}</div></section>}
      {experience && <section id="experience" className={`border-t py-14 sm:py-20 ${styles.section}`}><SectionTitle number="02" title="Experience" dark={dark} /><p className={`mt-8 max-w-4xl whitespace-pre-wrap text-base leading-8 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{experience}</p></section>}
      {projects.length > 0 && <section id="projects" className={`border-t py-14 sm:py-20 ${styles.section}`}><SectionTitle number="03" title={creative ? 'Selected stories' : 'Selected projects'} dark={dark} />
        <div className={`mt-8 grid gap-6 ${minimal ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>{projects.map((project, index) => <article key={`${project.title}-${index}`} className={`group overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${creative && index === 0 && projects.length > 1 ? 'md:col-span-2 md:grid md:grid-cols-2' : ''} ${dark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          {project.image && <img className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" src={project.image} alt={`${project.title} project`} />}
          <div className="p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-extrabold tracking-tight">{project.title}</h3><span className={`text-xs font-bold ${styles.label}`}>0{index + 1}</span></div>{project.description && <p className={`mt-3 text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{project.description}</p>}
            {project.technologies.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{project.technologies.map((technology) => <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles.chip}`} key={technology}>{technology}</span>)}</div>}
            {project.highlights.length > 0 && <ul className={`mt-4 space-y-1 text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{project.highlights.map((highlight) => <li key={highlight}>• {highlight}</li>)}</ul>}
            {(project.github || project.demo) && <div className="mt-5 flex gap-4 text-sm font-bold">{project.github && <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:opacity-70"><Github size={16} /> Code</a>}{project.demo && <a href={project.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:opacity-70">Live demo <ExternalLink size={15} /></a>}</div>}
          </div>
        </article>)}</div></section>}
      {(education || certifications || achievements) && <section id="education" className={`grid gap-10 border-t py-14 sm:py-20 ${styles.section} ${minimal ? '' : 'md:grid-cols-3'}`}>
        {education && <InfoBlock title="Education" content={education} dark={dark} />}{certifications && <InfoBlock title="Certifications" content={certifications} dark={dark} />}{achievements && <InfoBlock title="Achievements" content={achievements} dark={dark} />}
      </section>}
      {hasContact && <section id="contact" className={`border-t py-16 sm:py-24 ${styles.section}`}><p className={`text-xs font-bold uppercase tracking-[.2em] ${styles.label}`}>Let’s connect</p><h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.05em] sm:text-6xl">Have a role or project in mind?</h2><div className="mt-8 flex flex-wrap items-center gap-5">{email && <a style={{ backgroundColor: accent || undefined, color: accentForeground }} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${styles.primary}`} href={`mailto:${email}`}><Mail size={17} />{email}</a>}<SocialLinks fields={fields} /></div></section>}
    </main>
    <footer className={`border-t px-5 py-8 text-center text-sm ${styles.section} ${dark ? 'text-slate-500' : 'text-slate-500'}`}>© {new Date().getFullYear()} {fields.name || 'Portfolio'}</footer>
  </article>;
}

function SectionTitle({ number, title, dark }: { number: string; title: string; dark: boolean }) { return <div className="flex items-baseline gap-4"><span className={dark ? 'text-blue-300' : 'text-[var(--cf-accent)]'}>{number}</span><h2 className="text-3xl font-black tracking-[-.045em] sm:text-4xl">{title}</h2></div>; }
function InfoBlock({ title, content, dark }: { title: string; content: string; dark: boolean }) { return <div><h2 className="text-xl font-extrabold tracking-tight">{title}</h2><p className={`mt-3 whitespace-pre-wrap text-sm leading-7 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{content}</p></div>; }
