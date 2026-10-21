import type { Server } from 'http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearIdempotencyCache } from '../src/middleware/idempotency.js';

const ORG_1_ID = '00000000-0000-0000-0000-000000000001';
const ORG_2_ID = '00000000-0000-0000-0000-000000000002';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_ID = '00000000-0000-0000-0000-000000000013';

const LEAD_1_ID = '00000000-0000-0000-0000-000000000101';
const VISIT_1_ID = '00000000-0000-0000-0000-000000000201';
const NOTIF_1_ID = '00000000-0000-0000-0000-000000000301';

const sampleProfiles = [
  {
    id: USER_ADMIN_ID,
    organization_id: ORG_1_ID,
    company_id: ORG_1_ID,
    email: 'admin@sunbeam.example',
    full_name: 'Aditi Deshmukh',
    role: 'admin',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_SALES_ID,
    organization_id: ORG_1_ID,
    company_id: ORG_1_ID,
    email: 'rohit.sales@sunbeam.example',
    full_name: 'Rohit Joshi',
    role: 'inbound_sales',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_AGENT_ID,
    organization_id: ORG_1_ID,
    company_id: ORG_1_ID,
    email: 'amit.agent@sunbeam.example',
    full_name: 'Amit Patil',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
];

let testLeads: any[] = [];
let testVisits: any[] = [];
let testNotifications: any[] = [];
let testActivities: any[] = [];
let testAuditLogs: any[] = [];

// Mock Supabase admin client
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let isSingle = false;
    let isHead = false;

    const builder: any = {
      select: (_cols?: string, opts?: any) => {
        if (opts?.head) isHead = true;
        return builder;
      },
      eq: (col: string, val: any) => {
        currentFilters[col] = val;
        return builder;
      },
      order: () => builder,
      range: () => builder,
      limit: () => builder,
      single: () => {
        isSingle = true;
        return builder;
      },
      maybeSingle: () => {
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
        if (table === 'site_visits') testVisits.push(...withIds);
        else if (table === 'notifications') testNotifications.push(...withIds);
        else if (table === 'lead_activities') testActivities.push(...withIds);
        else if (table === 'audit_logs') testAuditLogs.push(...withIds);
        else if (table === 'leads') testLeads.push(...withIds);

        const res = isSingle || !Array.isArray(payload) ? withIds[0] : withIds;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: res, error: null }),
            then: (onF: any) => Promise.resolve({ data: res, error: null }).then(onF),
          }),
          then: (onF: any) => Promise.resolve({ data: res, error: null }).then(onF),
        };
      },
      update: (updates: any) => {
        const updateBuilder: any = {
          eq: (col: string, val: any) => {
            currentFilters[col] = val;
            return updateBuilder;
          },
          select: () => ({
            single: () => {
              let item: any = null;
              if (table === 'site_visits') {
                item = testVisits.find((v) =>
                  Object.entries(currentFilters).every(([k, val]) => v[k] === val),
                );
              } else if (table === 'notifications') {
                item = testNotifications.find((n) =>
                  Object.entries(currentFilters).every(([k, val]) => n[k] === val),
                );
              } else if (table === 'leads') {
                item = testLeads.find((l) =>
                  Object.entries(currentFilters).every(([k, val]) => l[k] === val),
                );
              }
              if (item) Object.assign(item, updates);
              return Promise.resolve({
                data: item,
                error: item ? null : { message: 'Not found' },
              });
            },
          }),
          then: (onF: any) => {
            if (table === 'notifications') {
              testNotifications
                .filter((n) => Object.entries(currentFilters).every(([k, val]) => n[k] === val))
                .forEach((n) => Object.assign(n, updates));
            } else if (table === 'leads') {
              testLeads
                .filter((l) => Object.entries(currentFilters).every(([k, val]) => l[k] === val))
                .forEach((l) => Object.assign(l, updates));
            } else if (table === 'site_visits') {
              testVisits
                .filter((v) => Object.entries(currentFilters).every(([k, val]) => v[k] === val))
                .forEach((v) => Object.assign(v, updates));
            }
            return Promise.resolve({ data: null, error: null }).then(onF);
          },
        };
        return updateBuilder;
      },
      delete: () => {
        const deleteBuilder: any = {
          eq: (col: string, val: any) => {
            currentFilters[col] = val;
            return deleteBuilder;
          },
          then: (onF: any) => {
            if (table === 'notifications') {
              testNotifications = testNotifications.filter(
                (n) => !Object.entries(currentFilters).every(([k, val]) => n[k] === val),
              );
            }
            return Promise.resolve({ data: null, error: null }).then(onF);
          },
        };
        return deleteBuilder;
      },
      then: (onFulfilled: any) => {
        if (table === 'organizations') {
          return Promise.resolve({ data: [{ id: ORG_1_ID }], error: null }).then(onFulfilled);
        }

        if (table === 'profiles') {
          const profile = sampleProfiles.find((p) => p.id === currentFilters['id']);
          return Promise.resolve({
            data: isSingle ? profile : sampleProfiles,
            error: isSingle && !profile ? { message: 'Profile not found' } : null,
          }).then(onFulfilled);
        }

        if (table === 'leads') {
          let list = [...testLeads];
          if (currentFilters['organization_id']) {
            list = list.filter((l) => l.organization_id === currentFilters['organization_id']);
          }
          if (currentFilters['id']) {
            list = list.filter((l) => l.id === currentFilters['id']);
          }
          return Promise.resolve({
            data: isSingle ? list[0] : list,
            error: isSingle && list.length === 0 ? { message: 'Lead not found' } : null,
          }).then(onFulfilled);
        }

        if (table === 'site_visits') {
          let list = [...testVisits];
          if (currentFilters['lead_id']) {
            list = list.filter((v) => v.lead_id === currentFilters['lead_id']);
          }
          if (currentFilters['organization_id']) {
            list = list.filter((v) => v.organization_id === currentFilters['organization_id']);
          }
          if (currentFilters['id']) {
            list = list.filter((v) => v.id === currentFilters['id']);
          }
          return Promise.resolve({
            data: isSingle ? list[0] : list,
            error: isSingle && list.length === 0 ? { message: 'Visit not found' } : null,
          }).then(onFulfilled);
        }

        if (table === 'notifications') {
          let list = [...testNotifications];
          if (currentFilters['user_id']) {
            list = list.filter((n) => n.user_id === currentFilters['user_id']);
          }
          if (currentFilters['organization_id']) {
            list = list.filter((n) => n.organization_id === currentFilters['organization_id']);
          }
          if (currentFilters['is_read'] !== undefined) {
            list = list.filter((n) => n.is_read === currentFilters['is_read']);
          }
          return Promise.resolve({
            data: isSingle ? list[0] : list,
            count: list.length,
            error: null,
          }).then(onFulfilled);
        }

        return Promise.resolve({ data: [], error: null }).then(onFulfilled);
      },
    };

    return builder;
  };

  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn((token: string) => {
          if (token === 'admin-token') return Promise.resolve({ data: { user: { id: USER_ADMIN_ID, email: 'admin@sunbeam.example' } }, error: null });
          if (token === 'sales-token') return Promise.resolve({ data: { user: { id: USER_SALES_ID, email: 'rohit.sales@sunbeam.example' } }, error: null });
          if (token === 'agent-token') return Promise.resolve({ data: { user: { id: USER_AGENT_ID, email: 'amit.agent@sunbeam.example' } }, error: null });
          return Promise.resolve({ data: { user: null }, error: { message: 'Invalid token' } });
        }),
      },
      from: vi.fn(mockFrom),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };
});

