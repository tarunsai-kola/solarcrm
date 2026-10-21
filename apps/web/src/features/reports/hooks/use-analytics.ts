import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AnalyticsFilter,
  CompanyWideAnalytics,
  CrmConfig,
  ExportReportQuery,
  FieldAgentUserAnalytics,
  InboundSalesUserAnalytics,
  UpdateCrmConfig,
} from '@solar-crm/shared';

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

// ─── 1. Company-Wide Analytics Hook ──────────────────────────────────────────
export function useCompanyAnalytics(filter?: AnalyticsFilter | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<CompanyWideAnalytics>({
    queryKey: ['analytics', 'company', filter],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            sp.set(k, String(v));
          }
        });
      }
      const json = await authFetch(`${API_BASE}/analytics/company?${sp.toString()}`, token);
      return json.data;
    },
    enabled: !!token,
  });
}

// ─── 2. Inbound Sales Performance Hook ───────────────────────────────────────
export function useSalesPerformance(filter?: AnalyticsFilter | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<InboundSalesUserAnalytics[]>({
    queryKey: ['analytics', 'sales-performance', filter],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            sp.set(k, String(v));
          }
        });
      }
      const json = await authFetch(`${API_BASE}/analytics/sales-performance?${sp.toString()}`, token);
      return json.data;
    },
    enabled: !!token,
  });
}

// ─── 3. Field Agent Performance Hook ─────────────────────────────────────────
export function useAgentPerformance(filter?: AnalyticsFilter | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<FieldAgentUserAnalytics[]>({
    queryKey: ['analytics', 'agent-performance', filter],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            sp.set(k, String(v));
          }
        });
      }
      const json = await authFetch(`${API_BASE}/analytics/agent-performance?${sp.toString()}`, token);
      return json.data;
    },
    enabled: !!token,
  });
}

// ─── 4. Report CSV Exporter ──────────────────────────────────────────────────
export function useExportReport() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (params: ExportReportQuery) => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          sp.set(k, String(v));
        }
      });

      const res = await fetch(`${API_BASE}/analytics/export?${sp.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let err = 'Export failed';
        try {
          const json = await res.json();
          err = json.error?.message || json.message || err;
        } catch {
          // ignore
        }
        throw new Error(err);
      }

      // Download file in browser
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `${params.type}-report-${Date.now()}.csv`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1]?.replace(/"/g, '') || filename;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { filename, success: true };
    },
  });
}

// ─── 5. CRM Controls Hook ────────────────────────────────────────────────────
export function useCrmConfig() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<CrmConfig>({
    queryKey: ['crm-config'],
    queryFn: async () => {
      const json = await authFetch(`${API_BASE}/crm-config`, token);
      return json.data;
    },
    enabled: !!token,
  });
}

export function useUpdateCrmConfig() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateCrmConfig) => {
      const json = await authFetch(`${API_BASE}/crm-config`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-config'] });
    },
  });
}

export function useResetCrmConfig() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async () => {
      const json = await authFetch(`${API_BASE}/crm-config/reset`, token, {
        method: 'POST',
      });
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-config'] });
    },
  });
}
