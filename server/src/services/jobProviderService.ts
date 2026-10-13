import type { ResumeFields } from './resumeService.js';

export type JobProviderName = 'remotive' | 'arbeitnow' | 'adzuna';
export interface ProviderJob {
  providerId: string;
  source: JobProviderName;
  title: string;
  company: string;
  description: string;
  url: string;
  location: string;
  remote?: boolean;
  workplace: 'remote' | 'hybrid' | 'on-site' | '';
  employmentType: string;
  experienceLevel: string;
  salary: string;
  tags: string[];
  postedAt?: Date;
}

export interface ProviderStatus {
  id: string;
  name: string;
  status: 'available' | 'unavailable' | 'error' | 'rate-limited';
  message: string;
  resultCount: number;
}

export interface JobSearchLink {
  id: string;
  name: string;
  url: string;
  status: 'search-link';
  message: string;
}

interface ProviderResult {
  status: ProviderStatus;
  jobs: ProviderJob[];
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface RemotiveResponse {
  jobs?: Array<{
    id?: number;
    url?: string;
    title?: string;
    company_name?: string;
    candidate_required_location?: string;
    job_type?: string;
    category?: string;
    tags?: string[];
    salary?: string;
    publication_date?: string;
    description?: string;
  }>;
}

interface ArbeitnowResponse {
  data?: Array<{
    slug?: string;
    url?: string;
    title?: string;
    company_name?: string;
    location?: string;
    remote?: boolean;
    job_types?: string[];
    tags?: string[];
    created_at?: number | string;
    description?: string;
  }>;
}

interface AdzunaResponse {
  results?: Array<{
    id?: string | number;
    title?: string;
    company?: { display_name?: string };
    location?: { display_name?: string };
    redirect_url?: string;
    description?: string;
    created?: string;
    contract_time?: string;
    contract_type?: string;
    salary_min?: number;
    salary_max?: number;
  }>;
}

const cache = new Map<string, CacheEntry<unknown>>();
const providerCallTimes = new Map<JobProviderName, number[]>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_PROVIDER_CALLS_PER_DAY: Record<JobProviderName, number> = {
  remotive: 4,
  arbeitnow: 8,
  adzuna: 8,
};

const textFromHtml = (value = '') => value
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<\/(?:p|div|li|br|h[1-6])\s*>/gi, '\n')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;|&#34;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
  .replace(/&[a-z][a-z0-9]+;/gi, ' ')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s+/g, '\n')
  .trim()
  .slice(0, 30000);

const validHttpUrl = (value: string | undefined): string => {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
};

const normalizedDate = (value: string | number | undefined): Date | undefined => {
  if (value === undefined || value === '') return undefined;
  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const inferWorkplace = (remote: boolean | undefined, text: string): ProviderJob['workplace'] => {
  if (remote === true || /\b(remote|work from home|work-from-home|fully distributed)\b/i.test(text)) return 'remote';
  if (/\bhybrid\b/i.test(text)) return 'hybrid';
  if (remote === false) return 'on-site';
  return '';
};

const inferExperienceLevel = (title: string, description: string): string => {
  const text = `${title}\n${description.slice(0, 5000)}`;
  if (/\b(intern(ship)?|graduate|entry[- ]level|junior|early career|new grad)\b/i.test(text)) return 'Entry / internship';
  if (/\b(senior|sr\.?|staff|principal|lead|director|head of)\b/i.test(title)) return 'Senior / lead';
  if (/\b(mid[- ]level|intermediate)\b/i.test(title)) return 'Mid-level';
  return '';
};

const getCached = <T>(key: string): T | undefined => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

const setCached = <T>(key: string, value: T) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const requestJson = async <T>(url: URL): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'CareerForgeAI/1.0 (job discovery)' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  return await response.json() as T;
};

