import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type {
  CompleteFollowUp,
  CreateFollowUp,
  FollowUp,
  FollowUpFilter,
  PaginatedResponse,
  Profile,
  RescheduleFollowUp,
} from '@solar-crm/shared';

export interface FollowUpWithRelations extends FollowUp {
  lead?: {
    id: string;
    customer_name: string;
    phone: string;
    email?: string | null;
    status: string;
    temperature: string;
    area?: string | null;
    pincode?: string | null;
    address?: string | null;
  } | null;
  assignee?: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'> | null;
  creator?: Pick<Profile, 'id' | 'full_name'> | null;
  is_overdue?: boolean;
}

export interface FollowUpsResponseData {
  items: FollowUpWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: {
    overdue: number;
    dueToday: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
}

export const followUpKeys = {
  all: ['follow-ups'] as const,
  lists: () => [...followUpKeys.all, 'list'] as const,
  list: (filters: Partial<FollowUpFilter>) => [...followUpKeys.lists(), filters] as const,
};

// ─── 1. Query Follow-ups with Counts ──────────────────────────────────────────
export function useFollowUps(filters: Partial<FollowUpFilter> = {}) {
  return useQuery({
    queryKey: followUpKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: true;
        data: FollowUpsResponseData;
      }>('/follow-ups', { params: filters });
      return data.data;
    },
  });
}

// ─── 2. Create Follow-up ──────────────────────────────────────────────────────
export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateFollowUp) => {
      const { data } = await apiClient.post<{ success: true; data: FollowUp }>(
        '/follow-ups',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 3. Reschedule Follow-up ──────────────────────────────────────────────────
export function useRescheduleFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reschedule,
    }: {
      id: string;
      reschedule: RescheduleFollowUp;
    }) => {
      const { data } = await apiClient.post<{ success: true; data: FollowUp }>(
        `/follow-ups/${id}/reschedule`,
        reschedule,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 4. Complete Follow-up ────────────────────────────────────────────────────
export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: CompleteFollowUp;
    }) => {
      const { data } = await apiClient.post<{ success: true; data: FollowUp }>(
        `/follow-ups/${id}/complete`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 5. Cancel Follow-up ──────────────────────────────────────────────────────
export function useCancelFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ success: true; data: FollowUp }>(
        `/follow-ups/${id}/cancel`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
