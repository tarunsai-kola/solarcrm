import { useQuery } from '@tanstack/react-query';
import type { AuditLog } from '@solar-crm/shared';

import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/api/v1';

export interface AuditLogItem extends AuditLog {
  actor?: {
    id: string;
    full_name: string;
    role?: string | undefined;
    email?: string | undefined;
  } | undefined;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useAuditLogs(params?: {
  page?: number | undefined;
  pageSize?: number | undefined;
  actor_id?: string | undefined;
  action?: string | undefined;
  entity_type?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
} | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            sp.set(k, String(v));
          }
        });
      }
      const res = await fetch(`${API_BASE}/audit?${sp.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        let err = 'Failed to fetch audit logs';
        try {
          const json = await res.json();
          err = json.error?.message || json.message || err;
        } catch {
          // ignore
        }
        throw new Error(err);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });
}
