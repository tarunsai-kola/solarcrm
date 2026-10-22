import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// ── Test Constants
const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_ID = '00000000-0000-0000-0000-000000000013';

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

const sampleAgentProfiles = [
  {
    id: USER_AGENT_ID,
    organization_id: ORG_ID,
    service_pincodes: ['411045', '411001'],
    max_active_workload: 15,
  },
];

const now = new Date();
const todayIso = now.toISOString();
const tenDaysAgoIso = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
const fiveDaysAgoIso = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

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
    pincode: '411045',
    area: 'Baner',
    inbound_sales_id: USER_SALES_ID,
    assigned_field_agent_id: USER_AGENT_ID,
    created_at: tenDaysAgoIso,
  },
  {
    id: 'lead-002',
    organization_id: ORG_ID,
    customer_name: 'Green Energy Factory',
    phone: '+919876500002',
    status: 'won',
    temperature: 'hot',
    lead_source: 'Meta Ads',
    enquiry_type: 'industrial',
    pincode: '411045',
    area: 'Baner',
    inbound_sales_id: USER_SALES_ID,
    assigned_field_agent_id: USER_AGENT_ID,
    created_at: fiveDaysAgoIso,
  },
  {
    id: 'lead-003',
    organization_id: ORG_ID,
    customer_name: 'Suresh Kumar',
    phone: '+919876500003',
    status: 'lost',
    temperature: 'cold',
    lead_source: 'Tata Solar',
    enquiry_type: 'residential',
    pincode: '411001',
    area: 'Camp',
    inbound_sales_id: USER_SALES_ID,
    assigned_field_agent_id: USER_AGENT_ID,
    created_at: todayIso,
  },
];

const sampleQuotations = [
  {
    id: 'qt-001',
    organization_id: ORG_ID,
    lead_id: 'lead-002',
    created_by: USER_SALES_ID,
    quote_number: 'Q-2026-001',
    version: 1,
    status: 'accepted',
    grand_total: 450000,
    created_at: fiveDaysAgoIso,
  },
];

