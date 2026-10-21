import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type {
  AmendLeadActivity,
  AssignFieldAgent,
  BulkAssignLeads,
  BulkStatusUpdate,
  CreateCallLog,
  CreateFollowUp,
  CreateLead,
  CreateLeadActivity,
  EligibleAgentsResponse,
  FollowUp,
  Lead,
  LeadActivity,
  LeadFilter,
  PaginatedResponse,
  Profile,
  UpdateLead,
} from '@solar-crm/shared';

export interface LeadWithRelations extends Lead {
  inbound_sales?: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null;
  assigned_field_agent?: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null;
  assigned_profile?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
  lead_activities?: Array<LeadActivity & { author?: Pick<Profile, 'id' | 'full_name' | 'role'> }>;
  follow_ups?: Array<FollowUp & { assignee?: Pick<Profile, 'id' | 'full_name'> }>;
  site_visits?: Array<any>;
  quotations?: Array<any>;
  mapUrl?: string | null;
  is_overdue?: boolean;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  matches: Array<
    Pick<Lead, 'id' | 'customer_name' | 'phone' | 'email' | 'status' | 'temperature' | 'created_at'> & {
      inbound_sales?: Pick<Profile, 'id' | 'full_name'> | null;
    }
  >;
}

export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (filters: Partial<LeadFilter>) => [...leadsKeys.lists(), filters] as const,
  detail: (id: string) => [...leadsKeys.all, 'detail', id] as const,
  team: () => ['team-members'] as const,
};

// ─── 1. Fetch Leads List ──────────────────────────────────────────────────────
export function useLeads(filters: Partial<LeadFilter> = {}) {
  return useQuery({
    queryKey: leadsKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: true;
        data: PaginatedResponse<LeadWithRelations>;
      }>('/leads', { params: filters });
      return data.data;
    },
  });
}

// ─── 2. Fetch Lead Detail ─────────────────────────────────────────────────────
export function useLead(id: string) {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: true; data: LeadWithRelations }>(
        `/leads/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

// ─── 3. Fetch Team Members (Sales Reps & Field Agents) ────────────────────────
export function useTeamMembers() {
  return useQuery({
    queryKey: leadsKeys.team(),
    queryFn: async () => {
      const [salesRes, agentsRes] = await Promise.all([
        apiClient.get<{ success: true; data: { items: Profile[] } }>('/users', {
          params: { role: 'inbound_sales', pageSize: 100 },
        }),
        apiClient.get<{ success: true; data: { items: Profile[] } }>('/users', {
          params: { role: 'field_agent', pageSize: 100 },
        }),
      ]);
      return {
        inboundSales: salesRes.data.data.items ?? [],
        fieldAgents: agentsRes.data.data.items ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── 4. Check Duplicate Lead ──────────────────────────────────────────────────
export async function checkDuplicateLead(params: {
  phone?: string;
  email?: string;
  exclude_id?: string;
}) {
  const { data } = await apiClient.get<{ success: true; data: DuplicateCheckResult }>(
    '/leads/check-duplicate',
    { params },
  );
  return data.data;
}

// ─── 5. Create Lead Mutation ──────────────────────────────────────────────────
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLead) => {
      const { data } = await apiClient.post<{ success: true; data: Lead }>('/leads', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 6. Update Lead Mutation ──────────────────────────────────────────────────
export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateLead }) => {
      const { data } = await apiClient.patch<{ success: true; data: Lead }>(
        `/leads/${id}`,
        updates,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 7. Log Lead Activity Mutation ────────────────────────────────────────────
export function useLogLeadActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      activity,
    }: {
      leadId: string;
      activity: Omit<CreateLeadActivity, 'lead_id'>;
    }) => {
      const { data } = await apiClient.post<{ success: true; data: LeadActivity }>(
        `/leads/${leadId}/activities`,
        activity,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

// ─── 8. Schedule Follow-up Mutation ───────────────────────────────────────────
export function useScheduleFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      followUp,
    }: {
      leadId: string;
      followUp: Omit<CreateFollowUp, 'lead_id'>;
    }) => {
      const { data } = await apiClient.post<{ success: true; data: FollowUp }>(
        `/leads/${leadId}/follow-ups`,
        followUp,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 9. Bulk Assign Mutation ──────────────────────────────────────────────────
export function useBulkAssignLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkAssignLeads) => {
      const { data } = await apiClient.post<{ success: true; data: { updatedCount: number } }>(
        '/leads/bulk-assign',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 10. Bulk Status Update Mutation ──────────────────────────────────────────
export function useBulkStatusUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkStatusUpdate) => {
      const { data } = await apiClient.post<{ success: true; data: { updatedCount: number } }>(
        '/leads/bulk-status',
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 11. Trigger Leads CSV Export ─────────────────────────────────────────────
export async function exportLeadsToCsv(filters: Partial<LeadFilter> = {}) {
  const res = await apiClient.get('/leads/export', {
    params: filters,
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `leads-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── 12. Log Call with Optional Follow-up & Temp Mutation ─────────────────────
export function useLogCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      data,
    }: {
      leadId: string;
      data: Omit<CreateCallLog, 'lead_id'>;
    }) => {
      const res = await apiClient.post<{
        success: true;
        data: {
          activity: LeadActivity;
          followUp?: FollowUp | null;
        };
      }>(`/leads/${leadId}/call-logs`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── 13. Amend Historical Activity (Auditable Append-Only) ────────────────────
export function useAmendActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      activityId,
      data,
    }: {
      leadId: string;
      activityId: string;
      data: AmendLeadActivity;
    }) => {
      const res = await apiClient.post<{
        success: true;
        data: LeadActivity;
      }>(`/leads/${leadId}/activities/${activityId}/amend`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

// ─── 14. Fetch Ranked Eligible Field Agents for Lead ──────────────────────────
export function useEligibleAgents(leadId: string) {
  return useQuery({
    queryKey: [...leadsKeys.detail(leadId), 'eligible-agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: true;
        data: EligibleAgentsResponse;
      }>(`/leads/${leadId}/eligible-agents`);
      return data.data;
    },
    enabled: !!leadId,
  });
}

// ─── 15. Assign Field Agent to Lead ───────────────────────────────────────────
export function useAssignFieldAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      agentId,
      overrideReason,
    }: {
      leadId: string;
      agentId: string;
      overrideReason?: string | undefined;
    }) => {
      const res = await apiClient.post<{
        success: true;
        data: {
          lead: Lead;
          assignedAgent: Profile;
          previousAgent?: Profile | null;
        };
      }>(`/leads/${leadId}/assign-agent`, {
        agent_id: agentId,
        override_reason: overrideReason,
      });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

