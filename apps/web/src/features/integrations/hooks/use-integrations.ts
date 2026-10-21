import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CalendarEvent,
  CommunicationLog,
  CreateCalendarEvent,
  GoogleOAuthInitResponse,
  IntegrationStatus,
  SendEmail,
  SendWhatsApp,
  UpdateCalendarEvent,
} from '@solar-crm/shared';

export const integrationsKeys = {
  all: ['integrations'] as const,
  status: () => [...integrationsKeys.all, 'status'] as const,
  events: (leadId?: string) => [...integrationsKeys.all, 'events', leadId || 'all'] as const,
  communications: (leadId: string) => [...integrationsKeys.all, 'communications', leadId] as const,
};

/**
 * Fetch overall integration status across Google Calendar, Email (SMTP), and WhatsApp
 */
export function useIntegrationStatus() {
  return useQuery({
    queryKey: integrationsKeys.status(),
    queryFn: async (): Promise<IntegrationStatus[]> => {
      const res = await apiClient.get('/integrations/status');
      return res.data.data.integrations;
    },
    staleTime: 30_000,
  });
}

/**
 * Generate Google OAuth consent URL
 */
export function useGoogleAuthUrl() {
  return useMutation({
    mutationFn: async (redirectUri?: string): Promise<GoogleOAuthInitResponse> => {
      const res = await apiClient.get('/integrations/google/auth-url', {
        params: redirectUri ? { redirect_uri: redirectUri } : undefined,
      });
      return res.data.data;
    },
  });
}

/**
 * Disconnect Google Calendar integration
 */
export function useDisconnectGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const res = await apiClient.post('/integrations/google/disconnect');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status() });
      queryClient.invalidateQueries({ queryKey: integrationsKeys.events() });
    },
  });
}

/**
 * Connect Google Calendar immediately (Demo / Instant Active Sync Mode)
 */
export function useConnectDemoGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ message: string; email: string }> => {
      const res = await apiClient.post('/integrations/google/connect-demo');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status() });
      queryClient.invalidateQueries({ queryKey: integrationsKeys.events() });
    },
  });
}

/**
 * Save Google Cloud OAuth Credentials
 */
export function useSaveGoogleConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { client_id: string; client_secret: string; redirect_uri?: string }) => {
      const res = await apiClient.post('/integrations/google/config', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status() });
    },
  });
}

/**
 * Query calendar events (for lead or current user)
 */
export function useCalendarEvents(leadId?: string) {
  return useQuery({
    queryKey: integrationsKeys.events(leadId),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const res = await apiClient.get('/integrations/google/events', {
        params: leadId ? { lead_id: leadId } : undefined,
      });
      return res.data.data;
    },
  });
}

/**
 * Schedule calendar event with optional Google Meet link
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateCalendarEvent,
    ): Promise<{ event: CalendarEvent; meet_link: string | null }> => {
      const res = await apiClient.post('/integrations/google/events', payload);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.events() });
      if (variables.lead_id) {
        queryClient.invalidateQueries({ queryKey: ['leads', variables.lead_id] });
      }
    },
  });
}

/**
 * Update calendar event
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: UpdateCalendarEvent;
    }): Promise<CalendarEvent> => {
      const res = await apiClient.patch(`/integrations/google/events/${eventId}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.events() });
    },
  });
}

/**
 * Cancel calendar event
 */
export function useCancelCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/integrations/google/events/${eventId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.events() });
    },
  });
}

/**
 * Send email to lead
 */
export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendEmail) => {
      const res = await apiClient.post('/integrations/email/send', payload);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationsKeys.communications(variables.lead_id),
      });
      queryClient.invalidateQueries({ queryKey: ['leads', variables.lead_id] });
    },
  });
}

/**
 * Prepare and launch WhatsApp link
 */
export function usePrepareWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendWhatsApp) => {
      const res = await apiClient.post('/integrations/whatsapp/prepare', payload);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationsKeys.communications(variables.lead_id),
      });
      queryClient.invalidateQueries({ queryKey: ['leads', variables.lead_id] });
    },
  });
}

/**
 * Trigger background reminder evaluation
 */
export function useTriggerReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/integrations/reminders/process');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
  });
}

/**
 * Query communication history logs for a lead
 */
export function useCommunicationLogs(leadId?: string) {
  return useQuery({
    queryKey: leadId ? integrationsKeys.communications(leadId) : ['communications', 'none'],
    queryFn: async (): Promise<CommunicationLog[]> => {
      if (!leadId) return [];
      const res = await apiClient.get('/integrations/communications', {
        params: { lead_id: leadId },
      });
      return res.data.data;
    },
    enabled: Boolean(leadId),
  });
}

/**
 * Exchange OAuth authorization code for Google Calendar access & refresh tokens
 */
export function useExchangeGoogleCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { code: string; state: string; redirect_uri?: string }) => {
      const res = await apiClient.post('/integrations/google/callback', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.status() });
      queryClient.invalidateQueries({ queryKey: integrationsKeys.events() });
    },
  });
}

