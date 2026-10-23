import type { UserRole } from '@/utils/roles';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Request failed',
          errors: data.errors,
          error: data.error,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async register(data: { name: string; email: string; password: string; password_confirmation: string }) {
    return this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string; remember?: boolean }) {
    return this.request<{ user: User; token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    const response = await this.request<null>('/auth/logout', {
      method: 'POST',
    });
    if (response.success) {
      this.setToken(null);
    }
    return response;
  }

  async getMe() {
    return this.request<{ id: number; name: string; email: string; role: UserRole; role_label: string; is_active: boolean; email_verified_at: string | null; created_at: string }>('/auth/me');
  }

  async getProjects() {
    return this.request<{ projects: Project[] }>('/projects');
  }

  async getUsers() {
    return this.request<{ users: AdminUser[] }>('/admin/users');
  }

  async activateUser(id: number) {
    return this.request<{ user: AdminUser }>(`/admin/users/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async deactivateUser(id: number) {
    return this.request<{ user: AdminUser }>(`/admin/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  }
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  is_active: boolean;
  created_at: string | null;
}

export interface ProjectTaskCounts {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
}

export interface ProjectHealth {
  status: 'not_started' | 'completed' | 'off_track' | 'at_risk' | 'on_track' | 'in_progress';
  label: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  project_manager: { id: number; name: string; email: string } | null;
  task_counts: ProjectTaskCounts;
  progress: number;
  health: ProjectHealth;
}

export const api = new ApiService();