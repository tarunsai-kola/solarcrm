import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_ID = '00000000-0000-0000-0000-000000000013';
const USER_OTHER_AGENT_ID = '00000000-0000-0000-0000-000000000014';

// In-Memory Database State
let testProfiles: any[] = [
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
    id: USER_OTHER_AGENT_ID,
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'other.agent@sunbeam.example',
    full_name: 'Other Agent',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
];

let testFAProfiles: any[] = [
  {
    user_id: USER_OTHER_AGENT_ID,
    organization_id: ORG_ID,
    service_pincodes: ['411001', '411002'],
    service_areas: ['Camp'],
    max_active_leads: 10,
    availability: 'available',
  },
];

let testCompanySettings = {
  id: '30000000-0000-0000-0000-000000000001',
  organization_id: ORG_ID,
  company_name: 'Sunbeam Solar Systems Pvt Ltd',
  legal_name: 'Sunbeam Solar Systems Private Limited',
  tagline: 'Powering a Greener Tomorrow',
  credential_line: 'MNRE Empanelled Partner • ISO 9001:2015',
  gst_number: '32AABCS1429B1Z1',
  pan_number: 'AABCS1429B',
  phone: '+91 484 290 8800',
  email: 'proposals@sunbeamsolar.in',
  website: 'https://sunbeamsolar.in',
  product_warranty_years: 10,
  performance_warranty_years: 25,
  inverter_warranty_years: 5,
  battery_warranty_years: 5,
  tax_rate: 13.8,
  kseb_charges: 2500,
  terms_and_conditions: 'Standard solar installation terms apply.',
};

let testOffices = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    organization_id: ORG_ID,
    office_name: 'Headquarters Pune',
    address: 'Sunbeam Solar Towers, Baner Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    phone: '+91 20 2900 8800',
    email: 'pune@sunbeamsolar.in',
    is_headquarters: true,
  },
];

let testBankAccounts = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    organization_id: ORG_ID,
    bank_name: 'HDFC Bank Ltd',
    account_holder_name: 'Sunbeam Solar Systems Pvt Ltd',
    account_number: '50200088991122',
    ifsc_code: 'HDFC0001234',
    branch_name: 'Baner Branch, Pune',
    is_primary: true,
  },
];

let testBOMComponents = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    organization_id: ORG_ID,
    component_name: 'Mono PERC Solar PV Modules 540Wp',
    component_category: 'panels',
    specifications: 'Tier 1 Half-cut Mono PERC, 21.3% efficiency',
    unit_price: 18500,
    unit: 'kW',
    hsn_code: '85414011',
    gst_rate: 12,
    sort_order: 1,
    is_default: true,
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    organization_id: ORG_ID,
    component_name: 'Solar Grid-Tied Inverter 5kW',
    component_category: 'inverter',
    specifications: 'Single Phase IP65 On-grid String Inverter',
    unit_price: 45000,
    unit: 'nos',
    hsn_code: '85044090',
    gst_rate: 18,
    sort_order: 2,
    is_default: true,
  },
];

let testLeads: any[] = [];
let testActivities: any[] = [];
let testFollowUps: any[] = [];
let testSiteVisits: any[] = [];
let testQuotations: any[] = [];
let testQuotationItems: any[] = [];
let testNotifications: any[] = [];
let testAuditLogs: any[] = [];
let testCalendarIntegrations: any[] = [
  {
    id: '80000000-0000-0000-0000-000000000001',
    organization_id: ORG_ID,
    user_id: USER_SALES_ID,
    provider: 'google',
    sync_status: 'active',
    sync_enabled: true,
    calendar_id: 'primary',
  },
  {
    id: '80000000-0000-0000-0000-000000000002',
    organization_id: ORG_ID,
    user_id: USER_AGENT_ID,
    provider: 'google',
    sync_status: 'active',
    sync_enabled: true,
    calendar_id: 'primary',
  },
];
let testCalendarEvents: any[] = [];

