import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@solar-crm/shared';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/api/v1';

async function authFetch(url: string, token?: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const json = await res.json();
      errMessage = json.error?.message || json.message || errMessage;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export interface UseNotificationsParams {
  is_read?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export function useNotifications(params?: UseNotificationsParams | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.is_read !== undefined) sp.set('is_read', String(params.is_read));
      if (params?.page) sp.set('page', String(params.page));
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize));

      const queryStr = sp.toString() ? `?${sp.toString()}` : '';
      const json = await authFetch(`${API_BASE}/notifications${queryStr}`, token);
      return json.data as {
        items: Notification[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
    enabled: Boolean(token),
  });
}

export function useUnreadNotificationsCount() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const json = await authFetch(`${API_BASE}/notifications/unread-count`, token);
      return (json.data?.unread_count ?? 0) as number;
    },
    enabled: Boolean(token),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const json = await authFetch(`${API_BASE}/notifications/${notificationId}/read`, token, {
        method: 'PATCH',
      });
      return json.data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async () => {
      const json = await authFetch(`${API_BASE}/notifications/read-all`, token, {
        method: 'PATCH',
      });
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const json = await authFetch(`${API_BASE}/notifications/${notificationId}`, token, {
        method: 'DELETE',
      });
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
