import type { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const USER_ADMIN_ID = '00000000-0000-0000-0000-000000000011';
const USER_SALES_ID = '00000000-0000-0000-0000-000000000012';
const USER_AGENT_ID = '00000000-0000-0000-0000-000000000013';

const LEAD_ID = '00000000-0000-0000-0000-000000000101';

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
    office_name: 'Headquarters & Experience Center',
    address: 'Sunbeam Solar Towers, Tech Park Road',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682024',
    phone: '+91 484 290 8800',
    email: 'kochi@sunbeamsolar.in',
    is_headquarters: true,
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    organization_id: ORG_ID,
    office_name: 'Regional Operations Office',
    address: '2nd Floor, Energy Plaza, MG Road',
    city: 'Trivandrum',
    state: 'Kerala',
    pincode: '695001',
    phone: '+91 471 230 4455',
    email: 'trivandrum@sunbeamsolar.in',
    is_headquarters: false,
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
    branch_name: 'Edappally Branch, Kochi',
    upi_id: 'sunbeam.solar@hdfcbank',
    is_primary: true,
  },
];

let testBOMComponents = [
  {
    id: '40000000-0000-0000-0000-000000000011',
    organization_id: ORG_ID,
    name: 'Solar PV Modules — Tier-1 Mono PERC/TOPCon Half-Cut',
    component_type: 'solar_panel',
    default_unit: 'Nos',
    default_unit_price: 24000,
    description: 'Tier-1 high efficiency solar photovoltaic modules',
    sort_order: 1,
    is_active: true,
  },
  {
    id: '40000000-0000-0000-0000-000000000012',
    organization_id: ORG_ID,
    name: 'Solar Inverter — Grid-Tied/Hybrid Inverter',
    component_type: 'inverter',
    default_unit: 'Set',
    default_unit_price: 45000,
    description: 'High efficiency solar grid-tied string inverter',
    sort_order: 2,
    is_active: true,
  },
];

let testLeads = [
  {
    id: LEAD_ID,
    organization_id: ORG_ID,
    customer_name: 'Vikram Mehta',
    phone: '+919876543210',
    email: 'vikram@example.com',
    status: 'site_visit_completed',
    area: 'Edappally',
    city: 'Kochi',
    pincode: '682024',
    address: 'Plot 42, Green Avenue, Edappally',
  },
];

let testQuotations: any[] = [];
let testQuotationItems: any[] = [];

