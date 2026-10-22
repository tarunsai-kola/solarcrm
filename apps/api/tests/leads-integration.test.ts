import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_ID = '00000000-0000-0000-0000-000000000013';

const LEAD_1_ID = '00000000-0000-0000-0000-000000000101';
const LEAD_2_ID = '00000000-0000-0000-0000-000000000102';
const LEAD_3_ID = '00000000-0000-0000-0000-000000000103';

const sampleProfiles = [
  {
    id: USER_ADMIN_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'admin@sunbeam.example',
    full_name: 'Aditi Deshmukh',
    role: 'admin',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_SALES_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'rohit.sales@sunbeam.example',
    full_name: 'Rohit Joshi',
    role: 'inbound_sales',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_AGENT_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'amit.agent@sunbeam.example',
    full_name: 'Amit Patil',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
];

const now = new Date();
const todayIso = now.toISOString();
const yesterdayIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

let testLeads: any[] = [
  {
    id: LEAD_1_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    customer_name: 'Vikram Mehta',
    phone: '+919876543210',
    email: 'vikram@example.com',
    status: 'new',
    temperature: 'hot',
    lead_source: 'Meta Ads',
    enquiry_type: 'residential',
    area: 'Kothrud',
    pincode: '411038',
    address: '102 Ganesh Towers, Kothrud',
    inbound_sales_id: USER_SALES_ID,
    assigned_field_agent_id: USER_AGENT_ID,
    assigned_to: USER_AGENT_ID,
    next_follow_up_at: yesterdayIso, // Overdue
    created_at: yesterdayIso,
  },
  {
    id: LEAD_2_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    customer_name: 'Ananya Gupta',
    phone: '+919876543211',
    email: 'ananya@example.com',
    status: 'won',
    temperature: 'hot',
    lead_source: 'Tata Solar',
    enquiry_type: 'commercial',
    area: 'Baner',
    pincode: '411045',
    address: 'Tech Park Baner',
    inbound_sales_id: USER_SALES_ID,
    assigned_field_agent_id: USER_AGENT_ID,
    assigned_to: USER_AGENT_ID,
    next_follow_up_at: null,
    created_at: yesterdayIso,
  },
  {
    id: LEAD_3_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    customer_name: 'Sanjay Verma',
    phone: '+919876543212',
    email: 'sanjay@example.com',
    status: 'lost',
    temperature: 'cold',
    lead_source: 'JustDial',
    enquiry_type: 'residential',
    area: 'Hadapsar',
    pincode: '411028',
    address: 'Mega City Hadapsar',
    inbound_sales_id: null,
    assigned_field_agent_id: null,
    assigned_to: null,
    next_follow_up_at: null,
    created_at: yesterdayIso,
  },
];

let testActivities: any[] = [];
let testFollowUps: any[] = [];
let testAuditLogs: any[] = [];

// Mock Supabase
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let orConditions: string[] = [];
    let isSingle = false;

    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => {
        currentFilters[col] = val;
        return builder;
      },
      neq: (col: string, val: any) => {
        currentFilters[`neq_${col}`] = val;
        return builder;
      },
      gte: () => builder,
      lte: () => builder,
      lt: () => builder,
      in: () => builder,
      not: () => builder,
      or: (conditionStr: string) => {
        orConditions.push(conditionStr);
        return builder;
      },
      order: () => builder,
      range: () => builder,
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
        if (table === 'leads') {
          testLeads.push(...withIds);
        } else if (table === 'lead_activities') {
          testActivities.push(...withIds);
        } else if (table === 'follow_ups') {
          testFollowUps.push(...withIds);
        } else if (table === 'audit_logs') {
          testAuditLogs.push(...withIds);
        }
        const res = isSingle || !Array.isArray(payload) ? withIds[0] : withIds;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: res, error: null }),
            then: (onFulfilled: any) => Promise.resolve({ data: res, error: null }).then(onFulfilled),
          }),
          then: (onFulfilled: any) => Promise.resolve({ data: res, error: null }).then(onFulfilled),
        };
      },
      update: (updates: any) => {
        return {
          eq: (col: string, val: any) => {
            currentFilters[col] = val;
            return {
              eq: (col2: string, val2: any) => {
                currentFilters[col2] = val2;
                return {
                  select: () => ({
                    single: () => {
                      if (table === 'leads') {
                        const idx = testLeads.findIndex((l) => l.id === currentFilters['id']);
                        if (idx !== -1) {
                          testLeads[idx] = { ...testLeads[idx], ...updates };
                          return Promise.resolve({ data: testLeads[idx], error: null });
                        }
                      }
                      return Promise.resolve({ data: null, error: { message: 'Not found' } });
                    },
                  }),
                  then: (onFulfilled: any) => {
                    if (table === 'leads') {
                      const idx = testLeads.findIndex((l) => l.id === currentFilters['id']);
                      if (idx !== -1) {
                        testLeads[idx] = { ...testLeads[idx], ...updates };
                      }
                    }
                    return Promise.resolve({ data: null, error: null }).then(onFulfilled);
                  },
                };
              },
            };
          },
          in: (col: string, values: any[]) => {
            return {
              eq: () => ({
                select: () => {
                  let updated: any[] = [];
                  if (table === 'leads') {
                    testLeads = testLeads.map((l) => {
                      if (values.includes(l.id)) {
                        const up = { ...l, ...updates };
                        updated.push(up);
                        return up;
                      }
                      return l;
                    });
                  }
                  return Promise.resolve({ data: updated, error: null });
                },
              }),
            };
          },
        };
      },
      delete: () => {
        return {
          eq: (col: string, val: any) => ({
            eq: () => {
              if (table === 'leads') {
                testLeads = testLeads.filter((l) => l[col] !== val);
              }
              return Promise.resolve({ error: null });
            },
          }),
        };
      },
      then: (onFulfilled: any, onRejected: any) => {
        let result: any = { data: [], count: 0, error: null };
        if (table === 'profiles') {
          let list = [...sampleProfiles];
          if (currentFilters['id']) {
            list = list.filter((p) => p.id === currentFilters['id']);
          }
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Profile not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'leads') {
          let list = [...testLeads];
          if (currentFilters['id']) {
            list = list.filter((l) => l.id === currentFilters['id']);
          }
          if (currentFilters['neq_id']) {
            list = list.filter((l) => l.id !== currentFilters['neq_id']);
          }
          if (currentFilters['status']) {
            list = list.filter((l) => l.status === currentFilters['status']);
          }
          // Filter by or conditions
          if (orConditions.length > 0) {
            const cond = orConditions[0];
            const phoneMatch = cond.match(/phone\.ilike\.%(\d+)%/);
            if (phoneMatch) {
              const digits = phoneMatch[1];
              list = list.filter((l) => l.phone.includes(digits));
            }
          }
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'lead_activities') {
          result = { data: testActivities, count: testActivities.length, error: null };
        } else if (table === 'follow_ups') {
          result = { data: testFollowUps, count: testFollowUps.length, error: null };
        }
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  const mockAdmin = {
    from: mockFrom,
    auth: {
      getUser: vi.fn(async (token: string) => {
        if (token === 'admin-token') {
          return { data: { user: { id: USER_ADMIN_ID, email: 'admin@sunbeam.example' } }, error: null };
        }
        if (token === 'sales-token') {
          return { data: { user: { id: USER_SALES_ID, email: 'rohit.sales@sunbeam.example' } }, error: null };
        }
        if (token === 'agent-token') {
          return { data: { user: { id: USER_AGENT_ID, email: 'amit.agent@sunbeam.example' } }, error: null };
        }
        return { data: { user: null }, error: { message: 'Invalid token' } };
      }),
    },
  };

  return {
    supabaseAdmin: mockAdmin,
    getScopedClient: vi.fn(() => mockAdmin),
    authStorage: {
      getStore: vi.fn(() => ({ client: mockAdmin, token: 'mock-token' })),
      run: vi.fn((_store: unknown, fn: () => unknown) => fn()),
    },
  };
});

