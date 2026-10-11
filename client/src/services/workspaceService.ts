import { api } from './api';

export type WorkspaceKind = 'resume' | 'portfolio' | 'coverLetter' | 'application';
export interface WorkspaceItem {
  _id: string;
  kind: WorkspaceKind;
  title: string;
  data: Record<string, unknown>;
  isPublished: boolean;
  slug: string;
  updatedAt: string;
}

export interface ResumeSource {
  _id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  pageCount?: number;
  extractedFields: Record<string, string>;
  createdAt: string;
}

export interface ResumeSuggestion {
  id: string;
  field: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  category: string;
}

export interface ResumeAnalysis {
  score: number;
  wordCount: number;
  components: Array<{ name: string; score: number; maxScore: number; detail: string }>;
  issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string }>;
  jobMatch?: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    analyzedKeywordCount: number;
  };
}

export interface JobPosting {
  _id: string;
  title: string;
  company: string;
  description: string;
  source: 'user-provided' | 'remotive' | 'arbeitnow' | 'adzuna';
  providerId?: string;
  url?: string;
  location?: string;
  remote?: boolean;
  workplace?: 'remote' | 'hybrid' | 'on-site' | '';
  employmentType?: string;
  experienceLevel?: string;
  salary?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  tags?: string[];
  postedAt?: string;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobProviderStatus {
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

export interface JobMatchResult {
  resumeId: string;
  resumeTitle: string;
  resumeUpdatedAt: string;
  jobId: string;
  jobTitle: string;
  company: string;
  source: JobPosting['source'];
  jobUpdatedAt: string;
  matchScore: number;
  readinessScore: number;
  scoreDetails: Array<{ name: string; score: number; maxScore: number; detail: string }>;
  requirements: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchingEvidence: Array<{ skill: string; evidence: string }>;
  strengths: string[];
  gaps: string[];
  recommendedActions: string[];
  skillsToLearn: string[];
  educationRequirement: string;
  educationStatus: 'not-required' | 'met' | 'not-found' | 'review';
  requiredExperienceYears: number | null;
  candidateExperienceYears: number | null;
  jobKeywords: string[];
  matchedJobKeywords: string[];
  missingJobKeywords: string[];
  resumeQualityScore: number;
  requirementsDetected: boolean;
}

export interface DiscoveredJob extends JobPosting, JobMatchResult {
  _id: string;
  description: string;
  source: Exclude<JobPosting['source'], 'user-provided'>;
  isStale: boolean;
  url: string;
  location: string;
  postedAt?: string;
}

export const workspaceService = {
  async list(kind: WorkspaceKind): Promise<WorkspaceItem[]> {
    const { data } = await api.get<{ items: WorkspaceItem[] }>(`/workspace/${kind}`);
    return data.items;
  },
  async create(kind: WorkspaceKind, title: string, values: Record<string, unknown>): Promise<WorkspaceItem> {
    const sourceId = kind === 'resume' && typeof values.sourceId === 'string' ? values.sourceId : '';
    const endpoint = sourceId ? `/workspace/resume/sources/${encodeURIComponent(sourceId)}/versions` : `/workspace/${kind}`;
    const { data } = await api.post<{ item: WorkspaceItem }>(endpoint, { title, data: values });
    return data.item;
  },
  async update(kind: WorkspaceKind, id: string, title: string, values: Record<string, unknown>): Promise<WorkspaceItem> {
    const { data } = await api.put<{ item: WorkspaceItem }>(`/workspace/${kind}/${id}`, { title, data: values });
    return data.item;
  },
  async remove(kind: WorkspaceKind, id: string): Promise<void> {
    await api.delete(`/workspace/${kind}/${id}`);
  },
  async getSelectedResume(): Promise<{ resumeId: string; resume: WorkspaceItem | null }> {
    const { data } = await api.get<{ resumeId: string; resume: WorkspaceItem | null }>('/workspace/resume-selection');
    return data;
  },
  async selectResume(resumeId: string): Promise<{ resumeId: string; resume: WorkspaceItem }> {
    const { data } = await api.put<{ resumeId: string; resume: WorkspaceItem }>('/workspace/resume-selection', { resumeId });
    return data;
  },
  async listJobs(): Promise<JobPosting[]> {
    const { data } = await api.get<{ jobs: JobPosting[] }>('/workspace/jobs');
    return data.jobs;
  },
  async discoverJobs(
    resumeId: string,
    filters: { role?: string; location?: string } = {}
  ): Promise<{ resumeId: string; resumeTitle: string; providers: JobProviderStatus[]; searchLinks: JobSearchLink[]; jobs: DiscoveredJob[]; refreshedAt: string }> {
    const { data } = await api.post<{
      resumeId: string;
      resumeTitle: string;
      providers: JobProviderStatus[];
      searchLinks: JobSearchLink[];
      jobs: DiscoveredJob[];
      refreshedAt: string;
    }>('/workspace/jobs/discover', { resumeId, ...filters });
    return data;
  },
  async saveDiscoveredJob(id: string, isSaved: boolean): Promise<void> {
    await api.put(`/workspace/jobs/${encodeURIComponent(id)}/save`, { isSaved });
  },
  async trackDiscoveredJob(id: string): Promise<void> {
    await api.post(`/workspace/jobs/${encodeURIComponent(id)}/track`);
  },
  async saveJob(values: Pick<JobPosting, 'title' | 'company' | 'description'>, id?: string): Promise<JobPosting> {
    const { data } = id
      ? await api.put<{ job: JobPosting }>(`/workspace/jobs/${encodeURIComponent(id)}`, values)
      : await api.post<{ job: JobPosting }>('/workspace/jobs', values);
    return data.job;
  },
  async removeJob(id: string): Promise<void> {
    await api.delete(`/workspace/jobs/${encodeURIComponent(id)}`);
  },
  async matchJob(jobId: string, resumeId: string): Promise<JobMatchResult> {
    const { data } = await api.post<{ result: JobMatchResult }>(
      `/workspace/jobs/${encodeURIComponent(jobId)}/match`,
      { resumeId }
    );
    return data.result;
  },
  async uploadResume(file: File): Promise<{ source: ResumeSource; analysis: ResumeAnalysis }> {
    const formData = new FormData();
    formData.append('resume', file);
    const { data } = await api.post<{ source: ResumeSource; analysis: ResumeAnalysis }>(
      '/workspace/resume/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
  async listResumeSources(): Promise<ResumeSource[]> {
    const { data } = await api.get<{ sources: ResumeSource[] }>('/workspace/resume/sources');
    return data.sources;
  },
  async getResumeSource(id: string): Promise<ResumeSource> {
    const { data } = await api.get<{ source: ResumeSource }>(`/workspace/resume/sources/${encodeURIComponent(id)}`);
    return data.source;
  },
  async downloadOriginalResume(source: ResumeSource): Promise<void> {
    const { data } = await api.get<Blob>(`/workspace/resume/sources/${encodeURIComponent(source._id)}/file`, {
      responseType: 'blob',
    });
    const href = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = source.filename;
    anchor.click();
    URL.revokeObjectURL(href);
  },
};