// Mock Supabase
vi.mock('../src/lib/supabase.js', () => {
  const mockFrom = (table: string) => {
    let currentFilters: Record<string, any> = {};
    let isSingle = false;
    let maybeSingle = false;
    let limitCount: number | null = null;
    let orderCol: string | null = null;
    let orderAsc: boolean = true;
    let rangeFrom: number = 0;
    let rangeTo: number = 999;

    const builder: any = {
      select: (_cols?: string, opts?: any) => {
        if (opts?.count === 'exact' && opts?.head === true) {
          const countBuilder: any = {
            eq: (col: string, val: any) => {
              currentFilters[col] = val;
              return countBuilder;
            },
            ilike: () => countBuilder,
            then: (resolve: any) => {
              let items: any[] = [];
              if (table === 'company_offices') items = testOffices;
              else if (table === 'quotations') items = testQuotations;
              const filtered = currentFilters['organization_id']
                ? items.filter((it) => it.organization_id === currentFilters['organization_id'])
                : items;
              return resolve({ count: filtered.length, error: null });
            },
          };
          return countBuilder;
        }
        return builder;
      },
      eq: (col: string, val: any) => {
        currentFilters[col] = val;
        return builder;
      },
      neq: () => builder,
      ilike: () => builder,
      or: () => builder,
      order: (col: string, opts?: any) => {
        orderCol = col;
        orderAsc = opts?.ascending !== false;
        return builder;
      },
      range: (from: number, to: number) => {
        rangeFrom = from;
        rangeTo = to;
        return builder;
      },
      limit: (count: number) => {
        limitCount = count;
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
      insert: (recordOrRecords: any) => {
        const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
        const insertedList: any[] = [];

        for (const item of records) {
          const newItem = {
            id: item.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          };

          if (table === 'quotations') {
            testQuotations.push(newItem);
          } else if (table === 'quotation_items') {
            testQuotationItems.push(newItem);
          } else if (table === 'company_offices') {
            testOffices.push(newItem);
          } else if (table === 'company_bank_accounts') {
            testBankAccounts.push(newItem);
          } else if (table === 'default_quote_components') {
            testBOMComponents.push(newItem);
          }
          insertedList.push(newItem);
        }

        return {
          select: () => ({
            single: () => Promise.resolve({ data: insertedList[0], error: null }),
            then: (resolve: any) => resolve({ data: insertedList, error: null }),
          }),
          then: (resolve: any) => resolve({ data: insertedList, error: null }),
        };
      },
      update: (updates: any) => {
        const updateBuilder: any = {
          eq: (col: string, val: any) => {
            currentFilters[col] = val;
            return updateBuilder;
          },
          select: () => updateBuilder,
          single: () => updateBuilder,
          then: (resolve: any) => {
            let updatedItem: any = null;
            if (table === 'quotations') {
              const target = testQuotations.find((q) => q.id === currentFilters['id'] || (currentFilters['id'] === undefined && q.organization_id === currentFilters['organization_id']));
              if (target) {
                Object.assign(target, updates);
                updatedItem = target;
              }
            } else if (table === 'company_settings') {
              Object.assign(testCompanySettings, updates);
              updatedItem = testCompanySettings;
            } else if (table === 'company_offices') {
              const target = testOffices.find((o) => o.id === currentFilters['id']);
              if (target) {
                Object.assign(target, updates);
                updatedItem = target;
              }
            } else if (table === 'company_bank_accounts') {
              const target = testBankAccounts.find((b) => b.id === currentFilters['id']);
              if (target) {
                Object.assign(target, updates);
                updatedItem = target;
              }
            } else if (table === 'leads') {
              const target = testLeads.find((l) => l.id === currentFilters['id']);
              if (target) {
                Object.assign(target, updates);
                updatedItem = target;
              }
            }
            return resolve({ data: updatedItem, error: null });
          },
        };
        return updateBuilder;
      },
      delete: () => ({
        eq: (col: string, val: any) => ({
          eq: (col2: string, val2: any) => {
            if (table === 'quotation_items') {
              testQuotationItems = testQuotationItems.filter((it) => it.quotation_id !== val);
            } else if (table === 'company_offices') {
              testOffices = testOffices.filter((o) => o.id !== val);
            } else if (table === 'company_bank_accounts') {
              testBankAccounts = testBankAccounts.filter((b) => b.id !== val);
            } else if (table === 'default_quote_components') {
              testBOMComponents = testBOMComponents.filter((c) => c.id !== val);
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
      then: (resolve: any) => {
        let result: any = null;

        if (table === 'company_settings') {
          result = isSingle || maybeSingle ? testCompanySettings : [testCompanySettings];
        } else if (table === 'company_offices') {
          let list = [...testOffices];
          if (limitCount) list = list.slice(0, limitCount);
          result = isSingle ? list[0] : list;
        } else if (table === 'company_bank_accounts') {
          let list = [...testBankAccounts];
          if (currentFilters['is_primary']) list = list.filter((b) => b.is_primary);
          result = isSingle || maybeSingle ? list[0] || null : list;
        } else if (table === 'default_quote_components') {
          result = [...testBOMComponents];
        } else if (table === 'leads') {
          const l = testLeads.find((it) => it.id === currentFilters['id']);
          result = isSingle ? l || null : testLeads;
        } else if (table === 'quotations') {
          let list = [...testQuotations];
          if (currentFilters['id']) {
            const q = list.find((it) => it.id === currentFilters['id']);
            if (q) {
              const enriched = {
                ...q,
                lead: testLeads.find((l) => l.id === q.lead_id),
                items: testQuotationItems.filter((it) => it.quotation_id === q.id),
              };
              result = enriched;
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
        } else if (table === 'profiles') {
          const p = sampleProfiles.find((it) => it.id === currentFilters['id']);
          result = isSingle ? p || null : sampleProfiles;
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
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getUser: (token: string) => {
          if (token === 'admin-token') return Promise.resolve({ data: { user: { id: USER_ADMIN_ID, email: 'admin@sunbeam.example' } }, error: null });
          if (token === 'sales-token') return Promise.resolve({ data: { user: { id: USER_SALES_ID, email: 'rohit.sales@sunbeam.example' } }, error: null });
          if (token === 'agent-token') return Promise.resolve({ data: { user: { id: USER_AGENT_ID, email: 'amit.agent@sunbeam.example' } }, error: null });
          return Promise.resolve({ data: { user: null }, error: new Error('Invalid token') });
        },
      },
    },
  };
});

// Import createApp after mocking
const { createApp } = await import('../src/app.js');

describe('PROMPT 9 — Complete Solar Quotation & Company Branding Module', () => {
  let app: any;
  let server: Server;
  let baseUrl: string;

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

  // ─── A. Company Settings & Branding ──────────────────────────────────────────
  describe('Company Branding & Settings Management', () => {
    it('allows admin to fetch company branding, warranties, and tax rates', async () => {
      const res = await fetch(`${baseUrl}/api/v1/settings`, {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.company_name).toBe('Sunbeam Solar Systems Pvt Ltd');
      expect(json.data.performance_warranty_years).toBe(25);
      expect(json.data.inverter_warranty_years).toBe(5);
    });

    it('allows admin to update warranties and GST tax rates', async () => {
      const res = await fetch(`${baseUrl}/api/v1/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagline: 'Leading Rooftop Solar EPC in Kerala',
          inverter_warranty_years: 7,
          kseb_charges: 3000,
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.tagline).toBe('Leading Rooftop Solar EPC in Kerala');
      expect(json.data.inverter_warranty_years).toBe(7);
      expect(json.data.kseb_charges).toBe(3000);
    });

    it('allows inbound sales to view settings, but forbids non-admin from updating settings', async () => {
      const getRes = await fetch(`${baseUrl}/api/v1/settings`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(getRes.status).toBe(200);

      const patchRes = await fetch(`${baseUrl}/api/v1/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company_name: 'Hacked Name' }),
      });
      expect(patchRes.status).toBe(403);
    });
  });

  // ─── B. Office Locations & Bank Account Privacy Guard ────────────────────────
  describe('Office Locations (Min 1, Max 6) & Bank Accounts Privacy', () => {
    it('returns configured office locations with phone and address for footer rendering', async () => {
      const res = await fetch(`${baseUrl}/api/v1/settings/offices`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(2);
      expect(json.data[0].office_name).toBe('Headquarters & Experience Center');
    });

    it('enforces bank account privacy: non-admin cannot access bank accounts endpoint', async () => {
      // Salesperson attempts to call /settings/bank-accounts directly
      const salesRes = await fetch(`${baseUrl}/api/v1/settings/bank-accounts`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(salesRes.status).toBe(403);

      // Field agent attempts to call /settings/bank-accounts
      const agentRes = await fetch(`${baseUrl}/api/v1/settings/bank-accounts`, {
        headers: { Authorization: 'Bearer agent-token' },
      });
      expect(agentRes.status).toBe(403);

      // Only authorized admin can manage bank accounts
      const adminRes = await fetch(`${baseUrl}/api/v1/settings/bank-accounts`, {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(adminRes.status).toBe(200);
      const json = await adminRes.json();
      expect(json.data.length).toBe(1);
      expect(json.data[0].bank_name).toBe('HDFC Bank Ltd');
      expect(json.data[0].account_number).toBe('50200088991122');
    });
  });

  // ─── C. Default Bill of Materials (BOM) Library ──────────────────────────────
  describe('Default Bill of Materials (BOM) Components', () => {
    it('fetches pre-seeded default BOM components library for quotation builder', async () => {
      const res = await fetch(`${baseUrl}/api/v1/settings/bom-components`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBeGreaterThanOrEqual(2);
      expect(json.data[0].name).toContain('Solar PV Modules');
    });
  });

  // ─── D. Quotation Builder, Calculations, Versioning & PDF ────────────────────
  describe('Quotation Builder, Server Calculations & Lifecycle', () => {
    let createdQuotationId: string;

    it('forbids field agents from creating quotations (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/quotations`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer agent-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: LEAD_ID,
          system_capacity_kw: 5,
          items: [
            {
              component_name: 'Solar Panels',
              quantity: 10,
              unit: 'Nos',
              unit_price: 15000,
            },
          ],
        }),
      });
      expect(res.status).toBe(403);
    });

    it('creates quotation with server-calculated totals, advance splits, and company snapshot', async () => {
      const payload = {
        lead_id: LEAD_ID,
        title: '5kW On-Grid Rooftop Solar Proposal',
        system_capacity_kw: 5.4,
        phase: '3-Phase',
        system_type: 'On-Grid',
        discount_amount: 5000,
        gst_rate: 13.8,
        kseb_charges: 2500,
        advance_percentage: 20,
        items: [
          {
            component_name: 'Solar PV Modules — Tier-1 Mono PERC/TOPCon Half-Cut',
            component_type: 'solar_panel',
            specifications: '540Wp Bifacial Dual-Glass',
            quantity: 10,
            unit: 'Nos',
            unit_price: 15000,
            sort_order: 1,
          },
          {
            component_name: 'Solar Inverter — Grid-Tied 5kW 3-Phase',
            component_type: 'inverter',
            quantity: 1,
            unit: 'Set',
            unit_price: 45000,
            sort_order: 2,
          },
          {
            component_name: 'Installation & Commissioning',
            component_type: 'installation',
            quantity: 1,
            unit: 'Job',
            unit_price: 20000,
            sort_order: 3,
          },
        ],
      };

      const res = await fetch(`${baseUrl}/api/v1/quotations`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.quotation_number).toMatch(/^SUN-\d{6}-\d{4}$/);
      expect(json.data.version).toBe(1);
      expect(json.data.status).toBe('draft');

      // Subtotal = (10 * 15000) + 45000 + 20000 = 150000 + 45000 + 20000 = 215,000.00
      expect(json.data.subtotal).toBe(215000);
      // Discount = 5000.00
      expect(json.data.discount_amount).toBe(5000);
      // Taxable Value = 215,000 - 5,000 = 210,000.00
      expect(json.data.taxable_value).toBe(210000);
      // GST @ 13.80% on 210,000 = 28,980.00
      expect(json.data.tax_amount).toBe(28980);
      // Grand Total = 210,000 + 28,980 + 2,500 = 241,480.00
      expect(json.data.total_amount).toBe(241480);
      // 20% Advance = 48,296.00
      expect(json.data.advance_amount).toBe(48296);
      // 80% Balance = 193,184.00
      expect(json.data.balance_amount).toBe(193184);

      // Verify company snapshot was saved
      expect(json.data.company_snapshot).toBeDefined();
      expect(json.data.company_snapshot.settings.company_name).toBe('Sunbeam Solar Systems Pvt Ltd');
      expect(json.data.company_snapshot.offices.length).toBe(2);

      createdQuotationId = json.data.id;
    });

    it('fetches quotation details with items and customer information', async () => {
      const res = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}`, {
        headers: { Authorization: 'Bearer sales-token' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(createdQuotationId);
      expect(json.data.lead.customer_name).toBe('Vikram Mehta');
      expect(json.data.items.length).toBe(3);
    });

    it('issues quotation and locks in status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/status`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'issued', notes: 'Quotation verified by engineering lead' }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('issued');
    });

    it('prevents direct editing of issued quotation to guarantee audit immutability', async () => {
      const res = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discount_amount: 15000,
        }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('CANNOT_EDIT_ISSUED_QUOTATION');
    });

    it('revises quotation: marks v1 as revised and creates v2 with updated items and calculations', async () => {
      const revisePayload = {
        notes: 'Customer requested 6kW upgrade and additional panels',
        changes: {
          title: '6kW Rooftop Solar Proposal (Rev 2)',
          system_capacity_kw: 6.48,
          discount_amount: 8000,
          items: [
            {
              component_name: 'Solar PV Modules — Tier-1 Mono PERC/TOPCon Half-Cut',
              component_type: 'solar_panel',
              quantity: 12, // Increased from 10 to 12
              unit: 'Nos',
              unit_price: 15000,
              sort_order: 1,
            },
            {
              component_name: 'Solar Inverter — Grid-Tied 6kW 3-Phase',
              component_type: 'inverter',
              quantity: 1,
              unit: 'Set',
              unit_price: 52000,
              sort_order: 2,
            },
            {
              component_name: 'Installation & Commissioning',
              component_type: 'installation',
              quantity: 1,
              unit: 'Job',
              unit_price: 22000,
              sort_order: 3,
            },
          ],
        },
      };

      const res = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/revise`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(revisePayload),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.version).toBe(2);
      expect(json.data.status).toBe('draft');
      expect(json.data.parent_quotation_id).toBe(createdQuotationId);
      expect(json.data.is_latest).toBe(true);

      // Verify v2 calculations:
      // Subtotal = (12 * 15000) + 52000 + 22000 = 180000 + 52000 + 22000 = 254,000.00
      expect(json.data.subtotal).toBe(254000);
      expect(json.data.discount_amount).toBe(8000);
      // Taxable value = 254000 - 8000 = 246,000.00
      expect(json.data.taxable_value).toBe(246000);

      // Check that original v1 is now marked 'revised' and not latest
      const v1 = testQuotations.find((q) => q.id === createdQuotationId);
      expect(v1.status).toBe('revised');
      expect(v1.is_latest).toBe(false);
    });

    it('marks quotation as sent and updates lead status to quotation_sent', async () => {
      const res = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/status`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer sales-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' }),
      });
      expect(res.status).toBe(200);

      const targetLead = testLeads.find((l) => l.id === LEAD_ID);
      expect(targetLead.status).toBe('quotation_sent');
    });

    it('generates a valid, professional A4 PDF stream with branding, BOM table, and office footers', async () => {
      const res = await fetch(`${baseUrl}/api/v1/quotations/${createdQuotationId}/pdf`, {
        headers: { Authorization: 'Bearer sales-token' },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/pdf');
      expect(res.headers.get('content-disposition')).toContain('inline; filename="Quotation_');

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Verify PDF magic header
      expect(buffer.length).toBeGreaterThan(1000);
      const pdfHeader = buffer.subarray(0, 5).toString('utf-8');
      expect(pdfHeader).toBe('%PDF-');
    });
  });
});
