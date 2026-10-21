import type { Server } from 'http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const LEAD_1_ID = '00000000-0000-0000-0000-000000000101';
const FOLLOW_UP_1_ID = '00000000-0000-0000-0000-000000000201';

const sampleProfiles = [
  {
    id: USER_ADMIN_ID,
    organization_id: ORG_ID,
    email: 'admin@sunbeam.example',
    full_name: 'Aditi Deshmukh',
    role: 'admin',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_SALES_ID,
    organization_id: ORG_ID,
    email: 'rohit.sales@sunbeam.example',
    full_name: 'Rohit Joshi',
    role: 'inbound_sales',
    account_status: 'active',
    is_active: true,
  },
];

let testCalendarIntegrations: any[] = [];
let testCalendarEvents: any[] = [];
let testLeads: any[] = [];
let testFollowUps: any[] = [];
let testActivities: any[] = [];
let testCommunicationLogs: any[] = [];
let testNotifications: any[] = [];

// Mock Supabase
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let isSingle = false;
    let inFilters: Record<string, any[]> = {};
    let gteFilters: Record<string, any> = {};

    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => {
        currentFilters[col] = val;
        return builder;
      },
      in: (col: string, vals: any[]) => {
        inFilters[col] = vals;
        return builder;
      },
      gte: (col: string, val: any) => {
        gteFilters[col] = val;
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      single: () => {
        isSingle = true;
        return builder;
      },
      insert: (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        const withIds = items.map((i) => ({
          id: i.id || `00000000-0000-0000-0000-${Math.floor(Math.random() * 899999999999 + 100000000000)}`,
          created_at: new Date().toISOString(),
          ...i,
        }));
        if (table === 'calendar_integrations') testCalendarIntegrations.push(...withIds);
        if (table === 'calendar_events') testCalendarEvents.push(...withIds);
        if (table === 'communication_logs') testCommunicationLogs.push(...withIds);
        if (table === 'lead_activities') testActivities.push(...withIds);
        if (table === 'notifications') testNotifications.push(...withIds);

        return {
          select: () => ({
            single: () => Promise.resolve({ data: withIds[0], error: null }),
            then: (onFulfilled: any) => Promise.resolve({ data: withIds, error: null }).then(onFulfilled),
          }),
          then: (onFulfilled: any) => Promise.resolve({ data: withIds, error: null }).then(onFulfilled),
        };
      },
      upsert: (payload: any) => {
        const item = {
          id: payload.id || `00000000-0000-0000-0000-${Math.floor(Math.random() * 899999999999 + 100000000000)}`,
          created_at: new Date().toISOString(),
          ...payload,
        };
        if (table === 'calendar_integrations') {
          const idx = testCalendarIntegrations.findIndex(
            (c) => c.user_id === item.user_id && c.provider === item.provider,
          );
          if (idx >= 0) {
            testCalendarIntegrations[idx] = { ...testCalendarIntegrations[idx], ...item };
          } else {
            testCalendarIntegrations.push(item);
          }
        }
        return Promise.resolve({ data: item, error: null });
      },
      update: (updates: any) => {
        const updateFilters: Record<string, any> = {};
        const applyUpdates = () => {
          let updatedList: any[] = [];
          if (table === 'calendar_integrations') {
            testCalendarIntegrations = testCalendarIntegrations.map((c) => {
              const matches = Object.entries(updateFilters).every(([k, v]) => c[k] === v);
              if (matches) {
                const updated = { ...c, ...updates };
                updatedList.push(updated);
                return updated;
              }
              return c;
            });
          } else if (table === 'calendar_events') {
            testCalendarEvents = testCalendarEvents.map((e) => {
              const matches = Object.entries(updateFilters).every(([k, v]) => e[k] === v);
              if (matches) {
                const updated = { ...e, ...updates };
                updatedList.push(updated);
                return updated;
              }
              return e;
            });
          }
          return updatedList;
        };

        const updateBuilder: any = {
          eq: (col: string, val: any) => {
            updateFilters[col] = val;
            return updateBuilder;
          },
          select: () => ({
            single: () => {
              const list = applyUpdates();
              return Promise.resolve({ data: list[0] || null, error: null });
            },
            then: (onFulfilled: any) => {
              const list = applyUpdates();
              return Promise.resolve({ data: list, error: null }).then(onFulfilled);
            },
          }),
          then: (onFulfilled: any, onRejected: any) => {
            const list = applyUpdates();
            return Promise.resolve({ data: list, error: null }).then(onFulfilled, onRejected);
          },
        };
        return updateBuilder;
      },
      then: (onFulfilled: any, onRejected: any) => {
        let result: any = { data: [], error: null };
        if (table === 'profiles') {
          let list = [...sampleProfiles];
          if (currentFilters['id']) list = list.filter((p) => p.id === currentFilters['id']);
          result = { data: isSingle ? list[0] ?? null : list, error: isSingle && !list[0] ? { message: 'Not found' } : null };
        } else if (table === 'calendar_integrations') {
          let list = [...testCalendarIntegrations];
          if (currentFilters['user_id']) list = list.filter((c) => c.user_id === currentFilters['user_id']);
          if (currentFilters['organization_id']) list = list.filter((c) => c.organization_id === currentFilters['organization_id']);
          if (currentFilters['provider']) list = list.filter((c) => c.provider === currentFilters['provider']);
          result = { data: isSingle ? list[0] ?? null : list, error: null };
        } else if (table === 'calendar_events') {
          let list = [...testCalendarEvents];
          if (currentFilters['id']) list = list.filter((e) => e.id === currentFilters['id']);
          if (currentFilters['organization_id']) list = list.filter((e) => e.organization_id === currentFilters['organization_id']);
          if (currentFilters['user_id']) list = list.filter((e) => e.user_id === currentFilters['user_id']);
          if (currentFilters['lead_id']) list = list.filter((e) => e.lead_id === currentFilters['lead_id']);
          if (currentFilters['follow_up_id']) list = list.filter((e) => e.follow_up_id === currentFilters['follow_up_id']);
          if (currentFilters['site_visit_id']) list = list.filter((e) => e.site_visit_id === currentFilters['site_visit_id']);
          if (currentFilters['status']) list = list.filter((e) => e.status === currentFilters['status']);
          result = { data: isSingle ? list[0] ?? null : list, error: null };
        } else if (table === 'leads') {
          let list = [...testLeads];
          if (currentFilters['id']) list = list.filter((l) => l.id === currentFilters['id']);
          result = { data: isSingle ? list[0] ?? null : list, error: null };
        } else if (table === 'follow_ups') {
          let list = [...testFollowUps];
          if (currentFilters['organization_id']) list = list.filter((f) => f.organization_id === currentFilters['organization_id']);
          if (inFilters['status']) list = list.filter((f) => inFilters['status'].includes(f.status));
          result = { data: isSingle ? list[0] ?? null : list, error: null };
        } else if (table === 'communication_logs') {
          let list = [...testCommunicationLogs];
          if (currentFilters['organization_id']) list = list.filter((l) => l.organization_id === currentFilters['organization_id']);
          if (currentFilters['lead_id']) list = list.filter((l) => l.lead_id === currentFilters['lead_id']);
          result = { data: list, error: null };
        } else if (table === 'notifications') {
          let list = [...testNotifications];
          if (currentFilters['user_id']) list = list.filter((n) => n.user_id === currentFilters['user_id']);
          if (currentFilters['type']) list = list.filter((n) => n.type === currentFilters['type']);
          result = { data: isSingle ? list[0] ?? null : list, error: null };
        }
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  return {
    supabaseAdmin: {
      from: mockFrom,
      auth: {
        getUser: vi.fn(async (token: string) => {
          if (token === 'admin-token') {
            return { data: { user: { id: USER_ADMIN_ID, email: 'admin@sunbeam.example' } }, error: null };
          }
          if (token === 'sales-token') {
            return { data: { user: { id: USER_SALES_ID, email: 'rohit.sales@sunbeam.example' } }, error: null };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        }),
      },
    },
  };
});

// Import services and app after mocks
import { createApp } from '../src/app.js';
import { decryptToken, encryptToken } from '../src/services/encryption.js';
import { formatWhatsAppPhone, WHATSAPP_TEMPLATES } from '../src/services/whatsapp-service.js';
import { EMAIL_TEMPLATES } from '../src/services/email-service.js';

describe('PROMPT 8 — Integrations (Google Calendar, Meet, Email, WhatsApp, Reminders)', () => {
  let server: Server;
  let port: number;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          port = addr.port;
          baseUrl = `http://127.0.0.1:${port}/api/v1`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    testCalendarIntegrations = [];
    testCalendarEvents = [];
    testActivities = [];
    testCommunicationLogs = [];
    testNotifications = [];
    testLeads = [
      {
        id: LEAD_1_ID,
        organization_id: ORG_ID,
        customer_name: 'Rajesh Sharma',
        phone: '+919876543210',
        email: 'rajesh@example.com',
        address: 'Bunglow 42, Model Colony',
        area: 'Shivajinagar',
        pincode: '411016',
        status: 'qualified',
      },
    ];
    testFollowUps = [
      {
        id: FOLLOW_UP_1_ID,
        organization_id: ORG_ID,
        lead_id: LEAD_1_ID,
        assigned_to: USER_SALES_ID,
        due_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours overdue
        status: 'pending',
        lead: testLeads[0],
      },
    ];
  });

  // ─── 1. Encryption Unit Tests ────────────────────────────────────────────────
  describe('AES-256-GCM Token Encryption at Rest', () => {
    it('encrypts plaintext tokens with random IV and auth tag', () => {
      const plaintext = 'ya29.a0AfH6SMB_secret_google_oauth_token';
      const encrypted = encryptToken(plaintext);

      expect(encrypted).toContain('enc:');
      const parts = encrypted.split(':');
      expect(parts.length).toBe(4); // 'enc', iv, tag, ciphertext
      expect(encrypted).not.toContain(plaintext);
    });

    it('decrypts encrypted tokens back to original plaintext', () => {
      const original = '1//0gM7X_refresh_token_very_sensitive';
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(original);
    });

    it('produces different ciphertexts for the same plaintext due to random IV', () => {
      const token = 'same_secret_token';
      const enc1 = encryptToken(token);
      const enc2 = encryptToken(token);

      expect(enc1).not.toBe(enc2);
      expect(decryptToken(enc1)).toBe(token);
      expect(decryptToken(enc2)).toBe(token);
    });
  });

  // ─── 2. Integration Status & Discovery ───────────────────────────────────────
  describe('GET /integrations/status', () => {
    it('returns structured status distinguishing configured, connected, and unconfigured providers', async () => {
      const res = await fetch(`${baseUrl}/integrations/status`, {
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.integrations).toBeInstanceOf(Array);
      expect(json.data.integrations.length).toBe(3);

      const google = json.data.integrations.find((i: any) => i.provider === 'google');
      expect(google).toBeDefined();
      expect(google.name).toBe('Google Calendar & Meet');
      expect(google.connected).toBe(false);

      const email = json.data.integrations.find((i: any) => i.provider === 'smtp');
      expect(email).toBeDefined();
      expect(email.name).toBe('Email Service');

      const whatsapp = json.data.integrations.find((i: any) => i.provider === 'whatsapp');
      expect(whatsapp).toBeDefined();
      expect(whatsapp.name).toBe('WhatsApp Messaging');
    });
  });

  // ─── 3. Google Calendar & Meet Event Scheduling ──────────────────────────────
  describe('Calendar & Google Meet Event Operations', () => {
    it('schedules a calendar event and records meeting in lead activities', async () => {
      // Connect Google integration for sales rep
      testCalendarIntegrations.push({
        organization_id: ORG_ID,
        user_id: USER_SALES_ID,
        provider: 'google',
        access_token: encryptToken('mock-access-token'),
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        calendar_id: 'primary',
        email: 'rohit.sales@sunbeam.example',
        sync_enabled: true,
        sync_status: 'active',
      });

      // Mock Google Calendar API endpoint call
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url: any, opts: any) => {
        if (typeof url === 'string' && url.includes('googleapis.com/calendar/v3/calendars/primary/events')) {
          return {
            ok: true,
            json: async () => ({
              id: 'gcal_event_test_123',
              conferenceData: {
                entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc-defg-hij' }],
              },
            }),
          } as any;
        }
        return originalFetch(url, opts);
      });

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 86400000 + 3600000).toISOString();

      const res = await fetch(`${baseUrl}/integrations/google/events`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: LEAD_1_ID,
          follow_up_id: FOLLOW_UP_1_ID,
          title: 'Technical Rooftop Solar Survey — Rajesh Sharma',
          description: 'Assess roof load, tilt angle, and shadow analysis.',
          start_time: startTime,
          end_time: endTime,
          create_meet_link: true,
          attendee_email: 'rajesh@example.com',
          send_reminders: true,
        }),
      });

      globalThis.fetch = originalFetch;

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.meet_link).toBe('https://meet.google.com/abc-defg-hij');
      expect(json.data.event.external_event_id).toBe('gcal_event_test_123');

      // Verify lead_activities timeline was appended
      expect(testActivities.length).toBeGreaterThan(0);
      const meetingActivity = testActivities.find((a) => a.activity_type === 'meeting');
      expect(meetingActivity).toBeDefined();
      expect(meetingActivity.notes).toContain('https://meet.google.com/abc-defg-hij');
    });

    it('prevents duplicate calendar event creation for the same follow-up', async () => {
      // Seed existing event
      testCalendarEvents.push({
        id: 'existing-event-1',
        organization_id: ORG_ID,
        user_id: USER_SALES_ID,
        lead_id: LEAD_1_ID,
        follow_up_id: FOLLOW_UP_1_ID,
        title: 'Already Scheduled Meeting',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        external_event_id: 'gcal_existing_999',
        meet_link: 'https://meet.google.com/existing-link',
        status: 'confirmed',
      });

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 86400000 + 3600000).toISOString();

      const res = await fetch(`${baseUrl}/integrations/google/events`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: LEAD_1_ID,
          follow_up_id: FOLLOW_UP_1_ID,
          title: 'Duplicate Meeting Request',
          start_time: startTime,
          end_time: endTime,
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.event.external_event_id).toBe('gcal_existing_999');
      expect(json.data.meet_link).toBe('https://meet.google.com/existing-link');
      // Did not insert new row into calendar_events
      expect(testCalendarEvents.length).toBe(1);
    });

    it('cancels a calendar event and updates status to cancelled', async () => {
      const eventId = '00000000-0000-0000-0000-000000000777';
      testCalendarEvents.push({
        id: eventId,
        organization_id: ORG_ID,
        user_id: USER_SALES_ID,
        lead_id: LEAD_1_ID,
        title: 'Event to Cancel',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        external_event_id: 'gcal_event_cancel_me',
        status: 'confirmed',
      });

      const res = await fetch(`${baseUrl}/integrations/google/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(testCalendarEvents.find((e) => e.id === eventId)?.status).toBe('cancelled');
    });

    it('disconnects Google Calendar and clears stored OAuth credentials', async () => {
      testCalendarIntegrations.push({
        organization_id: ORG_ID,
        user_id: USER_SALES_ID,
        provider: 'google',
        access_token: encryptToken('some-token'),
        refresh_token: encryptToken('some-refresh'),
        sync_status: 'active',
      });

      const res = await fetch(`${baseUrl}/integrations/google/disconnect`, {
        method: 'POST',
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const integration = testCalendarIntegrations.find((c) => c.user_id === USER_SALES_ID);
      expect(integration.access_token).toBeNull();
      expect(integration.sync_status).toBe('disconnected');
    });
  });

  // ─── 4. Professional Email Composer & Delivery ──────────────────────────────
  describe('Email Composer & Communication Logging', () => {
    it('dispatches lead email, records in communication_logs, and appends to activity history', async () => {
      const res = await fetch(`${baseUrl}/integrations/email/send`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: LEAD_1_ID,
          to: 'rajesh@example.com',
          subject: 'Following up on your 5kW Rooftop Inquiry',
          body: EMAIL_TEMPLATES.consultation_follow_up.body('Rajesh Sharma', 'Shivajinagar'),
          template_type: 'consultation_follow_up',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.recipient).toBe('rajesh@example.com');
      expect(json.data.status).toMatch(/sent|simulated|unconfigured/);

      // Verify communication_logs
      expect(testCommunicationLogs.length).toBe(1);
      expect(testCommunicationLogs[0].channel).toBe('email');
      expect(testCommunicationLogs[0].recipient).toBe('rajesh@example.com');

      // Verify lead_activities timeline
      expect(testActivities.length).toBe(1);
      expect(testActivities[0].activity_type).toBe('email');
    });
  });

  // ─── 5. WhatsApp Deep-Link & Cloud API ──────────────────────────────────────
  describe('WhatsApp Messaging & Formatting', () => {
    it('formats 10-digit Indian numbers to E.164 with 91 prefix', () => {
      expect(formatWhatsAppPhone('9876543210')).toBe('919876543210');
      expect(formatWhatsAppPhone('+91 98765 43210')).toBe('919876543210');
      expect(formatWhatsAppPhone('919876543210')).toBe('919876543210');
    });

    it('generates wa.me link with encoded template text and explicit disclaimer', async () => {
      const res = await fetch(`${baseUrl}/integrations/whatsapp/prepare`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: LEAD_1_ID,
          phone: '9876543210',
          template_type: 'greeting',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.wa_link).toContain('https://wa.me/919876543210?text=');
      expect(json.data.disclaimer).toContain('NOT automatically sent');

      // Verify communication_logs
      const waLog = testCommunicationLogs.find((l) => l.channel === 'whatsapp');
      expect(waLog).toBeDefined();

      // Verify lead_activities
      const waActivity = testActivities.find((a) => a.activity_type === 'whatsapp');
      expect(waActivity).toBeDefined();
      expect(waActivity.notes).toContain('Opening WhatsApp does not confirm customer delivery');
    });
  });

  // ─── 6. Automated Reminders & Deduplication ─────────────────────────────────
  describe('Automated Follow-up Reminders Engine', () => {
    it('scans overdue and due-today follow-ups and creates in-app notifications', async () => {
      const res = await fetch(`${baseUrl}/integrations/reminders/process`, {
        method: 'POST',
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.total_checked).toBe(1);
      expect(json.data.overdue_count).toBe(1);
      expect(json.data.notifications_sent).toBe(1);

      // Verify notification created
      expect(testNotifications.length).toBe(1);
      expect(testNotifications[0].type).toBe('followup_overdue');
      expect(testNotifications[0].title).toContain('Overdue Follow-up: Rajesh Sharma');
    });

    it('deduplicates reminders to avoid duplicate notifications within 24 hours', async () => {
      // First run
      await fetch(`${baseUrl}/integrations/reminders/process`, {
        method: 'POST',
        headers: { Authorization: 'Bearer sales-token' },
      });

      const initialCount = testNotifications.length;

      // Second immediate run — must skip duplicate
      const res2 = await fetch(`${baseUrl}/integrations/reminders/process`, {
        method: 'POST',
        headers: { Authorization: 'Bearer sales-token' },
      });

      const json2 = await res2.json();
      expect(json2.data.duplicates_skipped).toBe(1);
      expect(testNotifications.length).toBe(initialCount);
    });
  });
});