import { createApp } from '../src/app.js';
import { normalizePhone } from '../src/routes/leads.js';

describe('PROMPT 5 — Manage Leads Module Integration Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://localhost:${addr.port}/api/v1`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ─── 1. Phone Normalization ──────────────────────────────────────────────────
  describe('Phone Normalization & Formatting', () => {
    it('normalizes 10-digit Indian numbers with +91 prefix', () => {
      expect(normalizePhone('9876543210')).toBe('+919876543210');
      expect(normalizePhone('+91 98765 43210')).toBe('+919876543210');
      expect(normalizePhone('919876543210')).toBe('+919876543210');
    });

    it('preserves clean international formats starting with +', () => {
      expect(normalizePhone('+14155552671')).toBe('+14155552671');
    });
  });

  // ─── 2. Duplicate Detection ──────────────────────────────────────────────────
  describe('GET /leads/check-duplicate', () => {
    it('detects existing lead with matching phone number', async () => {
      const res = await fetch(`${baseUrl}/leads/check-duplicate?phone=9876543210`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.hasDuplicate).toBe(true);
      expect(json.data.matches.length).toBeGreaterThan(0);
      expect(json.data.matches[0].customer_name).toBe('Vikram Mehta');
    });

    it('returns hasDuplicate: false when no lead matches', async () => {
      const res = await fetch(`${baseUrl}/leads/check-duplicate?phone=9999900000`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.hasDuplicate).toBe(false);
      expect(json.data.matches).toHaveLength(0);
    });
  });

  // ─── 3. Lead Creation & Duplicate Warning ────────────────────────────────────
  describe('POST /leads', () => {
    it('returns HTTP 409 Conflict with match details when duplicate detected without override', async () => {
      const payload = {
        customer_name: 'Vikram Mehta Duplicate',
        phone: '9876543210', // Exists in sample testLeads
        address: 'Some address',
        enquiry_type: 'residential',
      };
      const res = await fetch(`${baseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('DUPLICATE_LEAD_DETECTED');
      expect(json.error.details.matches).toBeDefined();
      expect(json.error.details.matches[0].customer_name).toBe('Vikram Mehta');
    });

    it('creates lead successfully when allow_duplicate is explicitly true', async () => {
      const payload = {
        customer_name: 'Vikram Mehta Distinct Unit',
        phone: '9876543210',
        pincode: '411038',
        allow_duplicate: true,
        initial_note: 'Customer wants a second solar installation on commercial unit.',
      };
      const res = await fetch(`${baseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.customer_name).toBe('Vikram Mehta Distinct Unit');
      expect(json.data.phone).toBe('+919876543210');

      // Verify that initial status activity was recorded
      const createdActivity = testActivities.find(
        (a) => a.lead_id === json.data.id && a.activity_type === 'status_change',
      );
      expect(createdActivity).toBeDefined();
      expect(createdActivity.outcome).toBe('Lead Created');

      // Verify initial note activity was recorded
      const noteActivity = testActivities.find(
        (a) => a.lead_id === json.data.id && a.activity_type === 'note',
      );
      expect(noteActivity).toBeDefined();
      expect(noteActivity.notes).toContain('second solar installation');
    });

    it('rejects lead creation if customer name is missing or phone invalid', async () => {
      const invalidPayload = {
        customer_name: '',
        phone: '123',
      };
      const res = await fetch(`${baseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify(invalidPayload),
      });
      expect(res.status).toBe(422);
    });
  });

  // ─── 4. Status Workflow & Reopened Leads Audit ───────────────────────────────
  describe('PATCH /leads/:id — Status Workflow & Reopened Deals', () => {
    it('records status change activity in chronological timeline', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({ status: 'contacted' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('contacted');

      // Verify status_change activity
      const activity = testActivities.find(
        (a) => a.lead_id === LEAD_1_ID && a.outcome === 'Status Changed',
      );
      expect(activity).toBeDefined();
      expect(activity.notes).toContain('Fresh');
      expect(activity.notes).toContain('Contacted');
    });

    it('marks outcome as "Reopened" when moving from Won/Lost back to active stage', async () => {
      // LEAD_2_ID is currently 'won'
      const res = await fetch(`${baseUrl}/leads/${LEAD_2_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({ status: 'follow_up' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('follow_up');

      // Verify Reopened activity
      const reopenedAct = testActivities.find(
        (a) => a.lead_id === LEAD_2_ID && a.outcome === 'Reopened',
      );
      expect(reopenedAct).toBeDefined();
      expect(reopenedAct.notes).toContain('[Reopened Lead]');
    });
  });

  // ─── 5. Follow-ups & Activity Logging ───────────────────────────────────────
  describe('Follow-ups & Logging', () => {
    it('schedules follow-up and updates next_follow_up_at', async () => {
      const nextDue = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/follow-ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          due_at: nextDue,
          notes: 'Discuss 8kW solar subsidy quotation with family',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.lead_id).toBe(LEAD_1_ID);

      // Verify lead's next_follow_up_at was updated
      const updatedLead = testLeads.find((l) => l.id === LEAD_1_ID);
      expect(updatedLead.next_follow_up_at).toBe(nextDue);
    });

    it('logs calls and notes in lead activities', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          activity_type: 'call',
          outcome: 'Connected',
          notes: 'Spoke with Vikram. Confirmed 3-phase electricity connection.',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.activity_type).toBe('call');
      expect(json.data.outcome).toBe('Connected');
    });
  });

  // ─── 6. Bulk Operations ─────────────────────────────────────────────────────
  describe('Bulk Operations (Admin / Inbound Sales)', () => {
    it('bulk assigns field agent and updates leads', async () => {
      const res = await fetch(`${baseUrl}/leads/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          lead_ids: [LEAD_1_ID, LEAD_2_ID],
          assigned_field_agent_id: USER_AGENT_ID,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.updatedCount).toBe(2);
    });

    it('bulk updates status with activity logs', async () => {
      const res = await fetch(`${baseUrl}/leads/bulk-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          lead_ids: [LEAD_1_ID],
          status: 'site_visit_scheduled',
          notes: 'Bulk updated after phone confirmation',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.updatedCount).toBe(1);
    });
  });

  // ─── 7. CSV Export Restricted Endpoint ──────────────────────────────────────
  describe('GET /leads/export', () => {
    it('allows admin and inbound sales to export CSV', async () => {
      const res = await fetch(`${baseUrl}/leads/export`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      const csvText = await res.text();
      expect(csvText).toContain('ID,Customer Name,Phone,Email,Status');
      expect(csvText).toContain('Vikram Mehta');
    });

    it('denies field agents from exporting leads (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/leads/export`, {
        headers: { Authorization: 'Bearer agent-token' },
      });
      expect(res.status).toBe(403);
    });
  });
});
