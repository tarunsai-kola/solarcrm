import type { Server } from 'http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_ID = '00000000-0000-0000-0000-000000000013';
const USER_INACTIVE_ID = '00000000-0000-0000-0000-000000000099';

const LEAD_1_ID = '00000000-0000-0000-0000-000000000101';
const LEAD_2_ID = '00000000-0000-0000-0000-000000000102';

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
  {
    id: USER_INACTIVE_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'former.rep@sunbeam.example',
    full_name: 'Former Rep',
    role: 'inbound_sales',
    account_status: 'suspended',
    is_active: false,
  },
];

let testLeads: any[] = [];
let testActivities: any[] = [];
let testFollowUps: any[] = [];
let testAuditLogs: any[] = [];

// Mock Supabase Database
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let orConditions: string[] = [];
    let isSingle = false;
    let orderCol: string | null = null;
    let orderAsc = true;

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
      gte: (col: string, val: any) => {
        currentFilters[`gte_${col}`] = val;
        return builder;
      },
      lte: (col: string, val: any) => {
        currentFilters[`lte_${col}`] = val;
        return builder;
      },
      lt: (col: string, val: any) => {
        currentFilters[`lt_${col}`] = val;
        return builder;
      },
      in: () => builder,
      or: (cond: string) => {
        orConditions.push(cond);
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderCol = col;
        orderAsc = opts?.ascending ?? true;
        return builder;
      },
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
        return {
          select: () => ({
            single: () => Promise.resolve({ data: withIds[0], error: null }),
            then: (onFulfilled: any) => Promise.resolve({ data: withIds, error: null }).then(onFulfilled),
          }),
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
                } else if (table === 'follow_ups') {
                  testFollowUps = testFollowUps.map((f) => {
                    if (f[col] === val && (!col2 || f[col2] === val2)) {
                      const updated = { ...f, ...updates };
                      updatedItems.push(updated);
                      return updated;
                    }
                    return f;
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
              select: () => ({
                single: () => {
                  let updated: any = null;
                  if (table === 'follow_ups') {
                    testFollowUps = testFollowUps.map((f) => {
                      if (f[col] === val) {
                        updated = { ...f, ...updates };
                        return updated;
                      }
                      return f;
                    });
                  }
                  return Promise.resolve({ data: updated, error: null });
                },
              }),
            };
          },
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
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Lead not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'lead_activities') {
          let list = [...testActivities];
          if (currentFilters['id']) {
            list = list.filter((a) => a.id === currentFilters['id']);
          }
          if (currentFilters['lead_id']) {
            list = list.filter((a) => a.lead_id === currentFilters['lead_id']);
          }
          if (isSingle) {
            result = { data: list[0] ?? null, error: list[0] ? null : { message: 'Activity not found' } };
          } else {
            result = { data: list, count: list.length, error: null };
          }
        } else if (table === 'follow_ups') {
          let list = [...testFollowUps];
          if (currentFilters['id']) {
            list = list.filter((f) => f.id === currentFilters['id']);
          }
          if (currentFilters['assigned_to']) {
            list = list.filter((f) => f.assigned_to === currentFilters['assigned_to']);
          }
          if (currentFilters['completion_status']) {
            list = list.filter((f) => f.completion_status === currentFilters['completion_status']);
          }
          if (orConditions.length > 0) {
            for (const cond of orConditions) {
              const match = cond.match(/assigned_to\.eq\.([0-9a-fA-F-]+)/);
              if (match) {
                const targetId = match[1];
                list = list.filter((f) => f.assigned_to === targetId);
              }
            }
          }
          if (orderCol) {
            list.sort((a, b) => {
              const valA = new Date(a[orderCol!]).getTime();
              const valB = new Date(b[orderCol!]).getTime();
              return orderAsc ? valA - valB : valB - valA;
            });
          }
          // Join lead info & assignee
          const enriched = list.map((fu) => {
            const lead = testLeads.find((l) => l.id === fu.lead_id);
            const assignee = sampleProfiles.find((p) => p.id === fu.assigned_to);
            return {
              ...fu,
              lead: lead ? { id: lead.id, customer_name: lead.customer_name, phone: lead.phone, status: lead.status, temperature: lead.temperature } : null,
              assignee: assignee ? { id: assignee.id, full_name: assignee.full_name, email: assignee.email, role: assignee.role } : null,
            };
          });
          if (isSingle) {
            result = { data: enriched[0] ?? null, error: enriched[0] ? null : { message: 'Follow up not found' } };
          } else {
            result = { data: enriched, count: enriched.length, error: null };
          }
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
          if (token === 'agent-token') {
            return { data: { user: { id: USER_AGENT_ID, email: 'amit.agent@sunbeam.example' } }, error: null };
          }
          return { data: { user: null }, error: { message: 'Invalid token' } };
        }),
      },
    },
  };
});

import { createApp } from '../src/app.js';

