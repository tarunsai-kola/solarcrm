import type { Server } from 'http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_1_ID = '00000000-0000-0000-0000-000000000021';
const USER_AGENT_2_ID = '00000000-0000-0000-0000-000000000022';
const USER_AGENT_INACTIVE_ID = '00000000-0000-0000-0000-000000000023';

const LEAD_1_ID = '00000000-0000-0000-0000-000000000101';
const LEAD_UNMATCHED_ID = '00000000-0000-0000-0000-000000000102';

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
  {
    id: USER_AGENT_1_ID,
    organization_id: ORG_ID,
    email: 'amit.patil@sunbeam.example',
    full_name: 'Amit Patil',
    phone: '+919876543201',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_AGENT_2_ID,
    organization_id: ORG_ID,
    email: 'suresh.kulkarni@sunbeam.example',
    full_name: 'Suresh Kulkarni',
    phone: '+919876543202',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
  {
    id: USER_AGENT_INACTIVE_ID,
    organization_id: ORG_ID,
    email: 'inactive.agent@sunbeam.example',
    full_name: 'Inactive Agent',
    phone: '+919876543203',
    role: 'field_agent',
    account_status: 'suspended',
    is_active: false,
  },
];

let testLeads: any[] = [];
let testFAProfiles: any[] = [];
let testActivities: any[] = [];
let testNotifications: any[] = [];
let testAuditLogs: any[] = [];
let testSiteVisits: any[] = [];

