export interface User {
  id: string;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  skills: string[];
  targetRole?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface DashboardStats {
  totalResumes: number;
  publishedPortfolios: number;
  generatedCoverLetters: number;
  trackedApplications: number;
  interviewRate: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
}

export interface QuickActionItem {
  title: string;
  icon: string;
  path: string;
}

export interface DashboardSummary {
  user: {
    id: string;
    name: string;
    headline?: string;
    targetRole?: string;
    skillsCount: number;
  };
  stats: DashboardStats;
  recentActivities: ActivityItem[];
  quickActions: QuickActionItem[];
}
