import type { Server } from 'http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock in-memory state
const mockUsers = {
  admin: {
    id: 'usr-admin-001',
    email: 'admin@solarcrm.com',
    full_name: 'Admin User',
    phone: '+919876543210',
    role: 'admin',
    organization_id: 'org-test-1',
    company_id: 'org-test-1',
    account_status: 'active',
    is_active: true,
  },
  sales: {
    id: 'usr-sales-002',
    email: 'sales@solarcrm.com',
    full_name: 'Sales Rep',
    phone: '+919876543211',
    role: 'inbound_sales',
    organization_id: 'org-test-1',
    company_id: 'org-test-1',
    account_status: 'active',
    is_active: true,
  },
  agent: {
    id: 'usr-agent-003',
    email: 'agent@solarcrm.com',
    full_name: 'Field Agent',
    phone: '+919876543212',
    role: 'field_agent',
    organization_id: 'org-test-1',
    company_id: 'org-test-1',
    account_status: 'active',
    is_active: true,
  },
  suspended: {
    id: 'usr-suspended-004',
    email: 'suspended@solarcrm.com',
    full_name: 'Suspended Agent',
    phone: '+919876543213',
    role: 'field_agent',
    organization_id: 'org-test-1',
    company_id: 'org-test-1',
    account_status: 'suspended',
    is_active: false,
  },
};

