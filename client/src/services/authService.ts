import { api } from './api';
import type { AuthResponse, DashboardSummary, User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string; targetRole?: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('careerforge_token', response.data.token);
    }
    return response.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('careerforge_token', response.data.token);
    }
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me');
    return response.data.user;
  },

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; user: User }>('/user/profile', profileData);
    return response.data.user;
  },

  async getDashboard(): Promise<DashboardSummary> {
    const response = await api.get<{ success: boolean; data: DashboardSummary }>('/user/dashboard');
    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('careerforge_token');
  },
};