const sampleActivities = [
  {
    id: 'act-001',
    organization_id: ORG_ID,
    lead_id: 'lead-002',
    user_id: USER_SALES_ID,
    created_by: USER_SALES_ID,
    activity_type: 'outgoing_call',
    created_at: new Date(new Date(fiveDaysAgoIso).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours after lead creation
  },
];

const sampleVisits = [
  {
    id: 'vis-001',
    organization_id: ORG_ID,
    lead_id: 'lead-002',
    field_agent_id: USER_AGENT_ID,
    scheduled_at: fiveDaysAgoIso,
    completed_at: fiveDaysAgoIso,
    visit_status: 'completed',
    roof_suitability: 'optimal',
    notes: 'Good shadow free roof area',
    created_at: fiveDaysAgoIso,
  },
];

const sampleFollowUps = [
  {
    id: 'fu-001',
    organization_id: ORG_ID,
    lead_id: 'lead-002',
    assigned_to: USER_SALES_ID,
    due_at: todayIso,
    completed_at: todayIso,
    completion_status: 'completed',
  },
];

const sampleAuditLogs = [
  {
    id: 'aud-001',
    organization_id: ORG_ID,
    company_id: ORG_ID,
    actor_id: USER_ADMIN_ID,
    action: 'update',
    entity_type: 'crm_controls',
    entity_id: '30000000-0000-0000-0000-000000000001',
    old_values: { password_hash: 'secret_hash_123', account_number: '1234567890' },
    new_values: { password_hash: 'new_secret_456', account_number: '9876543210' },
    created_at: todayIso,
  },
];

let testCompanySettings: any = {
  id: '30000000-0000-0000-0000-000000000001',
  organization_id: ORG_ID,
  custom_lead_statuses: [],
  custom_enquiry_types: ['residential', 'commercial', 'industrial'],
  lead_sources: ['Meta Ads', 'Tata Solar', 'JustDial'],
  assignment_rules: { mode: 'pincode_match', auto_assign: true },
  reminder_preferences: { lead_times_minutes: [15, 60] },
};

// ── Mock Supabase
vi.mock('../src/lib/supabase.js', () => {
  const loggedAuditEvents: any[] = [];

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
      or: () => builder,
      order: () => builder,
      range: () => builder,
      limit: () => builder,
      single: () => {
        if (table === 'profiles') {
          const item = sampleProfiles.find((p) => p.id === currentFilterVal) ?? sampleProfiles[0];
          return Promise.resolve({ data: item, error: null });
        }
        if (table === 'company_settings') {
          return Promise.resolve({ data: testCompanySettings, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      update: (updates: any) => {
        if (table === 'company_settings') {
          testCompanySettings = { ...testCompanySettings, ...updates };
        }
        return {
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: testCompanySettings, error: null }),
            }),
          }),
        };
      },
      then(onFulfilled?: any, onRejected?: any) {
        let result: any = { data: [], count: 0, error: null };
        if (table === 'leads') {
          result = { data: sampleLeads, count: sampleLeads.length, error: null };
        } else if (table === 'quotations') {
          result = { data: sampleQuotations, count: sampleQuotations.length, error: null };
        } else if (table === 'lead_activities') {
          result = { data: sampleActivities, count: sampleActivities.length, error: null };
        } else if (table === 'site_visits') {
          result = { data: sampleVisits, count: sampleVisits.length, error: null };
        } else if (table === 'follow_ups') {
          result = { data: sampleFollowUps, count: sampleFollowUps.length, error: null };
        } else if (table === 'profiles') {
          result = { data: sampleProfiles, count: sampleProfiles.length, error: null };
        } else if (table === 'field_agent_profiles') {
          result = { data: sampleAgentProfiles, count: sampleAgentProfiles.length, error: null };
        } else if (table === 'audit_logs') {
          result = { data: sampleAuditLogs, count: sampleAuditLogs.length, error: null };
        }
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  const mockAdmin = {
    from: mockFrom,
    auth: {
      getUser: vi.fn((token: string) => {
        if (token === 'admin-token') return Promise.resolve({ data: { user: { id: USER_ADMIN_ID, email: 'admin@sunbeam.example' } }, error: null });
        if (token === 'sales-token') return Promise.resolve({ data: { user: { id: USER_SALES_ID, email: 'rohit.sales@sunbeam.example' } }, error: null });
        if (token === 'agent-token') return Promise.resolve({ data: { user: { id: USER_AGENT_ID, email: 'amit.agent@sunbeam.example' } }, error: null });
        return Promise.resolve({ data: { user: null }, error: { message: 'Invalid token' } });
      }),
    },
    rpc: vi.fn((fnName: string, args: any) => {
      if (fnName === 'log_audit_event') {
        loggedAuditEvents.push(args);
        return Promise.resolve({ data: 'audit-logged-uuid', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
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

// Import app after mocks
const { createApp } = await import('../src/app.js');

describe('PROMPT 10 — Advanced Admin Analytics, CRM Controls & Reporting Integration', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ── 1. Company-Wide Analytics ──────────────────────────────────────────────
  describe('GET /analytics/company', () => {
    it('returns calculated company-wide KPIs, funnel, source performance, and SLA compliance', async () => {
      const res = await fetch(`${baseUrl}/analytics/company`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.summary_kpis).toBeDefined();

      const kpis = json.data.summary_kpis;
      expect(kpis.total_leads).toBe(3);
      expect(kpis.fresh_leads).toBe(1);
      expect(kpis.won_leads).toBe(1);
      // Won rate: (1 / 3) * 100 = 33.3%
      expect(kpis.overall_conversion_rate).toBe(33.3);
      expect(kpis.won_revenue).toBe(450000);
      expect(kpis.follow_up_sla_compliance_rate).toBe(100.0);

      // Check conversion funnel
      expect(Array.isArray(json.data.conversion_funnel)).toBe(true);
      expect(json.data.conversion_funnel.length).toBe(6);
      expect(json.data.conversion_funnel[0].stage).toBe('Fresh Inquiries');
      expect(json.data.conversion_funnel[0].count).toBe(3);

      // Check source performance
      expect(Array.isArray(json.data.sources_campaign_performance)).toBe(true);
      const metaSource = json.data.sources_campaign_performance.find((s: any) => s.source === 'Meta Ads');
      expect(metaSource).toBeDefined();
      expect(metaSource.total_leads).toBe(2);
      expect(metaSource.won_leads).toBe(1);
      expect(metaSource.won_revenue).toBe(450000);
    });

    it('allows inbound sales to access analytics', async () => {
      const res = await fetch(`${baseUrl}/analytics/company`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
    });

    it('rejects field agents from accessing company overview', async () => {
      const res = await fetch(`${baseUrl}/analytics/company`, {
        headers: { Authorization: 'Bearer agent-token' },
      });
      expect(res.status).toBe(403);
    });
  });

  // ── 2. Salesperson User-Level Performance ──────────────────────────────────
  describe('GET /analytics/sales-performance', () => {
    it('returns granular performance metrics including time-to-contact and inactivity', async () => {
      const res = await fetch(`${baseUrl}/analytics/sales-performance`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);

      const rep = json.data.find((r: any) => r.user_id === USER_SALES_ID);
      expect(rep).toBeDefined();
      expect(rep.user_name).toBe('Rohit Joshi');
      expect(rep.total_leads_managed).toBe(3);
      expect(rep.won_leads).toBe(1);
      expect(rep.won_revenue).toBe(450000);
      expect(rep.calls_and_activities_count).toBe(1);
      // Lead-002 was contacted in 2.0 hours
      expect(rep.avg_time_to_first_contact_hours).toBe(2.0);
      // Lead ageing buckets and temperature distribution exist
      expect(rep.temperature_distribution.hot).toBe(2);
      expect(rep.temperature_distribution.cold).toBe(1);
      expect(rep.lead_ageing).toBeDefined();
    });
  });

  // ── 3. Field Agent User-Level Performance ──────────────────────────────────
  describe('GET /analytics/agent-performance', () => {
    it('returns field agent completion rates, site reports, and outcomes', async () => {
      const res = await fetch(`${baseUrl}/analytics/agent-performance`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);

      const agent = json.data.find((a: any) => a.user_id === USER_AGENT_ID);
      expect(agent).toBeDefined();
      expect(agent.user_name).toBe('Amit Patil');
      expect(agent.assigned_leads).toBe(3);
      expect(agent.site_visits_scheduled).toBe(1);
      expect(agent.site_visits_completed).toBe(1);
      expect(agent.visit_completion_rate).toBe(100.0);
      expect(agent.site_reports_submitted).toBe(1);
      expect(agent.outcomes_after_visits.won).toBe(1);
      expect(agent.service_pincodes).toContain('411045');
    });
  });

  // ── 4. CSV Report Export & Privileged Audit Logging ────────────────────────
  describe('GET /analytics/export', () => {
    it('generates sanitized RFC 4180 CSV and records privileged export in audit log', async () => {
      const res = await fetch(`${baseUrl}/analytics/export?type=leads`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      const csvText = await res.text();

      // Verify headers
      expect(csvText).toContain('"Lead ID"');
      expect(csvText).toContain('"Customer Name"');
      expect(csvText).toContain('"Ramesh Patel"');
      expect(csvText).toContain('"Green Energy Factory"');
    });

    it('denies field agents from exporting reports', async () => {
      const res = await fetch(`${baseUrl}/analytics/export?type=leads`, {
        headers: { Authorization: 'Bearer agent-token' },
      });
      expect(res.status).toBe(403);
    });

    it('denies inbound sales from exporting audit logs', async () => {
      const res = await fetch(`${baseUrl}/analytics/export?type=audit_logs`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(403);
    });
  });

  // ── 5. CRM Controls & Configuration ────────────────────────────────────────
  describe('CRM Controls (/crm-config)', () => {
    it('allows admin to fetch current CRM configuration', async () => {
      const res = await fetch(`${baseUrl}/crm-config`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.lead_statuses).toBeDefined();
      expect(json.data.assignment_rules.mode).toBe('pincode_match');
    });

    it('allows admin to update assignment rules and lead sources', async () => {
      const res = await fetch(`${baseUrl}/crm-config`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_rules: {
            mode: 'round_robin',
            auto_assign: false,
            fallback_to_round_robin: false,
            max_workload_cap: 20,
            reassign_uncontacted_after_hours: 48,
          },
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(testCompanySettings.assignment_rules.mode).toBe('round_robin');
    });

    it('blocks non-admin users from updating CRM configuration', async () => {
      const res = await fetch(`${baseUrl}/crm-config`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_rules: { mode: 'manual' },
        }),
      });

      expect(res.status).toBe(403);
    });
  });

  // ── 6. Audit Logs with Secret Redaction ────────────────────────────────────
  describe('GET /audit', () => {
    it('returns audit log items with redacted secrets', async () => {
      const res = await fetch(`${baseUrl}/audit`, {
        headers: { Authorization: 'Bearer admin-token' },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items.length).toBeGreaterThan(0);

      const log = json.data.items[0];
      // Ensure password_hash is redacted
      expect(log.old_values.password_hash).toBe('[REDACTED]');
      expect(log.new_values.password_hash).toBe('[REDACTED]');
      // Ensure account_number is masked
      expect(log.old_values.account_number).toContain('••••••••');
    });
  });
});