import { createApp } from '../src/app.js';

describe('PROMPT 11 — Production Readiness, Reliability & Security Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    clearIdempotencyCache();
    testLeads = [
      {
        id: LEAD_1_ID,
        organization_id: ORG_1_ID,
        customer_name: 'Ananya Sharma',
        phone: '+919876543210',
        email: 'ananya@example.com',
        status: 'fresh',
        inbound_sales_id: USER_SALES_ID,
        assigned_field_agent_id: USER_AGENT_ID,
      },
    ];

    testVisits = [
      {
        id: VISIT_1_ID,
        organization_id: ORG_1_ID,
        lead_id: LEAD_1_ID,
        field_agent_id: USER_AGENT_ID,
        scheduled_at: '2026-10-25T10:00:00.000Z',
        visit_status: 'scheduled',
        created_at: new Date().toISOString(),
      },
    ];

    testNotifications = [
      {
        id: NOTIF_1_ID,
        organization_id: ORG_1_ID,
        user_id: USER_SALES_ID,
        type: 'lead_assigned',
        title: 'New Lead Assigned: Ananya Sharma',
        body: 'Lead has been assigned to you.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ];

    testActivities = [];
    testAuditLogs = [];
  });

  // ─── 1. Health & Readiness Probes ──────────────────────────────────────────
  describe('Health and Readiness Probes', () => {
    it('GET /health returns 200 ok', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ok');
    });

    it('GET /health/live returns 200 alive with uptime', async () => {
      const res = await fetch(`${baseUrl}/health/live`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('alive');
      expect(typeof json.uptime).toBe('number');
    });

    it('GET /health/ready returns 200 ready when database is connected', async () => {
      const res = await fetch(`${baseUrl}/health/ready`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ready');
      expect(json.database).toBe('connected');
    });
  });

  // ─── 2. Request Correlation ID ─────────────────────────────────────────────
  describe('Structured Request Correlation (X-Request-ID)', () => {
    it('propagates client-supplied X-Request-ID in response header', async () => {
      const customReqId = 'req-trace-abc-12345';
      const res = await fetch(`${baseUrl}/health`, {
        headers: { 'X-Request-ID': customReqId },
      });
      expect(res.headers.get('x-request-id')).toBe(customReqId);
    });

    it('generates a valid UUID X-Request-ID when not provided by client', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const reqId = res.headers.get('x-request-id');
      expect(reqId).toBeTruthy();
      expect(reqId?.length).toBeGreaterThan(10);
    });
  });

  // ─── 3. Idempotency Protection ─────────────────────────────────────────────
  describe('Idempotency & Duplicate Prevention', () => {
    it('returns cached response on repeated request with same Idempotency-Key', async () => {
      const idempotencyKey = 'unique-mutation-key-001';

      // First call: create site visit
      const res1 = await fetch(`${baseUrl}/api/v1/leads/${LEAD_1_ID}/visits`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          field_agent_id: USER_AGENT_ID,
          scheduled_at: '2026-10-26T14:00:00.000Z',
          site_observations: 'Roof inspection first run',
        }),
      });

      expect(res1.status).toBe(201);
      const json1 = await res1.json();
      expect(json1.success).toBe(true);

      const visitsCountAfterFirst = testVisits.length;

      // Second call: exact same request with same idempotency key
      const res2 = await fetch(`${baseUrl}/api/v1/leads/${LEAD_1_ID}/visits`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          field_agent_id: USER_AGENT_ID,
          scheduled_at: '2026-10-26T14:00:00.000Z',
          site_observations: 'Roof inspection first run',
        }),
      });

      expect(res2.status).toBe(201);
      expect(res2.headers.get('x-idempotency-replay')).toBe('true');
      const json2 = await res2.json();
      expect(json2.data.id).toBe(json1.data.id);

      // Verify no duplicate records were inserted into the database
      expect(testVisits.length).toBe(visitsCountAfterFirst);
    });
  });

  // ─── 4. In-App Notifications API ───────────────────────────────────────────
  describe('In-App Notifications Lifecycle', () => {
    it('GET /api/v1/notifications returns paginated list for authenticated user', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.items)).toBe(true);
      expect(json.data.items.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/notifications/unread-count returns accurate unread count', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications/unread-count`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.unread_count).toBe(1);
    });

    it('PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications/${NOTIF_1_ID}/read`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.is_read).toBe(true);
    });

    it('PATCH /api/v1/notifications/read-all marks all unread notifications as read', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('DELETE /api/v1/notifications/:id deletes notification', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications/${NOTIF_1_ID}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(testNotifications.find((n) => n.id === NOTIF_1_ID)).toBeUndefined();
    });
  });

  // ─── 5. Site Visits Workflow & Timeline Notifications ───────────────────────
  describe('Site Visits Management & In-App Notification Delivery', () => {
    it('GET /api/v1/leads/:id/visits returns visits for lead', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads/${LEAD_1_ID}/visits`, {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].id).toBe(VISIT_1_ID);
    });

    it('POST /api/v1/leads/:id/visits schedules visit and notifies field agent', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads/${LEAD_1_ID}/visits`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_agent_id: USER_AGENT_ID,
          scheduled_at: '2026-10-27T11:00:00.000Z',
          site_observations: 'Client requested rooftop shadow analysis',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.visit_status).toBe('scheduled');

      // Lead status updated
      const lead = testLeads.find((l) => l.id === LEAD_1_ID);
      expect(lead.status).toBe('site_visit_scheduled');

      // Notification generated for the field agent
      const agentNotification = testNotifications.find(
        (n) => n.user_id === USER_AGENT_ID && n.type === 'site_visit_changed',
      );
      expect(agentNotification).toBeDefined();
      expect(agentNotification.title).toContain('Site Visit SCHEDULED');
    });

    it('PATCH /api/v1/leads/:id/visits/:visitId marks visit completed and updates lead status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads/${LEAD_1_ID}/visits/${VISIT_1_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer agent-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visit_status: 'completed',
          roof_suitability: 'good',
          electricity_bill_amount: 4500,
          monthly_consumption_kwh: 480,
          recommended_system_capacity_kw: 5,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.visit_status).toBe('completed');

      // Lead status updated to site_visit_completed
      const lead = testLeads.find((l) => l.id === LEAD_1_ID);
      expect(lead.status).toBe('site_visit_completed');

      // Notification sent to inbound sales rep
      const salesNotification = testNotifications.find(
        (n) => n.user_id === USER_SALES_ID && n.type === 'site_visit_changed',
      );
      expect(salesNotification).toBeDefined();
    });
  });

  // ─── 6. Security & Unauthorized Access ─────────────────────────────────────
  describe('Security & Unauthorized Access Controls', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notifications`);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid bearer tokens with 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads/${LEAD_1_ID}`, {
        headers: { Authorization: 'Bearer fake-malicious-token' },
      });
      expect(res.status).toBe(401);
    });

    it('prevents cross-organization data leakage with 404', async () => {
      const crossOrgLeadId = '00000000-0000-0000-0000-999999999999';
      const res = await fetch(`${baseUrl}/api/v1/leads/${crossOrgLeadId}`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(404);
    });
  });
});