const providerCallAllowed = (provider: JobProviderName): boolean => {
  const recent = (providerCallTimes.get(provider) || []).filter((time) => time > Date.now() - 24 * 60 * 60 * 1000);
  providerCallTimes.set(provider, recent);
  if (recent.length >= MAX_PROVIDER_CALLS_PER_DAY[provider]) return false;
  recent.push(Date.now());
  return true;
};

const normalizeRemotive = (payload: RemotiveResponse): ProviderJob[] => (payload.jobs || [])
  .flatMap((job) => {
    const url = validHttpUrl(job.url);
    if (!url || !job.id || !job.title || !job.company_name) return [];
    const description = textFromHtml(job.description);
    return [{
      providerId: String(job.id),
      source: 'remotive' as const,
      title: job.title.slice(0, 150),
      company: job.company_name.slice(0, 150),
      description,
      url,
      location: job.candidate_required_location || 'Remote',
      remote: true,
      workplace: 'remote',
      employmentType: job.job_type || '',
      experienceLevel: inferExperienceLevel(job.title, description),
      salary: job.salary || '',
      tags: Array.isArray(job.tags) ? job.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 30) : [],
      postedAt: normalizedDate(job.publication_date),
    }];
  });

const normalizeArbeitnow = (payload: ArbeitnowResponse): ProviderJob[] => (payload.data || [])
  .flatMap((job) => {
    const url = validHttpUrl(job.url);
    const providerId = job.slug || url;
    if (!url || !providerId || !job.title || !job.company_name) return [];
    const description = textFromHtml(job.description);
    return [{
      providerId: providerId.slice(0, 200),
      source: 'arbeitnow' as const,
      title: job.title.slice(0, 150),
      company: job.company_name.slice(0, 150),
      description,
      url,
      location: job.location || (job.remote ? 'Remote' : ''),
      remote: Boolean(job.remote),
      workplace: inferWorkplace(job.remote, `${job.title}\n${description}`),
      employmentType: Array.isArray(job.job_types) ? job.job_types.join(', ').slice(0, 100) : '',
      experienceLevel: inferExperienceLevel(job.title, description),
      salary: '',
      tags: Array.isArray(job.tags) ? job.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 30) : [],
      postedAt: normalizedDate(job.created_at),
    }];
  });

const normalizeAdzuna = (payload: AdzunaResponse): ProviderJob[] => (payload.results || [])
  .flatMap((job) => {
    const url = validHttpUrl(job.redirect_url);
    if (!url || job.id === undefined || !job.title) return [];
    const salary = job.salary_min || job.salary_max
      ? [job.salary_min, job.salary_max].filter((amount): amount is number => typeof amount === 'number')
        .map((amount) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(amount))
        .join(' - ')
      : '';
    const description = textFromHtml(job.description);
    const workFromHome = /\b(remote|work from home|hybrid)\b/i.test(description);
    return [{
      providerId: String(job.id),
      source: 'adzuna' as const,
      title: job.title.slice(0, 150),
      company: job.company?.display_name?.slice(0, 150) || 'Company not listed',
      description,
      url,
      location: job.location?.display_name || '',
      remote: workFromHome,
      workplace: inferWorkplace(undefined, `${job.title}\n${description}`),
      employmentType: [job.contract_time, job.contract_type].filter(Boolean).join(', '),
      experienceLevel: inferExperienceLevel(job.title, description),
      salary,
      tags: [],
      postedAt: normalizedDate(job.created),
    }];
  });

const searchTermsFor = (fields: ResumeFields, role?: string): string => {
  const skills = (fields.skills || '').split(/[,\n;|]/).map((value) => value.trim()).filter(Boolean);
  const terms = [role, fields.headline, fields.targetRole, ...skills.slice(0, 4)]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 1);
  return [...new Set(terms.map((value) => value.trim()))].join(' ').slice(0, 120) || 'professional';
};

const withStatus = (
  id: JobProviderName,
  name: string,
  jobs: ProviderJob[],
  message: string
): ProviderResult => ({
  status: { id, name, status: 'available', message, resultCount: jobs.length },
  jobs,
});

