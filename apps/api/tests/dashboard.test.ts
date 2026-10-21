import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// ── Deterministic Sample Test Data
const ORG_ID = '00000000-0000-0000-0000-000000000001';

const sampleProfiles = [
  {
    id: 'usr-admin-1',
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'admin@sunbeam.example',
    full_name: 'Aditi Deshmukh (Admin)',
    role: 'admin',
    account_status: 'active',
    is_active: true,
  },
  {
    id: 'usr-sales-1',
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'rohit.sales@sunbeam.example',
    full_name: 'Rohit Joshi (Sales)',
    role: 'inbound_sales',
    account_status: 'active',
    is_active: true,
  },
  {
    id: 'usr-agent-1',
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'amit.agent@sunbeam.example',
    full_name: 'Amit Patil (Agent 1)',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
  {
    id: 'usr-agent-2',
    organization_id: ORG_ID,
    company_id: ORG_ID,
    email: 'suresh.agent@sunbeam.example',
    full_name: 'Suresh More (Agent 2)',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
  },
];

const now = new Date();
const todayIso = now.toISOString();
const yesterdayIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const tomorrowIso = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

// 10 Deterministic Sample Leads
const sampleLeads = [
  {
    id: 'lead-001',
    organization_id: ORG_ID,
    customer_name: 'Ramesh Patel',
    phone: '+919876500001',
    status: 'new',
    temperature: 'hot',
    lead_source: 'Meta Ads',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: null,
    created_at: yesterdayIso,
  },
  {
    id: 'lead-002',
    organization_id: ORG_ID,
    customer_name: 'Sneha Kulkarni',
    phone: '+919876500002',
    status: 'contacted',
    temperature: 'warm',
    lead_source: 'Tata Solar',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-1',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-003',
    organization_id: ORG_ID,
    customer_name: 'Ganesh Industries',
    phone: '+919876500003',
    status: 'site_visit_scheduled',
    temperature: 'hot',
    lead_source: 'JustDial',
    enquiry_type: 'commercial',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-1',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-004',
    organization_id: ORG_ID,
    customer_name: 'Dr. Anand Mehta',
    phone: '+919876500004',
    status: 'site_visit_completed',
    temperature: 'warm',
    lead_source: 'Meta Ads',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-1',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-005',
    organization_id: ORG_ID,
    customer_name: 'Pooja Hegde',
    phone: '+919876500005',
    status: 'quotation_sent',
    temperature: 'warm',
    lead_source: 'Website',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-1',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-006',
    organization_id: ORG_ID,
    customer_name: 'Vikram Shinde',
    phone: '+919876500006',
    status: 'won',
    temperature: 'hot',
    lead_source: 'Referral',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-1',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-007',
    organization_id: ORG_ID,
    customer_name: 'Apex Agro Farm',
    phone: '+919876500007',
    status: 'won',
    temperature: 'hot',
    lead_source: 'Tata Solar',
    enquiry_type: 'agricultural',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-2',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-008',
    organization_id: ORG_ID,
    customer_name: 'Kiran Desai',
    phone: '+919876500008',
    status: 'lost',
    temperature: 'cold',
    lead_source: 'Cold Call',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: 'usr-agent-1',
    created_at: yesterdayIso,
  },
  {
    id: 'lead-009',
    organization_id: ORG_ID,
    customer_name: 'Ajay Solanki',
    phone: '+919876500009',
    status: 'disqualified',
    temperature: 'unclassified',
    lead_source: 'JustDial',
    enquiry_type: 'residential',
    inbound_sales_id: 'usr-sales-1',
    assigned_field_agent_id: null,
    created_at: yesterdayIso,
  },
  {
    id: 'lead-010',
    organization_id: ORG_ID,
    customer_name: 'Green Tech Hub',
    phone: '+919876500010',
    status: 'new',
    temperature: 'hot',
    lead_source: 'Meta Ads',
    enquiry_type: 'commercial',
    inbound_sales_id: null,
    assigned_field_agent_id: null,
    created_at: todayIso,
  },
];

// Sample Follow-Ups
const sampleFollowUps = [
  {
    id: 'fu-001',
    organization_id: ORG_ID,
    lead_id: 'lead-001',
    assigned_to: 'usr-sales-1',
    due_at: todayIso, // Due today
    completion_status: 'pending',
    notes: 'Call customer about initial solar requirements',
  },
  {
    id: 'fu-002',
    organization_id: ORG_ID,
    lead_id: 'lead-002',
    assigned_to: 'usr-sales-1',
    due_at: yesterdayIso, // Overdue
    completion_status: 'pending',
    notes: 'Follow up on preliminary discussion',
  },
  {
    id: 'fu-003',
    organization_id: ORG_ID,
    lead_id: 'lead-003',
    assigned_to: 'usr-agent-1',
    due_at: tomorrowIso, // Future
    completion_status: 'pending',
    notes: 'Verify roof access permission',
  },
  {
    id: 'fu-004',
    organization_id: ORG_ID,
    lead_id: 'lead-004',
    assigned_to: 'usr-sales-1',
    due_at: yesterdayIso,
    completion_status: 'completed',
    notes: 'Completed qualification call',
  },
];

// Sample Site Visits
const sampleSiteVisits = [
  {
    id: 'sv-001',
    organization_id: ORG_ID,
    lead_id: 'lead-003',
    field_agent_id: 'usr-agent-1',
    scheduled_at: todayIso, // Today's visit
    visit_status: 'scheduled',
    roof_suitability: null,
    recommended_system_capacity_kw: null,
  },
  {
    id: 'sv-002',
    organization_id: ORG_ID,
    lead_id: 'lead-004',
    field_agent_id: 'usr-agent-1',
    scheduled_at: yesterdayIso,
    visit_status: 'completed',
    roof_suitability: 'good',
    recommended_system_capacity_kw: 5.0,
  },
  {
    id: 'sv-003',
    organization_id: ORG_ID,
    lead_id: 'lead-005',
    field_agent_id: 'usr-agent-1',
    scheduled_at: tomorrowIso,
    visit_status: 'scheduled',
    roof_suitability: null,
    recommended_system_capacity_kw: null,
  },
  {
    id: 'sv-004',
    organization_id: ORG_ID,
    lead_id: 'lead-006',
    field_agent_id: 'usr-agent-1',
    scheduled_at: yesterdayIso,
    visit_status: 'completed',
    roof_suitability: null, // Pending site report!
    recommended_system_capacity_kw: null,
  },
];

// Sample Quotations (including 2 versions for lead-006 to test deduplication!)
const sampleQuotations = [
  {
    id: 'qt-001',
    organization_id: ORG_ID,
    lead_id: 'lead-006', // Won lead
    created_by: 'usr-sales-1',
    quotation_number: 'Q-2026-001',
    version: 1,
    status: 'revised',
    total_amount: 250000,
    created_at: yesterdayIso,
  },
  {
    id: 'qt-002',
    organization_id: ORG_ID,
    lead_id: 'lead-006', // Won lead — accepted final revision (₹240,000)
    created_by: 'usr-sales-1',
    quotation_number: 'Q-2026-001',
    version: 2,
    status: 'accepted',
    total_amount: 240000,
    created_at: todayIso,
  },
  {
    id: 'qt-003',
    organization_id: ORG_ID,
    lead_id: 'lead-007', // Won lead (₹360,000)
    created_by: 'usr-sales-1',
    quotation_number: 'Q-2026-002',
    version: 1,
    status: 'accepted',
    total_amount: 360000,
    created_at: todayIso,
  },
  {
    id: 'qt-004',
    organization_id: ORG_ID,
    lead_id: 'lead-005', // In negotiation (₹180,000)
    created_by: 'usr-sales-1',
    quotation_number: 'Q-2026-003',
    version: 1,
    status: 'sent',
    total_amount: 180000,
    created_at: todayIso,
  },
];

// ── Mock Supabase Admin module
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilterCol: string | null = null;
    let currentFilterVal: any = null;

    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => {
        currentFilterCol = col;
        currentFilterVal = val;
        return builder;
      },
      gte: () => builder,
      lte: () => builder,
      lt: () => builder,
      in: () => builder,
      is: () => builder,
      or: () => builder,
      order: () => builder,
      range: () => builder,
      single: () => {
        if (table === 'profiles') {
          const item = sampleProfiles.find((p) => p.id === currentFilterVal) ?? sampleProfiles[0];
          return Promise.resolve({ data: item, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then(onFulfilled?: any, onRejected?: any) {
        let result: any = { data: [], count: 0, error: null };
        if (table === 'leads') {
          if (currentFilterCol === 'assigned_field_agent_id') {
            const filtered = sampleLeads.filter((l) => l.assigned_field_agent_id === currentFilterVal);
            result = { data: filtered, count: filtered.length, error: null };
          } else {
            result = { data: sampleLeads, count: sampleLeads.length, error: null };
          }
        } else if (table === 'follow_ups') {
          if (currentFilterCol === 'assigned_to') {
            const filtered = sampleFollowUps.filter((f) => f.assigned_to === currentFilterVal);
            result = { data: filtered, count: filtered.length, error: null };
          } else {
            result = { data: sampleFollowUps, count: sampleFollowUps.length, error: null };
          }
        } else if (table === 'site_visits') {
          if (currentFilterCol === 'field_agent_id') {
            const filtered = sampleSiteVisits.filter((v) => v.field_agent_id === currentFilterVal);
            result = { data: filtered, count: filtered.length, error: null };
          } else {
            result = { data: sampleSiteVisits, count: sampleSiteVisits.length, error: null };
          }
        } else if (table === 'quotations') {
          result = { data: sampleQuotations, count: sampleQuotations.length, error: null };
        } else if (table === 'profiles') {
          result = { data: sampleProfiles, count: sampleProfiles.length, error: null };
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
            return { data: { user: { id: 'usr-admin-1', email: 'admin@sunbeam.example' } }, error: null };
          }
          if (token === 'sales-token') {
            return { data: { user: { id: 'usr-sales-1', email: 'rohit.sales@sunbeam.example' } }, error: null };
          }
          if (token === 'agent1-token') {
            return { data: { user: { id: 'usr-agent-1', email: 'amit.agent@sunbeam.example' } }, error: null };
          }
          if (token === 'agent2-token') {
            return { data: { user: { id: 'usr-agent-2', email: 'suresh.agent@sunbeam.example' } }, error: null };
          }
          return { data: { user: null }, error: { message: 'Invalid token' } };
        }),
      },
    },
  };
});