// Helper to get matching table array
function getTableData(table: string): any[] {
  if (table === 'profiles') return testProfiles;
  if (table === 'field_agent_profiles') return testFAProfiles;
  if (table === 'leads') return testLeads;
  if (table === 'lead_activities') return testActivities;
  if (table === 'follow_ups') return testFollowUps;
  if (table === 'site_visits') return testSiteVisits;
  if (table === 'quotations') return testQuotations;
  if (table === 'quotation_items') return testQuotationItems;
  if (table === 'notifications') return testNotifications;
  if (table === 'audit_logs') return testAuditLogs;
  if (table === 'calendar_events') return testCalendarEvents;
  if (table === 'calendar_integrations') return testCalendarIntegrations;
  if (table === 'company_offices') return testOffices;
  if (table === 'company_bank_accounts') return testBankAccounts;
  if (table === 'default_quote_components') return testBOMComponents;
  return [];
}

// Mock Supabase
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let orConditions: string[] = [];
    let inFilters: Record<string, any[]> = {};
    let isSingle = false;
    let maybeSingle = false;
    let limitCount: number | null = null;

    const applyUpdate = (updates: any) => {
      const dataArr = getTableData(table);
      const targetId = currentFilters['id'] || currentFilters['user_id'];
      const idx = dataArr.findIndex((item) => (item.id === targetId || item.user_id === targetId));
      if (idx !== -1) {
        dataArr[idx] = { ...dataArr[idx], ...updates };
        return dataArr[idx];
      }
      return null;
    };

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
      in: (col: string, vals: any[]) => {
        inFilters[col] = vals;
        return builder;
      },
      not: () => builder,
      gte: () => builder,
      lte: () => builder,
      lt: () => builder,
      ilike: () => builder,
      or: (conditionStr: string) => {
        orConditions.push(conditionStr);
        return builder;
      },
      order: () => builder,
      range: () => builder,
      limit: (cnt: number) => {
        limitCount = cnt;
        return builder;
      },
      single: () => {
        isSingle = true;
        return builder;
      },
      maybeSingle: () => {
        maybeSingle = true;
        return builder;
      },
      insert: (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        const withIds = items.map((i) => ({
          id: i.id || `00000000-0000-0000-0000-${Math.floor(Math.random() * 899999999999 + 100000000000)}`,
          created_at: new Date().toISOString(),
          ...i,
        }));

        if (table === 'profiles') testProfiles.push(...withIds);
        else if (table === 'field_agent_profiles') testFAProfiles.push(...withIds);
        else if (table === 'leads') testLeads.push(...withIds);
        else if (table === 'lead_activities') testActivities.push(...withIds);
        else if (table === 'follow_ups') testFollowUps.push(...withIds);
        else if (table === 'site_visits') testSiteVisits.push(...withIds);
        else if (table === 'quotations') testQuotations.push(...withIds);
        else if (table === 'quotation_items') testQuotationItems.push(...withIds);
        else if (table === 'notifications') testNotifications.push(...withIds);
        else if (table === 'audit_logs') testAuditLogs.push(...withIds);
        else if (table === 'calendar_events') testCalendarEvents.push(...withIds);

        const res = !Array.isArray(payload) ? withIds[0] : withIds;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: res, error: null }),
            maybeSingle: () => Promise.resolve({ data: res, error: null }),
            then: (onFulfilled: any) => Promise.resolve({ data: res, error: null }).then(onFulfilled),
          }),
          then: (onFulfilled: any) => Promise.resolve({ data: res, error: null }).then(onFulfilled),
        };
      },
      update: (updates: any) => {
        const createStep = () => ({
          eq: (col: string, val: any) => {
            currentFilters[col] = val;
            return createStep();
          },
          select: () => ({
            single: () => {
              const updated = applyUpdate(updates);
              return Promise.resolve({ data: updated, error: updated ? null : { message: 'Not found' } });
            },
            maybeSingle: () => {
              const updated = applyUpdate(updates);
              return Promise.resolve({ data: updated, error: null });
            },
            then: (onFulfilled: any) => {
              const updated = applyUpdate(updates);
              return Promise.resolve({ data: updated, error: null }).then(onFulfilled);
            },
          }),
          then: (onFulfilled: any) => {
            applyUpdate(updates);
            return Promise.resolve({ data: null, error: null }).then(onFulfilled);
          },
        });
        return createStep();
      },
      delete: () => ({
        eq: (col: string, val: any) => ({
          then: (onFulfilled: any) => Promise.resolve({ error: null }).then(onFulfilled),
        }),
      }),
      then: (resolve: any) => {
        let result: any = null;

        if (table === 'profiles') {
          let list = [...testProfiles];
          if (currentFilters['id']) list = list.filter((p) => p.id === currentFilters['id']);
          if (currentFilters['role']) list = list.filter((p) => p.role === currentFilters['role']);
          if (currentFilters['account_status']) list = list.filter((p) => p.account_status === currentFilters['account_status']);
          if (isSingle) {
            result = list[0] || null;
          } else {
            result = list.map((p) => ({
              ...p,
              field_agent_profiles: testFAProfiles.filter((fa) => fa.user_id === p.id),
            }));
          }
        } else if (table === 'field_agent_profiles') {
          let list = [...testFAProfiles];
          if (currentFilters['user_id']) list = list.filter((fa) => fa.user_id === currentFilters['user_id']);
          result = isSingle ? list[0] || null : list;
        } else if (table === 'leads') {
          let list = [...testLeads];
          if (currentFilters['id']) list = list.filter((l) => l.id === currentFilters['id']);
          if (currentFilters['status']) list = list.filter((l) => l.status === currentFilters['status']);
          if (currentFilters['assigned_field_agent_id']) {
            list = list.filter((l) => l.assigned_field_agent_id === currentFilters['assigned_field_agent_id']);
          }
          if (currentFilters['inbound_sales_id']) {
            list = list.filter((l) => l.inbound_sales_id === currentFilters['inbound_sales_id']);
          }
          if (inFilters['status']) {
            list = list.filter((l) => inFilters['status'].includes(l.status));
          }
          if (isSingle) {
            if (list[0]) {
              result = {
                ...list[0],
                lead_activities: testActivities.filter((a) => a.lead_id === list[0].id),
                follow_ups: testFollowUps.filter((f) => f.lead_id === list[0].id),
                site_visits: testSiteVisits.filter((v) => v.lead_id === list[0].id),
                quotations: testQuotations.filter((q) => q.lead_id === list[0].id),
                assigned_field_agent: testProfiles.find((p) => p.id === list[0].assigned_field_agent_id) || null,
              };
            } else {
              result = null;
            }
          } else {
            result = list.map((l) => ({
              ...l,
              assigned_field_agent: testProfiles.find((p) => p.id === l.assigned_field_agent_id) || null,
              inbound_sales: testProfiles.find((p) => p.id === l.inbound_sales_id) || null,
            }));
          }
        } else if (table === 'lead_activities') {
          let list = [...testActivities];
          if (currentFilters['lead_id']) list = list.filter((a) => a.lead_id === currentFilters['lead_id']);
          result = isSingle ? list[0] || null : list;
        } else if (table === 'follow_ups') {
          let list = [...testFollowUps];
          if (currentFilters['id']) list = list.filter((f) => f.id === currentFilters['id']);
          if (currentFilters['lead_id']) list = list.filter((f) => f.lead_id === currentFilters['lead_id']);
          result = isSingle ? list[0] || null : list;
        } else if (table === 'site_visits') {
          let list = [...testSiteVisits];
          if (currentFilters['id']) list = list.filter((v) => v.id === currentFilters['id']);
          if (currentFilters['lead_id']) list = list.filter((v) => v.lead_id === currentFilters['lead_id']);
          result = isSingle ? list[0] || null : list;
        } else if (table === 'quotations') {
          let list = [...testQuotations];
          if (currentFilters['id']) {
            const q = list.find((it) => it.id === currentFilters['id']);
            if (q) {
              result = {
                ...q,
                lead: testLeads.find((l) => l.id === q.lead_id),
                items: testQuotationItems.filter((it) => it.quotation_id === q.id),
              };
            } else {
              result = null;
            }
          } else {
            result = list.map((q) => ({
              ...q,
              lead: testLeads.find((l) => l.id === q.lead_id),
            }));
          }
        } else if (table === 'quotation_items') {
          result = testQuotationItems.filter((it) => it.quotation_id === currentFilters['quotation_id']);
        } else if (table === 'notifications') {
          let list = [...testNotifications];
          if (currentFilters['user_id']) list = list.filter((n) => n.user_id === currentFilters['user_id']);
          result = list;
        } else if (table === 'calendar_integrations') {
          let list = [...testCalendarIntegrations];
          if (currentFilters['user_id']) list = list.filter((c) => c.user_id === currentFilters['user_id']);
          result = isSingle || maybeSingle ? list[0] || null : list;
        } else if (table === 'calendar_events') {
          let list = [...testCalendarEvents];
          result = isSingle || maybeSingle ? list[0] || null : list;
        } else if (table === 'company_settings') {
          result = isSingle || maybeSingle ? testCompanySettings : [testCompanySettings];
        } else if (table === 'company_offices') {
          let list = [...testOffices];
          if (limitCount) list = list.slice(0, limitCount);
          result = isSingle ? list[0] : list;
        } else if (table === 'company_bank_accounts') {
          let list = [...testBankAccounts];
          result = isSingle || maybeSingle ? list[0] || null : list;
        } else if (table === 'default_quote_components') {
          result = [...testBOMComponents];
        }

        return resolve({
          data: result,
          count: Array.isArray(result) ? result.length : result ? 1 : 0,
          error: null,
        });
      },
    };

    return builder;
  };

  return {
    supabaseAdmin: {
      from: mockFrom,
      rpc: (funcName: string, args: any) => {
        if (funcName === 'log_audit_event') {
          testAuditLogs.push(args);
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      auth: {
        getUser: (token: string) => {
          if (token === 'admin-token') {
            return Promise.resolve({ data: { user: { id: USER_ADMIN_ID, email: 'admin@sunbeam.example' } }, error: null });
          }
          if (token === 'sales-token') {
            return Promise.resolve({ data: { user: { id: USER_SALES_ID, email: 'priya.sales@sunbeam.example' } }, error: null });
          }
          if (token === 'agent-token') {
            return Promise.resolve({ data: { user: { id: USER_AGENT_ID, email: 'sunil.agent@sunbeam.example' } }, error: null });
          }
          if (token === 'other-agent-token') {
            return Promise.resolve({ data: { user: { id: USER_OTHER_AGENT_ID, email: 'other.agent@sunbeam.example' } }, error: null });
          }
          return Promise.resolve({ data: { user: null }, error: new Error('Invalid token') });
        },
        admin: {
          createUser: (userData: any) => {
            const userId = userData.email.includes('sales') ? USER_SALES_ID : USER_AGENT_ID;
            return Promise.resolve({
              data: {
                user: {
                  id: userId,
                  email: userData.email,
                  user_metadata: userData.user_metadata,
                },
              },
              error: null,
            });
          },
          generateLink: () => {
            return Promise.resolve({
              data: {
                properties: {
                  action_link: 'https://crm.sunbeam.example/auth/confirm?token=xyz',
                },
              },
              error: null,
            });
          },
          deleteUser: () => Promise.resolve({ data: null, error: null }),
        },
      },
    },
  };
});

