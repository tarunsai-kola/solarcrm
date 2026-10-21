import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CompanyBankAccount,
  CompanyOffice,
  CompanySettings,
  CreateCompanyBankAccount,
  CreateCompanyOffice,
  CreateDefaultQuoteComponent,
  CreateQuotationInput,
  DefaultQuoteComponent,
  Quotation,
  ReviseQuotationInput,
  UpdateCompanyBankAccount,
  UpdateCompanyOffice,
  UpdateCompanySettings,
  UpdateDefaultQuoteComponent,
  UpdateQuotationInput,
  UpdateQuotationStatus,
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

// ─── Quotations Hooks ────────────────────────────────────────────────────────
export function useQuotations(params?: {
  lead_id?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
  is_latest?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
} | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['quotations', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.lead_id) searchParams.set('lead_id', params.lead_id);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.is_latest !== undefined) searchParams.set('is_latest', String(params.is_latest));
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

      const json = await authFetch(`${API_BASE}/quotations?${searchParams.toString()}`, token);
      return json.data as {
        items: Quotation[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
    enabled: Boolean(token),
  });
}

export function useQuotation(id?: string) {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      if (!id) return null;
      const json = await authFetch(`${API_BASE}/quotations/${id}`, token);
      return json.data as Quotation & {
        lead: any;
        creator: any;
        items: any[];
      };
    },
    enabled: Boolean(token && id),
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: CreateQuotationInput) => {
      const json = await authFetch(`${API_BASE}/quotations`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return json.data as Quotation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.lead_id] });
    },
  });
}

export function useUpdateQuotation(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateQuotationInput) => {
      const json = await authFetch(`${API_BASE}/quotations/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return json.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    },
  });
}

export function useReviseQuotation(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: ReviseQuotationInput) => {
      const json = await authFetch(`${API_BASE}/quotations/${id}/revise`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return json.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation'] });
    },
  });
}

export function useUpdateQuotationStatus(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateQuotationStatus) => {
      const json = await authFetch(`${API_BASE}/quotations/${id}/status`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return json.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// ─── Download Quotation PDF ──────────────────────────────────────────────────
export async function downloadQuotationPdf(id: string, quotationNumber: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}/quotations/${id}/pdf`, { headers });
  if (!res.ok) {
    throw new Error('Failed to generate quotation PDF');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Solar_Quotation_${quotationNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ─── Settings Hooks ──────────────────────────────────────────────────────────
export function useCompanySettings() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const json = await authFetch(`${API_BASE}/settings`, token);
      return json.data as CompanySettings;
    },
    enabled: Boolean(token),
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateCompanySettings) => {
      const json = await authFetch(`${API_BASE}/settings`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return json.data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });
}

export function useCompanyOffices() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['company-offices'],
    queryFn: async () => {
      const json = await authFetch(`${API_BASE}/settings/offices`, token);
      return json.data as CompanyOffice[];
    },
    enabled: Boolean(token),
  });
}

export function useCreateCompanyOffice() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: CreateCompanyOffice) => {
      const json = await authFetch(`${API_BASE}/settings/offices`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return json.data as CompanyOffice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-offices'] });
    },
  });
}

export function useUpdateCompanyOffice(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateCompanyOffice) => {
      const json = await authFetch(`${API_BASE}/settings/offices/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return json.data as CompanyOffice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-offices'] });
    },
  });
}

export function useDeleteCompanyOffice() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (id: string) => {
      return authFetch(`${API_BASE}/settings/offices/${id}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-offices'] });
    },
  });
}

export function useCompanyBankAccounts() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['company-bank-accounts'],
    queryFn: async () => {
      const json = await authFetch(`${API_BASE}/settings/bank-accounts`, token);
      return json.data as CompanyBankAccount[];
    },
    enabled: Boolean(token),
  });
}

export function useCreateCompanyBankAccount() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: CreateCompanyBankAccount) => {
      const json = await authFetch(`${API_BASE}/settings/bank-accounts`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return json.data as CompanyBankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-bank-accounts'] });
    },
  });
}

export function useUpdateCompanyBankAccount(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateCompanyBankAccount) => {
      const json = await authFetch(`${API_BASE}/settings/bank-accounts/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return json.data as CompanyBankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-bank-accounts'] });
    },
  });
}

export function useDeleteCompanyBankAccount() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (id: string) => {
      return authFetch(`${API_BASE}/settings/bank-accounts/${id}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-bank-accounts'] });
    },
  });
}

export function useDefaultBOMComponents() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useQuery({
    queryKey: ['default-bom-components'],
    queryFn: async () => {
      const json = await authFetch(`${API_BASE}/settings/bom-components`, token);
      return json.data as DefaultQuoteComponent[];
    },
    enabled: Boolean(token),
  });
}

export function useCreateDefaultBOMComponent() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: CreateDefaultQuoteComponent) => {
      const json = await authFetch(`${API_BASE}/settings/bom-components`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return json.data as DefaultQuoteComponent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-bom-components'] });
    },
  });
}

export function useUpdateDefaultBOMComponent(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (payload: UpdateDefaultQuoteComponent) => {
      const json = await authFetch(`${API_BASE}/settings/bom-components/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return json.data as DefaultQuoteComponent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-bom-components'] });
    },
  });
}

export function useDeleteDefaultBOMComponent() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: async (id: string) => {
      return authFetch(`${API_BASE}/settings/bom-components/${id}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-bom-components'] });
    },
  });
}
