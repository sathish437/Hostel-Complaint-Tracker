import { Complaint, SystemSettings, User, AuditLog, NotificationItem } from '../types';

const API_BASE_URL = ((import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || 'http://localhost:8080/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  public removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.removeToken();
        // Custom event for unauthorized redirect
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Authentication expired. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to perform this action (403 Forbidden).');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return {} as T;
    } catch (error: any) {
      // Re-throw with clear message
      throw error;
    }
  }

  // --- Auth Endpoints ---
  public auth = {
    login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
      return this.request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    getCurrentUser: async (): Promise<User> => {
      return this.request<User>('/auth/me');
    },

    logout: async (): Promise<void> => {
      this.removeToken();
    },
  };

  // --- Complaints Endpoints ---
  public complaints = {
    getAll: async (params?: Record<string, string>): Promise<Complaint[]> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request<Complaint[]>(`/complaints${query}`);
    },

    getById: async (id: string): Promise<Complaint> => {
      return this.request<Complaint>(`/complaints/${id}`);
    },

    create: async (data: {
      category: string;
      title: string;
      description: string;
      roomNumber: string;
      block: string;
      evidenceUrl?: string;
    }): Promise<Complaint> => {
      return this.request<Complaint>('/complaints', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateAction: async (
      id: string,
      action: 'ACCEPT' | 'START_WORK' | 'MARK_RESOLUTION_PENDING',
      notes?: string,
      proofUrl?: string
    ): Promise<Complaint> => {
      return this.request<Complaint>(`/complaints/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, notes, proofUrl }),
      });
    },

    confirmResolution: async (id: string): Promise<Complaint> => {
      return this.request<Complaint>(`/complaints/${id}/confirm`, {
        method: 'POST',
      });
    },

    reopen: async (id: string, reason: string): Promise<Complaint> => {
      return this.request<Complaint>(`/complaints/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    assign: async (id: string, staffId: string, reason?: string): Promise<Complaint> => {
      return this.request<Complaint>(`/complaints/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ staffId, reason }),
      });
    },
  };

  // --- Settings Endpoints ---
  public settings = {
    get: async (): Promise<SystemSettings> => {
      return this.request<SystemSettings>('/settings');
    },

    toggleAutomation: async (enabled: boolean): Promise<SystemSettings> => {
      return this.request<SystemSettings>('/settings/automation', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
    },
  };

  // --- Notifications Endpoints ---
  public notifications = {
    getAll: async (): Promise<NotificationItem[]> => {
      return this.request<NotificationItem[]>('/notifications');
    },

    markRead: async (id: string): Promise<void> => {
      return this.request<void>(`/notifications/${id}/read`, {
        method: 'POST',
      });
    },

    markAllRead: async (): Promise<void> => {
      return this.request<void>('/notifications/read-all', {
        method: 'POST',
      });
    },
  };

  // --- Audit Logs Endpoints ---
  public audit = {
    getAll: async (): Promise<AuditLog[]> => {
      return this.request<AuditLog[]>('/audit-logs');
    },
  };
}

export const api = new ApiClient();
