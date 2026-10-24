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
    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
    return this.request<User>('/auth/me');
  }

  async getSettings() {
    return this.request<{ user: User; preferences: NotificationPreferences }>('/settings');
  }

  async updateNotificationPreferences(data: NotificationPreferences) {
    return this.request<{ preferences: NotificationPreferences }>('/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data: ProfilePayload) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('name', data.name);

    if (data.currentPassword) {
      formData.append('current_password', data.currentPassword);
    }

    if (data.password) {
      formData.append('password', data.password);
    }

    if (data.passwordConfirmation) {
      formData.append('password_confirmation', data.passwordConfirmation);
    }

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    if (data.removeAvatar) {
      formData.append('remove_avatar', '1');
    }

    return this.request<{ user: User }>('/profile', {
      method: 'POST',
      body: formData,
    });
  }

  async getProjects() {
    return this.request<{ projects: Project[] }>('/projects');
  }

  async getProject(id: number) {
    return this.request<{ project: Project }>(`/projects/${id}`);
  }

  async updateProject(id: number, data: ProjectPayload) {
    return this.request<{ project: Project }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getTasks(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ tasks: Task[]; stats: TaskStats }>(`/tasks${query}`);
  }

  async getTaskAssignees() {
    return this.request<{ assignees: TaskUser[] }>('/tasks/assignees');
  }

  async createTask(data: TaskPayload) {
    return this.request<{ task: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: TaskPayload) {
    return this.request<{ task: Task }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: number, status: TaskStatus) {
    return this.request<{ task: Task }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async checkTaskByQa(id: number) {
    return this.request<{ task: Task }>(`/tasks/${id}/qa-check`, {
      method: 'PATCH',
    });
  }

  async reviewTask(id: number, data: TaskReviewPayload) {
    return this.request<{ task: Task }>(`/tasks/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: number) {
    return this.request<null>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ users: AdminUser[]; stats: UserStats }>(`/admin/users${query}`);
  }

  async getUser(id: number) {
    return this.request<{ user: AdminUser }>(`/admin/users/${id}`);
  }

  async createUser(data: UserPayload) {
    return this.request<{ user: AdminUser }>('/admin/users', {
      method: 'POST',
      body: this.userFormData(data),
    });
  }

  async updateUser(id: number, data: UserPayload) {
    const formData = this.userFormData(data);
    formData.append('_method', 'PATCH');

    return this.request<{ user: AdminUser }>(`/admin/users/${id}`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteUser(id: number) {
    return this.request<null>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  private userFormData(data: UserPayload): FormData {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('role', data.role);

    if (data.password) {
      formData.append('password', data.password);
    }

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    if (data.removeAvatar) {
      formData.append('remove_avatar', '1');
    }

    return formData;
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
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
}

export interface ProfilePayload {
  name: string;
  currentPassword?: string;
  password?: string;
  passwordConfirmation?: string;
  avatar?: File | null;
  removeAvatar?: boolean;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  task_updates: boolean;
  qa_updates: boolean;
  approval_updates: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  is_active: boolean;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string | null;
}

export interface UserStats {
  project_manager: number;
  qa: number;
  member: number;
  client: number;
}

export interface UserPayload {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: File | null;
  removeAvatar?: boolean;
}

export interface ProjectTaskCounts {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
}

export interface ProjectTeamCounts {
  total: number;
  qa: number;
  member: number;
  client: number;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type ProjectDeadlineStatus = 'completed' | 'indefinite' | 'overdue' | 'due_soon' | 'on_schedule';

export interface ProjectHealth {
  status: 'not_started' | 'completed' | 'off_track' | 'at_risk' | 'on_track' | 'in_progress';
  label: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  budget: number | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  is_indefinite: boolean;
  duration_days: number | null;
  days_remaining: number | null;
  deadline_status: ProjectDeadlineStatus;
  project_manager: { id: number; name: string; email: string } | null;
  team_counts: ProjectTeamCounts;
  task_counts: ProjectTaskCounts;
  progress: number;
  overdue_rate: number;
  health: ProjectHealth;
}

export interface ProjectPayload {
  name: string;
  description: string | null;
  status: ProjectStatus;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  is_indefinite: boolean;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskQaStatus = 'pending' | 'checked';

export type TaskApprovalStatus = 'pending' | 'approved' | 'revision';

export interface TaskUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  avatar_url: string | null;
}

export interface Task {
  id: number;
  project_id: number;
  project: { id: number; name: string } | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  assigned_to: TaskUser | null;
  qa_status: TaskQaStatus;
  qa_checked_at: string | null;
  qa_checked_by: TaskUser | null;
  approval_status: TaskApprovalStatus;
  approved_at: string | null;
  approved_by: TaskUser | null;
  revision_notes: string | null;
  created_at: string | null;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  qa_checked: number;
  approved: number;
  revision: number;
}

export interface TaskPayload {
  title: string;
  description: string | null;
  status?: TaskStatus;
  assigned_to_id: number;
  due_date: string | null;
}

export interface TaskReviewPayload {
  approval_status: 'approved' | 'revision';
  revision_notes?: string | null;
}

export const api = new ApiService();