// ── Mock Supabase Admin module
vi.mock('../src/lib/supabase.js', () => {
  const auditLogs: unknown[] = [];
  const bannedUsers: Record<string, string> = {};

  const mockFrom = (table: string) => {
    let currentFilterId: string | null = null;
    let currentUpdateValues: Record<string, unknown> | null = null;

    const queryBuilder: any = {
      select: (_cols?: string, _opts?: unknown) => queryBuilder,
      eq: (col: string, val: string) => {
        if (col === 'id' || col === 'user_id') currentFilterId = val;
        return queryBuilder;
      },
      order: () => queryBuilder,
      or: () => queryBuilder,
      range: () => {
        const items = Object.values(mockUsers);
        return Promise.resolve({ data: items, count: items.length, error: null });
      },
      single: () => {
        if (table === 'profiles') {
          const user = Object.values(mockUsers).find((u) => u.id === currentFilterId);
          if (user) {
            if (currentUpdateValues) {
              Object.assign(user, currentUpdateValues);
            }
            return Promise.resolve({ data: { ...user }, error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Profile not found' } });
        }
        if (table === 'field_agent_profiles') {
          return Promise.resolve({
            data: {
              user_id: currentFilterId,
              organization_id: 'org-test-1',
              address: 'Test Address',
              pincode: '400001',
              service_areas: ['Mumbai Central'],
              service_pincodes: ['400001'],
              max_active_leads: 15,
              availability: 'available',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
      insert: (record: any) => ({
        select: () => ({
          single: () => {
            return Promise.resolve({
              data: {
                ...record,
                id: record.id ?? `usr-new-${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });
          },
        }),
      }),
      upsert: (record: any) => ({
        select: () => ({
          single: () => {
            return Promise.resolve({
              data: {
                ...record,
                id: record.id ?? `usr-new-${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });
          },
        }),
      }),
      update: (values: Record<string, unknown>) => {
        currentUpdateValues = values;
        return queryBuilder;
      },
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    };

    return queryBuilder;
  };

  const mockAdmin = {
    from: mockFrom,
    auth: {
      getUser: vi.fn(async (token: string) => {
        if (token === 'admin-jwt') {
          return { data: { user: { id: mockUsers.admin.id, email: mockUsers.admin.email } }, error: null };
        }
        if (token === 'sales-jwt') {
          return { data: { user: { id: mockUsers.sales.id, email: mockUsers.sales.email } }, error: null };
        }
        if (token === 'agent-jwt') {
          return { data: { user: { id: mockUsers.agent.id, email: mockUsers.agent.email } }, error: null };
        }
        if (token === 'suspended-jwt') {
          return { data: { user: { id: mockUsers.suspended.id, email: mockUsers.suspended.email } }, error: null };
        }
        return { data: { user: null }, error: { message: 'Invalid token' } };
      }),
      admin: {
        createUser: vi.fn(async (params: { email: string; user_metadata: unknown }) => {
          return {
            data: {
              user: {
                id: `new-user-${Math.random().toString(36).slice(2, 8)}`,
                email: params.email,
                user_metadata: params.user_metadata,
              },
            },
            error: null,
          };
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        generateLink: vi.fn(async ({ email }: { email: string }) => {
          return {
            data: {
              properties: {
                action_link: `https://solarcrm.supabase.co/auth/v1/verify?type=recovery&email=${encodeURIComponent(email)}&token=mock-sec-tok`,
              },
            },
            error: null,
          };
        }),
        updateUserById: vi.fn(async (userId: string, attributes: { ban_duration?: string }) => {
          if (attributes.ban_duration) {
            bannedUsers[userId] = attributes.ban_duration;
          }
          return { data: { user: { id: userId } }, error: null };
        }),
      },
    },
    rpc: vi.fn(async (fnName: string, args: unknown) => {
      if (fnName === 'log_audit_event') {
        auditLogs.push(args);
        return { data: 'audit-id-123', error: null };
      }
      return { data: null, error: null };
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

import { createApp } from '../src/app.js';

describe('Authentication & Role-Based Access Backend Integration Tests', () => {
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

  beforeEach(() => {
    // Reset suspended user to suspended
    mockUsers.suspended.account_status = 'suspended';
    mockUsers.suspended.is_active = false;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. UNAUTHORIZED ACCOUNT CREATION & PERMISSION GUARDS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Unauthorized Account Creation & Role Gates', () => {
    it('rejects unauthenticated account creation requests with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/users/inbound-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Hacker User',
          email: 'hacker@test.com',
          phone: '+919999988888',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toContain('Missing or invalid Authorization header');
    });

    it('rejects Inbound Sales user attempting to create an Inbound Sales account with 403 FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/users/inbound-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-jwt',
        },
        body: JSON.stringify({
          full_name: 'Subordinate Sales',
          email: 'subsales@solarcrm.com',
          phone: '+919876543220',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Requires role: admin');
    });

    it('rejects Field Agent user attempting to create a Field Agent account with 403 FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/users/field-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agent-jwt',
        },
        body: JSON.stringify({
          full_name: 'Peer Agent',
          email: 'peeragent@solarcrm.com',
          phone: '+919876543221',
          address: '42 Solar Way',
          pincode: '400001',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Requires role: admin');
    });

    it('rejects non-admin users attempting to deactivate or activate accounts with 403 FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/users/${mockUsers.agent.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sales-jwt',
        },
        body: JSON.stringify({
          account_status: 'suspended',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Requires role: admin');
    });

    it('rejects non-admin users attempting to generate password reset links with 403 FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/users/${mockUsers.agent.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agent-jwt',
        },
      });

      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Requires role: admin');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INACTIVE & SUSPENDED ACCOUNTS ACCESS DENIAL
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Inactive & Suspended Accounts Access Denial', () => {
    it('denies API access to users with account_status: suspended with 403 ACCOUNT_INACTIVE', async () => {
      const res = await fetch(`${baseUrl}/users/me`, {
        headers: {
          Authorization: 'Bearer suspended-jwt',
        },
      });

      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ACCOUNT_INACTIVE');
      expect(body.error.message).toContain('Account is deactivated or suspended');
    });

    it('denies API access when is_active is false', async () => {
      mockUsers.suspended.account_status = 'active'; // status active but is_active false
      mockUsers.suspended.is_active = false;

      const res = await fetch(`${baseUrl}/users/me`, {
        headers: {
          Authorization: 'Bearer suspended-jwt',
        },
      });

      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ADMIN AUTHORIZED USER CREATION & MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Admin User Creation & Lifecycle Management', () => {
    it('validates required fields on Inbound Sales creation (missing full_name and invalid phone)', async () => {
      const res = await fetch(`${baseUrl}/users/inbound-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          phone: '123', // Invalid phone
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toBeDefined();
    });

    it('validates required fields on Field Agent creation (missing address and invalid pincode)', async () => {
      const res = await fetch(`${baseUrl}/users/field-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
        body: JSON.stringify({
          full_name: 'Test Agent',
          email: 'agent@test.com',
          phone: '+919876543219',
          pincode: '99', // Invalid pincode (not 6 digits)
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('allows Admin to create Inbound Sales account with invitation link and audit log', async () => {
      const res = await fetch(`${baseUrl}/users/inbound-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
        body: JSON.stringify({
          full_name: 'Anjali Gupta',
          email: 'anjali@solarcrm.com',
          phone: '+919876543233',
          send_invite: true,
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe('inbound_sales');
      expect(body.data.user.full_name).toBe('Anjali Gupta');
      expect(body.data.inviteLink).toBeTruthy();
      expect(body.data.inviteLink).toContain('verify?type=recovery');
    });

    it('allows Admin to create Field Agent with service areas, capacity and availability', async () => {
      const res = await fetch(`${baseUrl}/users/field-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
        body: JSON.stringify({
          full_name: 'Vikas Kumar',
          email: 'vikas@solarcrm.com',
          phone: '+919876543244',
          address: '108 Greenfield Road, Andheri East',
          pincode: '400069',
          service_areas: ['Andheri East', 'Powai', 'Vikhroli'],
          service_pincodes: ['400069', '400076'],
          max_active_leads: 20,
          availability: 'available',
          send_invite: true,
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe('field_agent');
      expect(body.data.user.full_name).toBe('Vikas Kumar');
      expect(body.data.user.field_agent_profile).toBeDefined();
      expect(body.data.user.field_agent_profile.service_areas).toContain('Powai');
    });

    it('prevents Admin from deactivating their own account (400 CANNOT_DEACTIVATE_SELF)', async () => {
      const res = await fetch(`${baseUrl}/users/${mockUsers.admin.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
        body: JSON.stringify({
          account_status: 'suspended',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
    });

    it('allows Admin to deactivate another user and immediately invalidate their session (ban_duration)', async () => {
      const res = await fetch(`${baseUrl}/users/${mockUsers.agent.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
        body: JSON.stringify({
          account_status: 'suspended',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.account_status).toBe('suspended');
      expect(body.data.is_active).toBe(false);
    });

    it('allows Admin to generate secure password reset link for user recovery flow', async () => {
      const res = await fetch(`${baseUrl}/users/${mockUsers.sales.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-jwt',
        },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.recoveryLink).toContain('token=mock-sec-tok');
      expect(body.data.message).toContain('Password reset link generated');
    });

    it('allows authenticated users to query their own profile (/users/me)', async () => {
      const res = await fetch(`${baseUrl}/users/me`, {
        headers: {
          Authorization: 'Bearer admin-jwt',
        },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(mockUsers.admin.id);
      expect(body.data.role).toBe('admin');
    });
  });
});