const fetchRemotive = async (search: string): Promise<ProviderResult> => {
  const key = `remotive:${search.toLowerCase()}`;
  const cached = getCached<ProviderJob[]>(key);
  if (cached) return withStatus('remotive', 'Remotive', cached, 'Remote listings from Remotive; source attribution and direct links are retained.');
  if (!providerCallAllowed('remotive')) {
    return { status: { id: 'remotive', name: 'Remotive', status: 'rate-limited', message: 'Remotive recommends no more than four API requests per day. Cached results remain available; try again after the provider refresh window.', resultCount: 0 }, jobs: [] };
  }
  const url = new URL('https://remotive.com/api/remote-jobs');
  url.searchParams.set('search', search);
  url.searchParams.set('limit', '50');
  const payload = await requestJson<RemotiveResponse>(url);
  const jobs = normalizeRemotive(payload);
  setCached(key, jobs);
  return withStatus('remotive', 'Remotive', jobs, 'Remote listings from Remotive; source attribution and direct links are retained.');
};

const fetchArbeitnow = async (): Promise<ProviderResult> => {
  const key = 'arbeitnow:page1';
  const cached = getCached<ProviderJob[]>(key);
  if (cached) return withStatus('arbeitnow', 'Arbeitnow', cached, 'Listings supplied by Arbeitnow from employer ATS feeds, primarily in Europe; source links are retained.');
  if (!providerCallAllowed('arbeitnow')) {
    return { status: { id: 'arbeitnow', name: 'Arbeitnow', status: 'rate-limited', message: 'The provider refresh limit was reached; previously stored listings remain available.', resultCount: 0 }, jobs: [] };
  }
  const url = new URL('https://www.arbeitnow.com/api/job-board-api');
  url.searchParams.set('page', '1');
  const payload = await requestJson<ArbeitnowResponse>(url);
  const jobs = normalizeArbeitnow(payload);
  setCached(key, jobs);
  return withStatus('arbeitnow', 'Arbeitnow', jobs, 'Listings supplied by Arbeitnow from employer ATS feeds, primarily in Europe; source links are retained.');
};

const fetchAdzuna = async (
  search: string,
  location?: string,
  market: 'india' | 'international' | 'remote' = 'india'
): Promise<ProviderResult> => {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();
  const country = (market === 'india' ? 'in' : process.env.ADZUNA_COUNTRY || 'gb').trim().toLowerCase();
  if (!appId || !appKey) {
    return { status: { id: 'adzuna', name: 'Adzuna', status: 'unavailable', message: 'Configure ADZUNA_APP_ID and ADZUNA_APP_KEY to enable the official Adzuna API.', resultCount: 0 }, jobs: [] };
  }
  if (!/^[a-z]{2}$/.test(country)) {
    return { status: { id: 'adzuna', name: 'Adzuna', status: 'error', message: 'ADZUNA_COUNTRY must be a two-letter country code supported by Adzuna.', resultCount: 0 }, jobs: [] };
  }
  const key = `adzuna:${country}:${search.toLowerCase()}:${location?.toLowerCase() || ''}`;
  const cached = getCached<ProviderJob[]>(key);
  if (cached) return withStatus('adzuna', 'Adzuna', cached, `Official Adzuna job API results for ${country.toUpperCase()}.`);
  if (!providerCallAllowed('adzuna')) {
    return { status: { id: 'adzuna', name: 'Adzuna', status: 'rate-limited', message: 'The Adzuna API request limit was reached. Previously stored listings remain available.', resultCount: 0 }, jobs: [] };
  }
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '50');
  url.searchParams.set('what', search);
  url.searchParams.set('content-type', 'application/json');
  if (location?.trim()) url.searchParams.set('where', location.trim().slice(0, 100));
  const payload = await requestJson<AdzunaResponse>(url);
  const jobs = normalizeAdzuna(payload);
  setCached(key, jobs);
  return withStatus('adzuna', 'Adzuna', jobs, `Official Adzuna job API results for ${country.toUpperCase()}.`);
};