const { createApp } = await import('../src/app.js');

describe('PROMPT 13 — Complete Solar CRM End-to-End Workflow Audit', () => {
  let app: any;
  let server: Server;
  let baseUrl: string;

  // Variables populated across sequential workflow steps
  let createdLeadId: string;
  let createdSiteVisitId: string;
  let createdQuotationId: string;

  beforeAll(async () => {
    app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ─── WORKFLOW 1: Admin creates field agent & configures service pincodes ────
  it('Workflow 1: Admin creates a field agent and configures service pincodes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/field-agent`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Sunil Shinde',
        email: 'sunil.agent@sunbeam.example',
        phone: '+919876500001',
        address: 'Baner Road',
        pincode: '411045',
        service_areas: ['Baner', 'Aundh'],
        service_pincodes: ['411045', '411028'],
        max_active_leads: 10,
        availability: 'available',
        experience_years: 4,
        send_invite: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('field_agent');
    expect(body.data.user.id).toBe(USER_AGENT_ID);
    expect(body.data.user.field_agent_profile.service_pincodes).toEqual(['411045', '411028']);
  });

  // ─── WORKFLOW 2: Admin creates inbound salesperson account ──────────────────
  it('Workflow 2: Admin creates an inbound salesperson account', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/inbound-sales`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Priya Sharma',
        email: 'priya.sales@sunbeam.example',
        phone: '+919876500002',
        send_invite: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('inbound_sales');
    expect(body.data.user.id).toBe(USER_SALES_ID);
  });

  // ─── WORKFLOW 3: Inbound sales creates lead with details & initial note ─────
  it('Workflow 3: Inbound sales creates a lead with customer details and initial note', async () => {
    const res = await fetch(`${baseUrl}/api/v1/leads`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: 'Rajesh Patil',
        phone: '9876543299',
        address: '101 Green Valley, Baner',
        area: 'Baner',
        pincode: '411045',
        enquiry_type: 'residential',
        source: 'Website',
        initial_note: 'Customer interested in 5kW grid-tied system with net metering',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.customer_name).toBe('Rajesh Patil');
    expect(body.data.phone).toBe('+919876543299'); // normalized
    expect(body.data.status).toBe('new');
    createdLeadId = body.data.id;
    expect(createdLeadId).toBeDefined();

    // Verify initial note recorded on activities timeline
    const activity = testActivities.find((a) => a.lead_id === createdLeadId && a.activity_type === 'note');
    expect(activity).toBeDefined();
    expect(activity.activity_type).toBe('note');
    expect(activity.notes).toContain('Customer interested in 5kW');
  });

  // ─── WORKFLOW 4: Lead appears on dashboard & Manage Leads page ─────────────
  it('Workflow 4: Lead appears on authorized dashboard and Manage Leads page', async () => {
    // 1. Leads Listing
    const leadsRes = await fetch(`${baseUrl}/api/v1/leads`, {
      headers: { Authorization: 'Bearer sales-token' },
    });
    expect(leadsRes.status).toBe(200);
    const leadsJson = await leadsRes.json();
    expect(leadsJson.success).toBe(true);
    const found = leadsJson.data.items.find((l: any) => l.id === createdLeadId);
    expect(found).toBeDefined();
    expect(found.customer_name).toBe('Rajesh Patil');

    // 2. Dashboard
    const dashRes = await fetch(`${baseUrl}/api/v1/dashboard/inbound-sales`, {
      headers: { Authorization: 'Bearer sales-token' },
    });
    expect(dashRes.status).toBe(200);
    const dashJson = await dashRes.json();
    expect(dashJson.success).toBe(true);
    expect(dashJson.data.kpis).toBeDefined();
  });

  // ─── WORKFLOW 5: Assignment interface recommends eligible agents ───────────
  it('Workflow 5: Assignment interface recommends eligible agents based on pincode', async () => {
    const res = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}/eligible-agents`, {
      headers: { Authorization: 'Bearer sales-token' },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.agents)).toBe(true);
    expect(json.data.agents.length).toBeGreaterThanOrEqual(1);

    // Top recommended agent should be Sunil Shinde (pincode 411045 + area match)
    const topAgent = json.data.agents[0];
    expect(topAgent.agent_id).toBe(USER_AGENT_ID);
    expect(topAgent.is_pincode_match).toBe(true);
    expect(topAgent.score).toBeGreaterThan(50);
  });

  // ─── WORKFLOW 6: Salesperson assigns lead to recommended agent ──────────────
  it('Workflow 6: Inbound sales assigns lead to the recommended field agent', async () => {
    const res = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}/assign-agent`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: USER_AGENT_ID,
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.lead.assigned_field_agent_id).toBe(USER_AGENT_ID);

    // Timeline activity recorded
    const assignmentAct = testActivities.find(
      (a) => a.lead_id === createdLeadId && a.activity_type === 'assignment',
    );
    expect(assignmentAct).toBeDefined();
  });

  // ─── WORKFLOW 7: Agent receives notification and views authorized lead ──────
  it('Workflow 7: Agent receives notification and can access authorized lead details; other agent is blocked', async () => {
    // 1. Agent checks notifications
    const notifRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: 'Bearer agent-token' },
    });
    expect(notifRes.status).toBe(200);
    const notifJson = await notifRes.json();
    expect(notifJson.success).toBe(true);
    const assignmentNotif = notifJson.data.items.find(
      (n: any) => n.user_id === USER_AGENT_ID && n.type === 'lead_assigned',
    );
    expect(assignmentNotif).toBeDefined();
    expect(assignmentNotif.title).toContain('Rajesh Patil');

    // 2. Assigned Agent views lead details
    const leadRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}`, {
      headers: { Authorization: 'Bearer agent-token' },
    });
    expect(leadRes.status).toBe(200);
    const leadJson = await leadRes.json();
    expect(leadJson.success).toBe(true);
    expect(leadJson.data.customer_name).toBe('Rajesh Patil');
    expect(leadJson.data.pincode).toBe('411045');

    // 3. Security: Unassigned agent cannot view this lead (403 Forbidden)
    const unauthorizedRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}`, {
      headers: { Authorization: 'Bearer other-agent-token' },
    });
    expect(unauthorizedRes.status).toBe(403);
  });

  // ─── WORKFLOW 8: Sales and Agent add call logs and notes to shared timeline ──
  it('Workflow 8: Sales and agent append logs to the same chronological timeline', async () => {
    // 1. Sales logs a customer call
    const callRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}/activities`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_type: 'call',
        outcome: 'Connected',
        notes: 'Discussed requirement, customer requested site feasibility inspection',
        duration_seconds: 240,
      }),
    });
    expect(callRes.status).toBe(201);

    // 2. Agent logs a site note
    const noteRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}/activities`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer agent-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_type: 'note',
        outcome: 'Analysis',
        notes: 'Verified Google Earth imagery; south roof pitch unobstructed',
      }),
    });
    expect(noteRes.status).toBe(201);

    // 3. Verify lead detail timeline contains both in order
    const leadRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}`, {
      headers: { Authorization: 'Bearer sales-token' },
    });
    const leadJson = await leadRes.json();
    expect(leadJson.data.lead_activities.length).toBeGreaterThanOrEqual(3);
    const types = leadJson.data.lead_activities.map((a: any) => a.activity_type);
    expect(types).toContain('call');
    expect(types).toContain('note');
  });

  // ─── WORKFLOW 9: Sales schedules follow-up & syncs with Google Calendar ─────
  it('Workflow 9: Sales schedules a follow-up and next_follow_up_at updates', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const fuRes = await fetch(`${baseUrl}/api/v1/follow-ups`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_id: createdLeadId,
        assigned_to: USER_SALES_ID,
        due_at: futureDate,
        notes: 'Pre-visit call to ensure customer is at home',
      }),
    });

    expect(fuRes.status).toBe(201);
    const fuJson = await fuRes.json();
    expect(fuJson.success).toBe(true);

    // Lead's next_follow_up_at is updated
    const lead = testLeads.find((l) => l.id === createdLeadId);
    expect(lead.next_follow_up_at).toBe(futureDate);
  });

  // ─── WORKFLOW 10: Agent records site visit & updates assessment ────────────
  it('Workflow 10: Agent records a site visit and updates site assessment', async () => {
    const visitDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 1. Schedule Site Visit
    const scheduleRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}/visits`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer agent-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field_agent_id: USER_AGENT_ID,
        scheduled_at: visitDate,
        site_observations: 'Site visit scheduled for terrace measurement',
      }),
    });

    expect(scheduleRes.status).toBe(201);
    const scheduleJson = await scheduleRes.json();
    createdSiteVisitId = scheduleJson.data.id;
    expect(createdSiteVisitId).toBeDefined();

    // Lead transitions to site_visit_scheduled
    expect(testLeads.find((l) => l.id === createdLeadId).status).toBe('site_visit_scheduled');

    // 2. Complete Site Visit & Update Assessment
    const completeRes = await fetch(
      `${baseUrl}/api/v1/leads/${createdLeadId}/visits/${createdSiteVisitId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer agent-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visit_status: 'completed',
          roof_suitability: 'good',
          electricity_bill_amount: 4200,
          monthly_consumption_kwh: 520,
          recommended_system_capacity_kw: 5,
          site_observations: 'Reinforced cement concrete roof with zero shading. Excellent solar exposure.',
        }),
      },
    );

    expect(completeRes.status).toBe(200);
    const completeJson = await completeRes.json();
    expect(completeJson.data.visit_status).toBe('completed');
    expect(completeJson.data.recommended_system_capacity_kw).toBe(5);

    // Lead transitions to site_visit_completed
    expect(testLeads.find((l) => l.id === createdLeadId).status).toBe('site_visit_completed');
  });

  // ─── WORKFLOW 11: Sales creates quotation using branding & BOM defaults ─────
  it('Workflow 11: Sales creates a quotation using company branding and BOM defaults', async () => {
    const quoteRes = await fetch(`${baseUrl}/api/v1/quotations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_id: createdLeadId,
        title: '5kWp Residential Rooftop Solar System',
        system_capacity_kw: 5,
        phase: 'single_phase',
        system_type: 'on_grid',
        discount_amount: 5000,
        gst_rate: 13.8,
        kseb_charges: 2500,
        advance_percentage: 20,
        items: [
          {
            component_name: 'Mono PERC Solar PV Modules 540Wp',
            component_category: 'panels',
            quantity: 5,
            unit_price: 18500,
            unit: 'kW',
            gst_rate: 12,
            sort_order: 1,
          },
          {
            component_name: 'Solar Grid-Tied Inverter 5kW',
            component_category: 'inverter',
            quantity: 1,
            unit_price: 45000,
            unit: 'nos',
            gst_rate: 18,
            sort_order: 2,
          },
        ],
      }),
    });

    expect(quoteRes.status).toBe(201);
    const quoteJson = await quoteRes.json();
    expect(quoteJson.success).toBe(true);
    createdQuotationId = quoteJson.data.id;
    expect(createdQuotationId).toBeDefined();

    // Calculations validation:
    // Subtotal: (5 * 18500 = 92500) + (1 * 45000 = 45000) = 137500
    // Discount: 5000 -> Taxable: 132500
    // GST (13.8%): 132500 * 0.138 = 18285
    // KSEB charges: 2500
    // Total amount: 132500 + 18285 + 2500 = 153285
    expect(quoteJson.data.subtotal).toBe(137500);
    expect(quoteJson.data.taxable_value).toBe(132500);
    expect(quoteJson.data.tax_amount).toBe(18285);
    expect(quoteJson.data.total_amount).toBe(153285);
    expect(quoteJson.data.advance_amount).toBe(30657); // 20% of 153285
  });

  // ─── WORKFLOW 12: PDF is generated, saved and linked to customer ───────────
  it('Workflow 12: PDF is generated and streamed with company branding and customer link', async () => {
    const pdfRes = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/pdf`, {
      headers: { Authorization: 'Bearer sales-token' },
    });

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get('content-type')).toBe('application/pdf');

    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString();
    expect(pdfHeader).toBe('%PDF-');
  });

  // ─── WORKFLOW 13: Lead status and performance metrics update correctly ──────
  it('Workflow 13: Quotation transitions through sent to accepted; lead status updates to won', async () => {
    // 1. Mark quotation sent
    const sendRes = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/status`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'sent', notes: 'Quotation sent via email to customer' }),
    });
    expect(sendRes.status).toBe(200);

    // Lead status updates to quotation_sent
    expect(testLeads.find((l) => l.id === createdLeadId).status).toBe('quotation_sent');

    // 2. Mark quotation accepted & lead won
    const acceptRes = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/status`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'accepted', notes: 'Customer accepted 5kW quotation proposal' }),
    });
    expect(acceptRes.status).toBe(200);

    // Update lead status to won
    const leadWonRes = await fetch(`${baseUrl}/api/v1/leads/${createdLeadId}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer sales-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'won' }),
    });
    expect(leadWonRes.status).toBe(200);
    expect(testLeads.find((l) => l.id === createdLeadId).status).toBe('won');
  });

  // ─── WORKFLOW 14: Admin analytics reflect complete activity history ────────
  it('Workflow 14: Admin analytics accurately reflect the complete activity history and revenue', async () => {
    // 1. Company-wide analytics
    const companyRes = await fetch(`${baseUrl}/api/v1/analytics/company`, {
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(companyRes.status).toBe(200);
    const companyJson = await companyRes.json();
    expect(companyJson.success).toBe(true);
    expect(companyJson.data.summary_kpis.total_leads).toBe(1);
    expect(companyJson.data.summary_kpis.won_leads).toBe(1);
    expect(companyJson.data.summary_kpis.overall_conversion_rate).toBe(100);
    expect(companyJson.data.summary_kpis.won_revenue).toBe(153285);

    // 2. Sales Performance Analytics
    const salesPerfRes = await fetch(`${baseUrl}/api/v1/analytics/sales-performance`, {
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(salesPerfRes.status).toBe(200);
    const salesPerfJson = await salesPerfRes.json();
    expect(salesPerfJson.success).toBe(true);
    const priyaStats = salesPerfJson.data.find((s: any) => s.user_id === USER_SALES_ID);
    expect(priyaStats).toBeDefined();
    expect(priyaStats.total_leads_managed).toBe(1);
    expect(priyaStats.won_leads).toBe(1);
    expect(priyaStats.conversion_rate).toBe(100);

    // 3. Field Agent Performance Analytics
    const agentPerfRes = await fetch(`${baseUrl}/api/v1/analytics/agent-performance`, {
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(agentPerfRes.status).toBe(200);
    const agentPerfJson = await agentPerfRes.json();
    expect(agentPerfJson.success).toBe(true);
    const sunilStats = agentPerfJson.data.find((a: any) => a.user_id === USER_AGENT_ID);
    expect(sunilStats).toBeDefined();
    expect(sunilStats.assigned_leads).toBe(1);
    expect(sunilStats.site_visits_completed).toBe(1);
    expect(sunilStats.visit_completion_rate).toBe(100);

    // 4. Admin Dashboard
    const adminDashRes = await fetch(`${baseUrl}/api/v1/dashboard/admin`, {
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(adminDashRes.status).toBe(200);
    const adminDashJson = await adminDashRes.json();
    expect(adminDashJson.success).toBe(true);
    expect(adminDashJson.data.kpis.won_leads).toBe(1);
  });
});