describe('PROMPT 6 — Shared Call Logs & Follow-up Management Integration Tests', () => {
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
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    testLeads = [
      {
        id: LEAD_1_ID,
        organization_id: ORG_ID,
        company_id: ORG_ID,
        customer_name: 'Rajesh Patil',
        phone: '+919876543210',
        email: 'rajesh@example.com',
        status: 'contacted',
        temperature: 'warm',
        inbound_sales_id: USER_SALES_ID,
        assigned_field_agent_id: USER_AGENT_ID,
        next_follow_up_at: yesterday,
        created_at: yesterday,
      },
      {
        id: LEAD_2_ID,
        organization_id: ORG_ID,
        company_id: ORG_ID,
        customer_name: 'Kavita Joshi',
        phone: '+919876543220',
        email: 'kavita@example.com',
        status: 'new',
        temperature: 'cold',
        inbound_sales_id: USER_SALES_ID,
        assigned_field_agent_id: null,
        next_follow_up_at: null,
        created_at: yesterday,
      },
    ];
    testActivities = [];
    testFollowUps = [];
    testAuditLogs = [];
  });

  // ─── 1. Call Log Creation & Atomicity ─────────────────────────────────────────
  describe('Add Call Log & Communication History', () => {
    it('successfully logs an outgoing call with duration and updates temperature', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/call-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          activity_type: 'outgoing_call',
          outcome: 'Connected',
          temperature: 'hot',
          notes: 'Customer interested in 5kW on-grid solar system. Roof has no shadow.',
          duration_seconds: 360,
          follow_up_required: false,
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.activity.activity_type).toBe('outgoing_call');
      expect(json.data.activity.outcome).toBe('Connected');
      expect(json.data.activity.duration_seconds).toBe(360);

      // Verify lead temperature was updated to 'hot'
      const updatedLead = testLeads.find((l) => l.id === LEAD_1_ID);
      expect(updatedLead.temperature).toBe('hot');

      // Verify audit log entry was created
      expect(testAuditLogs.length).toBeGreaterThan(0);
      expect(testAuditLogs[0].entity_type).toBe('lead_activities');
    });

    it('atomically creates follow-up and synchronizes next_follow_up_at when requested', async () => {
      const scheduledIso = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/call-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          activity_type: 'outgoing_call',
          outcome: 'Call Back Requested',
          temperature: 'warm',
          notes: 'Customer asked to call back after reviewing electricity consumption.',
          follow_up_required: true,
          next_follow_up_at: scheduledIso,
          follow_up_owner: USER_SALES_ID,
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.followUp).toBeDefined();
      expect(json.data.followUp.due_at).toBe(scheduledIso);

      // Verify lead.next_follow_up_at was updated atomically
      const updatedLead = testLeads.find((l) => l.id === LEAD_1_ID);
      expect(updatedLead.next_follow_up_at).toBe(scheduledIso);

      // Verify activity references follow_up_id
      expect(testActivities[0].follow_up_id).toBe(json.data.followUp.id);
    });

    it('rejects follow-up assignment to inactive or suspended user accounts', async () => {
      const scheduledIso = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/call-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          activity_type: 'outgoing_call',
          outcome: 'Connected',
          notes: 'Discussed requirements',
          follow_up_required: true,
          next_follow_up_at: scheduledIso,
          follow_up_owner: USER_INACTIVE_ID,
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INACTIVE_OWNER');
    });

    it('validates server-side inputs and rejects missing notes', async () => {
      const res = await fetch(`${baseUrl}/leads/${LEAD_1_ID}/call-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          activity_type: 'outgoing_call',
          outcome: 'Connected',
          notes: '', // empty notes
        }),
      });

      expect(res.status).toBe(422);
    });
  });

  // ─── 2. Auditable Amendments ──────────────────────────────────────────────────
  describe('Auditable Amendment Flow (Append-Only)', () => {
    it('appends an auditable correction linked to the original record without modifying it', async () => {
      // 1. First record an original activity
      testActivities.push({
        id: '00000000-0000-0000-0000-000000000888',
        organization_id: ORG_ID,
        lead_id: LEAD_1_ID,
        author_id: USER_SALES_ID,
        activity_type: 'outgoing_call',
        outcome: 'Connected',
        notes: 'Original note: Customer estimated 10kW system required.',
        occurred_at: new Date().toISOString(),
      });

      const origActivity = testActivities[0];

      // 2. Submit an amendment
      const res = await fetch(
        `${baseUrl}/leads/${LEAD_1_ID}/activities/${origActivity.id}/amend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer sales-token',
          },
          body: JSON.stringify({
            amendment_reason: 'Correction: Customer clarified 5kW single phase, not 10kW',
            notes: 'Customer confirmed monthly electricity bill is ₹4,500, requiring 5kW system.',
          }),
        },
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.is_amendment).toBe(true);
      expect(json.data.amends_activity_id).toBe(origActivity.id);
      expect(json.data.amendment_reason).toContain('Correction: Customer clarified');

      // Verify the original record remains completely untouched
      const originalInDb = testActivities.find((a) => a.id === origActivity.id);
      expect(originalInDb.notes).toBe('Original note: Customer estimated 10kW system required.');
      expect(originalInDb.is_amendment).toBeFalsy();

      // Total activities is now 2 (append-only)
      expect(testActivities.length).toBe(2);
    });
  });

  // ─── 3. Follow-up Lifecycle: Reschedule, Complete, Cancel ─────────────────────
  describe('Follow-up Lifecycle Management', () => {
    let testFollowUpId: string;

    beforeEach(() => {
      testFollowUpId = '00000000-0000-0000-0000-000000000777';
      testFollowUps = [
        {
          id: testFollowUpId,
          organization_id: ORG_ID,
          lead_id: LEAD_1_ID,
          assigned_to: USER_SALES_ID,
          due_at: new Date(Date.now() - 3600 * 1000).toISOString(), // overdue
          notes: 'Discuss rooftop measurements with customer',
          reminder_status: 'sent',
          completion_status: 'pending',
          rescheduled_count: 0,
          created_at: new Date().toISOString(),
        },
      ];
    });

    it('reschedules follow-up, resets reminder status, increments reschedule count, and logs history', async () => {
      const newDueIso = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
      const res = await fetch(`${baseUrl}/follow-ups/${testFollowUpId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          due_at: newDueIso,
          reason: 'Customer traveling for Diwali holidays, requested callback next week',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.due_at).toBe(newDueIso);
      expect(json.data.rescheduled_count).toBe(1);
      expect(json.data.reminder_status).toBe('pending'); // Reset reminder to prevent duplicate fires

      // Check lead activity log was created for rescheduling
      const rescheduleLog = testActivities.find(
        (a) => a.outcome === 'Rescheduled' || a.notes.includes('rescheduled'),
      );
      expect(rescheduleLog).toBeDefined();
      expect(rescheduleLog.notes).toContain('Diwali holidays');

      // Check lead next_follow_up_at was updated to new date
      const updatedLead = testLeads.find((l) => l.id === LEAD_1_ID);
      expect(updatedLead.next_follow_up_at).toBe(newDueIso);
    });

    it('completes follow-up, marks completed_at, and creates completion activity record', async () => {
      const res = await fetch(`${baseUrl}/follow-ups/${testFollowUpId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          notes: 'Customer agreed to onsite inspection on Friday 10 AM',
          outcome: 'Inspection Scheduled',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.completion_status).toBe('completed');
      expect(json.data.completed_at).toBeDefined();

      // Check lead activity history
      const completionLog = testActivities.find(
        (a) => a.outcome === 'Inspection Scheduled' || a.notes.includes('onsite inspection'),
      );
      expect(completionLog).toBeDefined();
      expect(completionLog.outcome).toBe('Inspection Scheduled');
      expect(completionLog.notes).toContain('Customer agreed to onsite inspection');
    });

    it('cancels follow-up and appends cancellation reason to history', async () => {
      const res = await fetch(`${baseUrl}/follow-ups/${testFollowUpId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-token',
        },
        body: JSON.stringify({
          reason: 'Customer opted out of solar installation',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.completion_status).toBe('cancelled');

      const cancelLog = testActivities.find(
        (a) => a.outcome === 'Follow-up Cancelled' || a.notes.includes('opted out'),
      );
      expect(cancelLog).toBeDefined();
    });
  });

  // ─── 4. List Follow-ups & Role Scoping ────────────────────────────────────────
  describe('GET /follow-ups Tab Counts & Role Permissions', () => {
    beforeEach(() => {
      const pastTime = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const futureTime = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

      testFollowUps = [
        {
          id: '00000000-0000-0000-0000-000000000501',
          organization_id: ORG_ID,
          lead_id: LEAD_1_ID,
          assigned_to: USER_AGENT_ID,
          due_at: pastTime, // overdue
          completion_status: 'pending',
        },
        {
          id: '00000000-0000-0000-0000-000000000502',
          organization_id: ORG_ID,
          lead_id: LEAD_2_ID,
          assigned_to: USER_SALES_ID,
          due_at: futureTime, // upcoming
          completion_status: 'pending',
        },
        {
          id: '00000000-0000-0000-0000-000000000503',
          organization_id: ORG_ID,
          lead_id: LEAD_1_ID,
          assigned_to: USER_AGENT_ID,
          due_at: pastTime,
          completion_status: 'completed',
        },
      ];
    });

    it('returns follow-ups and tab counts for sales reps and admins', async () => {
      const res = await fetch(`${baseUrl}/follow-ups?tab=all`, {
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.counts).toBeDefined();
      expect(json.data.counts.overdue).toBe(1);
      expect(json.data.counts.upcoming).toBe(1);
      expect(json.data.counts.completed).toBe(1);
    });

    it('scopes follow-up visibility for Field Agents to assigned records only', async () => {
      const res = await fetch(`${baseUrl}/follow-ups?tab=all`, {
        headers: { Authorization: 'Bearer agent-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Field agent should only see follow-ups assigned to USER_AGENT_ID
      const allAssignedToAgent = json.data.items.every(
        (item: any) => item.assigned_to === USER_AGENT_ID || item.lead_id === LEAD_1_ID,
      );
      expect(allAssignedToAgent).toBe(true);
    });
  });
});