export const buildJobSearchLinks = (fields: ResumeFields, role?: string, location?: string): JobSearchLink[] => {
  const query = searchTermsFor(fields, role);
  const locatedQuery = [query, location?.trim()].filter(Boolean).join(' ');
  const encoded = encodeURIComponent(locatedQuery);
  const sources: Array<Pick<JobSearchLink, 'id' | 'name' | 'url'>> = [
    { id: 'adzuna-search', name: 'Adzuna Search', url: `https://www.adzuna.com/search?q=${encoded}` },
    { id: 'linkedin', name: 'LinkedIn Jobs', url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}` },
    { id: 'naukri', name: 'Naukri', url: `https://www.naukri.com/jobs-in-india?keyword=${encoded}` },
    { id: 'indeed', name: 'Indeed', url: `https://www.indeed.com/jobs?q=${encoded}` },
    { id: 'internshala', name: 'Internshala', url: `https://internshala.com/internships/keywords-${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}/` },
    { id: 'wellfound', name: 'Wellfound', url: `https://wellfound.com/jobs?query=${encoded}` },
    { id: 'company-careers', name: 'Company career pages', url: `https://www.google.com/search?q=${encodeURIComponent(`${locatedQuery} company careers jobs`)}` },
  ];
  return sources.map((source) => ({
    ...source,
    status: 'search-link',
    message: 'No supported public API or authorized feed is configured here. This link opens the source search; listings are not imported or represented as verified results.',
  }));
};

export const discoverProviderJobs = async (
  fields: ResumeFields,
  filters: { role?: string; location?: string; market?: 'india' | 'international' | 'remote' } = {}
): Promise<{ providers: ProviderStatus[]; jobs: ProviderJob[]; searchLinks: JobSearchLink[] }> => {
  const search = searchTermsFor(fields, filters.role);
  const providerTasks: Array<Promise<ProviderResult>> = [
    fetchRemotive(search),
    fetchArbeitnow(),
    fetchAdzuna(search, filters.location, filters.market),
  ];
  const outcomes = await Promise.all(providerTasks.map(async (task, index): Promise<ProviderResult> => {
    const names: Array<{ id: JobProviderName; name: string }> = [
      { id: 'remotive', name: 'Remotive' },
      { id: 'arbeitnow', name: 'Arbeitnow' },
      { id: 'adzuna', name: 'Adzuna' },
    ];
    try {
      return await task;
    } catch (error) {
      const provider = names[index];
      return {
        status: {
          ...provider,
          status: 'error',
          message: error instanceof Error ? error.message : 'The provider could not be reached.',
          resultCount: 0,
        },
        jobs: [],
      };
    }
  }));
  const uniqueJobs = new Map<string, ProviderJob>();
  const seenListings = new Set<string>();
  for (const job of outcomes.flatMap((outcome) => outcome.jobs)) {
    const canonicalUrl = new URL(job.url);
    canonicalUrl.search = '';
    canonicalUrl.hash = '';
    const urlKey = `url:${canonicalUrl.toString().replace(/\/$/, '')}`;
    const identity = job.location
      ? `listing:${job.title.trim().toLowerCase()}|${job.company.trim().toLowerCase()}|${job.location.trim().toLowerCase()}`
      : urlKey;
    if (seenListings.has(urlKey) || seenListings.has(identity)) continue;
    seenListings.add(urlKey);
    seenListings.add(identity);
    uniqueJobs.set(identity, job);
  }
  const jobs = [...uniqueJobs.values()].filter((job) => {
    if (filters.market === 'remote') return job.workplace === 'remote';
    if (filters.market === 'india') {
      return job.source === 'remotive' || /\b(india|mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|pune|kolkata)\b/i.test(job.location);
    }
    return true;
  });
  return {
    providers: outcomes.map((outcome) => outcome.status),
    jobs,
    searchLinks: buildJobSearchLinks(fields, filters.role, filters.location),
  };
};