// Mock Supabase
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let isSingle = false;
    let notFilters: Record<string, any> = {};
    let inFilters: Record<string, any[]> = {};
    let isCount = false;

    const builder: any = {
      select: (_cols: any, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact') {
          isCount = true;
        }
        return builder;
      },
      eq: (col: string, val: any) => {
        currentFilters[col] = val;
        return builder;
      },
      not: (col: string, _op: string, val: any) => {
        notFilters[col] = val;
        return builder;
      },
      in: (col: string, vals: any[]) => {
        inFilters[col] = vals;
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
        if (table === 'notifications') {
          testNotifications.push(...withIds);
        } else if (table === 'lead_activities') {
          testActivities.push(...withIds);
        } else if (table === 'audit_logs') {
          testAuditLogs.push(...withIds);
        } else if (table === 'leads') {
          testLeads.push(...withIds);
        }
        return {
          select: () => ({
            single: () => Promise.resolve({ data: withIds[0], error: null }),
            then: (onFulfilled: any) => Promise.resolve({ data: withIds, error: null }).then(onFulfilled),
          }),
          then: (onFulfilled: any) => Promise.resolve({ data: withIds, error: null }).then(onFulfilled),
        };
      },
      update: (updates: any) => {
        return {
          eq: (col: string, val: any) => {
            return {
              eq: (col2: string, val2: any) => {
                let updatedItems: any[] = [];
                if (table === 'leads') {
                  testLeads = testLeads.map((l) => {
                    if (l[col] === val && (!col2 || l[col2] === val2)) {
                      const updated = { ...l, ...updates };
                      updatedItems.push(updated);
                      return updated;
                    }
                    return l;
                  });
                }
                return {
                  select: () => ({
                    single: () => Promise.resolve({ data: updatedItems[0] ?? null, error: null }),
                    then: (onFulfilled: any) => Promise.resolve({ data: updatedItems, error: null }).then(onFulfilled),
                  }),
                  then: (onFulfilled: any) => Promise.resolve({ data: updatedItems, error: null }).then(onFulfilled),
                };
              },
            };
          },
        };
      },
      then: (onFulfilled: any, onRejected: any) => {
        if (isCount) {
          let list = [...testLeads];
          if (currentFilters['organization_id']) {
            list = list.filter((l) => l.organization_id === currentFilters['organization_id']);
          }
          if (currentFilters['assigned_field_agent_id']) {
            list = list.filter((l) => l.assigned_field_agent_id === currentFilters['assigned_field_agent_id']);
          }
          if (inFilters['status']) {
            list = list.filter((l) => inFilters['status'].includes(l.status));
          }
          return Promise.resolve({ count: list.length, data: null, error: null }).then(onFulfilled, onRejected);
        }

        let result: any = { data: [], count: 0, error: null };
        if (table === 'profiles') {
          let list = [...sampleProfiles];
          if (currentFilters['id']) {
            list = list.filter((p) => p.id === currentFilters['id']);
          }
          if (currentFilters['role']) {
            list = list.filter((p) => p.role === currentFilters['role']);
          }
          if (currentFilters['account_status']) {
            list = list.filter((p) => p.account_status === currentFilters['account_status']);
          }
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Profile not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'field_agent_profiles') {
          let list = [...testFAProfiles];
          if (currentFilters['user_id']) {
            list = list.filter((f) => f.user_id === currentFilters['user_id']);
          }
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'leads') {
          let list = [...testLeads];
          if (currentFilters['id']) {
            list = list.filter((l) => l.id === currentFilters['id']);
          }
          if (notFilters['assigned_field_agent_id'] === null) {
            list = list.filter((l) => l.assigned_field_agent_id !== null && l.assigned_field_agent_id !== undefined);
          }
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Lead not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'site_visits') {
          result = { data: testSiteVisits, count: testSiteVisits.length, error: null };
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
          return { data: { user: { id: USER_AGENT_1_ID, email: 'amit.patil@sunbeam.example' } }, error: null };
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
import { computeAgentMatchScore } from '../src/routes/leads.js';

describe('PROMPT 7 — Field Agent Pincode-Based Assignment & Matching Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    testLeads = [
      {
        id: LEAD_1_ID,
        organization_id: ORG_ID,
        customer_name: 'Pooja Kulkarni',
        phone: '+919876543299',
        pincode: '411038',
        area: 'Kothrud',
        assigned_field_agent_id: null,
        assigned_to: null,
        status: 'qualified',
      },
      {
        id: LEAD_UNMATCHED_ID,
        organization_id: ORG_ID,
        customer_name: 'Harish Nair',
        phone: '+919876543298',
        pincode: '400001', // South Mumbai pincode, not covered by Pune agents
        area: 'Fort',
        assigned_field_agent_id: null,
        assigned_to: null,
        status: 'new',
      },
    ];

    testFAProfiles = [
      {
        user_id: USER_AGENT_1_ID,
        organization_id: ORG_ID,
        pincode: '411038', // Base Kothrud
        service_pincodes: ['411038', '411004', '411058'],
        service_areas: ['Kothrud', 'Deccan', 'Warje'],
        availability: 'available',
        max_active_leads: 10,
        notes: 'Senior Pune West specialist',
      },
      {
        user_id: USER_AGENT_2_ID,
        organization_id: ORG_ID,
        pincode: '411045', // Base Baner
        service_pincodes: ['411045', '411007', '411057'],
        service_areas: ['Baner', 'Aundh', 'Wakad'],
        availability: 'available',
        max_active_leads: 12,
        notes: 'Pune North specialist',
      },
    ];

    testActivities = [];
    testNotifications = [];
    testAuditLogs = [];
    testSiteVisits = [];
  });

  // ─── 1. Scoring & Matching Unit Logic ─────────────────────────────────────────
  describe('Matching & Scoring Algorithm (computeAgentMatchScore)', () => {
    it('awards high score and marks recommended when service pincode, base pincode, and area match', () => {
      const result = computeAgentMatchScore({
        leadPincode: '411038',
        leadArea: 'Kothrud',
        agentPincode: '411038',
        servicePincodes: ['411038', '411004'],
        serviceAreas: ['Kothrud'],
        availability: 'available',
        maxActiveLeads: 15,
        currentActiveLeads: 2,
        pendingSiteVisits: 0,
      });

      expect(result.isPincodeMatch).toBe(true);
      expect(result.isBasePincodeMatch).toBe(true);
      expect(result.isAreaMatch).toBe(true);
      expect(result.isAtCapacity).toBe(false);
      expect(result.score).toBeGreaterThanOrEqual(130);
      expect(result.recommended).toBe(true);
      expect(result.recommendationReason).toContain('Primary base & service pincode match');
    });

    it('penalizes unavailable agents (on_leave or offline)', () => {
      const result = computeAgentMatchScore({
        leadPincode: '411038',
        servicePincodes: ['411038'],
        serviceAreas: [],
        availability: 'on_leave',
        maxActiveLeads: 15,
        currentActiveLeads: 0,
        pendingSiteVisits: 0,
      });

      expect(result.isPincodeMatch).toBe(true);
      expect(result.recommended).toBe(false);
      expect(result.recommendationReason).toContain('on_leave');
    });

    it('identifies agents at full active capacity and penalizes score', () => {
      const result = computeAgentMatchScore({
        leadPincode: '411038',
        servicePincodes: ['411038'],
        serviceAreas: [],
        availability: 'available',
        maxActiveLeads: 10,
        currentActiveLeads: 10, // at capacity
        pendingSiteVisits: 2,
      });

      expect(result.isAtCapacity).toBe(true);
      expect(result.recommended).toBe(false);
      expect(result.recommendationReason).toContain('At maximum active capacity');
    });
  });

  // ─── 2. GET /leads/:id/eligible-agents Endpoint ──────────────────────────────
  describe('GET /leads/:id/eligible-agents', () => {
    it('returns ranked eligible agents with recommendation for lead pincode 411038', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/eligible-agents`, {
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.lead_pincode).toBe('411038');
      expect(json.data.has_exact_pincode_match).toBe(true);
      expect(json.data.agents.length).toBeGreaterThanOrEqual(2);

      // Agent 1 covers 411038 and must be top recommendation
      const topAgent = json.data.agents[0];
      expect(topAgent.agent_id).toBe(USER_AGENT_1_ID);
      expect(topAgent.recommended).toBe(true);
      expect(topAgent.is_pincode_match).toBe(true);
      expect(topAgent.score).toBeGreaterThan(json.data.agents[1].score);
    });

    it('reports unassigned reason when no active agents service the pincode', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_UNMATCHED_ID}/eligible-agents`, {
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.has_exact_pincode_match).toBe(false);
      expect(json.data.unassigned_reason).toContain('No active field agents configure service pincode');
    });
  });

  // ─── 3. POST /leads/:id/assign-agent (Initial Assignment) ─────────────────────
  describe('POST /leads/:id/assign-agent (Initial Assignment)', () => {
    it('assigns field agent, updates lead, creates in-app notification, and logs assignment history', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/assign-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          agent_id: USER_AGENT_1_ID,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.lead.assigned_field_agent_id).toBe(USER_AGENT_1_ID);

      // Verify notification created for assigned agent
      const agentNotification = testNotifications.find(
        (n) => n.user_id === USER_AGENT_1_ID && n.type === 'lead_assigned',
      );
      expect(agentNotification).toBeDefined();
      expect(agentNotification.title).toContain('New Lead Assigned: Pooja Kulkarni');

      // Verify activity timeline history recorded
      const assignActivity = testActivities.find(
        (a) => a.activity_type === 'assignment' && a.outcome === 'Assigned',
      );
      expect(assignActivity).toBeDefined();
      expect(assignActivity.notes).toContain('Amit Patil');

      // Verify audit log entry
      expect(testAuditLogs.length).toBeGreaterThan(0);
      expect(testAuditLogs[0].entity_type).toBe('leads');
    });

    it('forbids Field Agents from performing lead assignment (Role Guard)', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/assign-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agent-token',
        },
        body: JSON.stringify({
          agent_id: USER_AGENT_1_ID,
        }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  // ─── 4. Reassignment Workflow & Dual Notifications ────────────────────────────
  describe('Lead Reassignment Workflow', () => {
    beforeEach(() => {
      // Pre-assign lead to Agent 1
      const lead = testLeads.find((l) => l.id === LEAD_1_ID);
      lead.assigned_field_agent_id = USER_AGENT_1_ID;
      lead.assigned_to = USER_AGENT_1_ID;
    });

    it('reassigns lead from Agent 1 to Agent 2 and notifies both agents', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/assign-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          agent_id: USER_AGENT_2_ID,
          override_reason: 'Agent 1 assigned to urgent commercial inspection; shifting workload',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.lead.assigned_field_agent_id).toBe(USER_AGENT_2_ID);
      expect(json.data.previousAgentId).toBe(USER_AGENT_1_ID);

      // 1. Notification for new agent
      const newAgentNotif = testNotifications.find(
        (n) => n.user_id === USER_AGENT_2_ID && n.type === 'lead_assigned',
      );
      expect(newAgentNotif).toBeDefined();

      // 2. Notification for previous agent
      const prevAgentNotif = testNotifications.find(
        (n) => n.user_id === USER_AGENT_1_ID && n.type === 'lead_reassigned',
      );
      expect(prevAgentNotif).toBeDefined();
      expect(prevAgentNotif.body).toContain('reassigned to Suresh Kulkarni');

      // 3. Activity timeline preservation
      const reassignActivity = testActivities.find(
        (a) => a.activity_type === 'assignment' && a.outcome === 'Reassigned',
      );
      expect(reassignActivity).toBeDefined();
      expect(reassignActivity.notes).toContain('Previous agent: Amit Patil');
      expect(reassignActivity.notes).toContain('urgent commercial inspection');
    });

    it('rejects assignment to an inactive or suspended field agent', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/assign-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          agent_id: USER_AGENT_INACTIVE_ID,
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INACTIVE_AGENT');
    });
  });
});