import { createApp } from '../src/app.js';

describe('PROMPT 4 — Dashboard API Calculations & Role Scoping Tests', () => {
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
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ADMIN DASHBOARD METRICS & EXPLICIT FORMULAS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Admin Dashboard Calculations & Data Accuracy', () => {
    it('calculates exact KPI values from database without hardcoded values', async () => {
      const res = await fetch(`${baseUrl}/dashboard/admin`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      const kpis = json.data.kpis;

      // 10 sample leads
      expect(kpis.total_leads).toBe(10);
      // fresh leads (lead-001, lead-010)
      expect(kpis.fresh_leads).toBe(2);
      // contacted leads (lead-002)
      expect(kpis.contacted_leads).toBe(1);
      // hot (001, 003, 006, 007, 010 = 5) + warm (002, 004, 005 = 3) = 8
      expect(kpis.hot_leads).toBe(5);
      expect(kpis.warm_leads).toBe(3);
      expect(kpis.hot_and_warm_leads).toBe(8);

      // won leads: lead-006, lead-007 = 2
      expect(kpis.won_leads).toBe(2);
      // lost / disqualified leads: lead-008 (lost), lead-009 (disqualified) = 2
      expect(kpis.lost_leads).toBe(2);

      // Conversion rate formula: (won_leads / total_leads) * 100
      // 2 / 10 * 100 = 20.0%
      expect(kpis.conversion_rate).toBe(20.0);

      // Win-loss rate formula: won / (won + lost) * 100
      // 2 / (2 + 2) * 100 = 50.0%
      expect(kpis.win_loss_rate).toBe(50.0);

      // Follow-ups due today and overdue
      expect(kpis.follow_ups_due_today).toBe(1); // fu-001
      expect(kpis.overdue_follow_ups).toBe(1); // fu-002

      // Site visits scheduled
      expect(kpis.site_visits_scheduled).toBe(2); // sv-001, sv-003

      // Quotations sent (sent, viewed, accepted)
      expect(kpis.quotations_sent).toBe(3); // qt-002 (accepted), qt-003 (accepted), qt-004 (sent)
    });

    it('avoids double-counting won revenue across multiple quotation revisions', async () => {
      const res = await fetch(`${baseUrl}/dashboard/admin`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      const json = await res.json();
      const kpis = json.data.kpis;

      // lead-006 has two quotes: v1 (₹250,000, revised) and v2 (₹240,000, accepted).
      // lead-007 has one quote: v1 (₹360,000, accepted).
      // Expected won revenue: 240,000 + 360,000 = ₹600,000 (NOT 250k + 240k + 360k = 850k!)
      expect(kpis.won_revenue).toBe(600000);

      // Average deal size: 600,000 / 2 won leads = 300,000
      expect(kpis.average_deal_size).toBe(300000);
    });

    it('returns all required chart structures for admin visualizations', async () => {
      const res = await fetch(`${baseUrl}/dashboard/admin`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      const json = await res.json();
      const charts = json.data.charts;

      // 1. Leads created over time
      expect(Array.isArray(charts.leads_over_time)).toBe(true);
      expect(charts.leads_over_time.length).toBeGreaterThan(0);

      // 2. Leads by status and source
      expect(Array.isArray(charts.leads_by_status)).toBe(true);
      expect(charts.leads_by_status.some((s: any) => s.status === 'won')).toBe(true);
      expect(Array.isArray(charts.leads_by_source)).toBe(true);
      expect(charts.leads_by_source.some((s: any) => s.source === 'Meta Ads')).toBe(true);

      // 3. Salesperson performance
      expect(Array.isArray(charts.salesperson_performance)).toBe(true);
      const salesRep = charts.salesperson_performance.find((r: any) => r.id === 'usr-sales-1');
      expect(salesRep).toBeDefined();
      expect(salesRep.leads_handled).toBeGreaterThan(0);
      expect(salesRep.won_revenue).toBe(600000);

      // 4. Field agent performance
      expect(Array.isArray(charts.field_agent_performance)).toBe(true);
      const agent1 = charts.field_agent_performance.find((a: any) => a.id === 'usr-agent-1');
      expect(agent1).toBeDefined();
      expect(agent1.visits_completed).toBe(2);

      // 5. Conversion funnel
      expect(Array.isArray(charts.conversion_funnel)).toBe(true);
      expect(charts.conversion_funnel[0].stage).toBe('Total Leads');
      expect(charts.conversion_funnel[0].count).toBe(10);
      expect(charts.conversion_funnel[4].stage).toBe('Won Deals');
      expect(charts.conversion_funnel[4].count).toBe(2);

      // 6. Follow-up completion stats
      expect(charts.follow_up_completion).toBeDefined();
      expect(charts.follow_up_completion.completed).toBe(1);
      expect(charts.follow_up_completion.pending).toBe(3);
    });

    it('supports team comparison filters via team_member_id query parameter', async () => {
      const res = await fetch(`${baseUrl}/dashboard/admin?team_member_id=usr-agent-1`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INBOUND SALES DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Inbound Sales Dashboard Calculations & Pipeline', () => {
    it('returns salesperson-specific pipeline, follow-ups, and urgent tasks', async () => {
      const res = await fetch(`${baseUrl}/dashboard/inbound-sales`, {
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      const data = json.data;

      // KPIs
      expect(data.kpis.my_total_leads).toBeGreaterThan(0);
      expect(data.kpis.assigned_follow_ups).toBe(2); // fu-001, fu-002
      expect(data.kpis.overdue_tasks).toBe(1); // fu-002

      // Urgent follow-ups list
      expect(Array.isArray(data.urgent_follow_ups)).toBe(true);
      expect(data.urgent_follow_ups.length).toBeGreaterThan(0);
      expect(data.urgent_follow_ups[0].customer_name).toBeDefined();

      // Recent hot leads list
      expect(Array.isArray(data.recent_hot_leads)).toBe(true);
      expect(data.recent_hot_leads.some((l: any) => l.temperature === 'hot')).toBe(true);

      // Funnel
      expect(Array.isArray(data.funnel)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. FIELD AGENT DASHBOARD & STRICT PRIVACY ENFORCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Field Agent Dashboard & Privacy Enforcement', () => {
    it('returns assigned leads, visits schedule, and pending reports for the agent', async () => {
      const res = await fetch(`${baseUrl}/dashboard/field-agent`, {
        headers: { Authorization: 'Bearer agent1-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      const data = json.data;

      // KPIs for agent 1
      expect(data.kpis.today_visits).toBe(1); // sv-001
      expect(data.kpis.upcoming_visits).toBe(1); // sv-003
      expect(data.kpis.completed_visits).toBe(2); // sv-002, sv-004
      expect(data.kpis.pending_site_reports).toBe(1); // sv-004 has null roof suitability

      // Schedule lists
      expect(Array.isArray(data.today_schedule)).toBe(true);
      expect(data.today_schedule.length).toBe(1);
      expect(Array.isArray(data.pending_reports)).toBe(true);
      expect(data.pending_reports.length).toBe(1);
    });

    it('strictly denies a field agent from accessing another agent private performance data (403)', async () => {
      // Agent 1 attempts to pass ?agent_id=usr-agent-2
      const res = await fetch(`${baseUrl}/dashboard/field-agent?agent_id=usr-agent-2`, {
        headers: { Authorization: 'Bearer agent1-token' },
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
      expect(json.error.message).toContain("cannot view other agents' private performance data");
    });

    it('allows Admin to inspect any individual field agent dashboard', async () => {
      const res = await fetch(`${baseUrl}/dashboard/field-agent?agent_id=usr-agent-2`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. DRILL-DOWN ENDPOINT
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Drill-Down Underlying Records Endpoint', () => {
    it('returns paginated underlying records for fresh_leads metric', async () => {
      const res = await fetch(`${baseUrl}/dashboard/drill-down?metric=fresh_leads&page=1&pageSize=10`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toBeDefined();
      expect(json.data.total).toBe(10); // Mock returns sample leads
      expect(json.data.page).toBe(1);
    });

    it('returns underlying records for overdue_follow_ups metric', async () => {
      const res = await fetch(`${baseUrl}/dashboard/drill-down?metric=overdue_follow_ups`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toBeDefined();
    });

    it('returns underlying records for site_visits_scheduled metric', async () => {
      const res = await fetch(`${baseUrl}/dashboard/drill-down?metric=site_visits_scheduled`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toBeDefined();
    });

    it('denies field agents from drilling down into another agent records (403)', async () => {
      const res = await fetch(
        `${baseUrl}/dashboard/drill-down?metric=fresh_leads&team_member_id=usr-agent-2`,
        {
          headers: { Authorization: 'Bearer agent1-token' },
        },
      );

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });
});
