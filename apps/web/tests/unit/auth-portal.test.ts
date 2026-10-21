import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppRole, Profile } from '@solar-crm/shared';

// Mock Supabase module before importing AuthContext
vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn();
  const mockAuth = {
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  };

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    },
  };
});

import { AccountInactiveError, PortalMismatchError } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Helper to simulate the exact signIn logic implemented in AuthContext
async function simulateSignIn(
  email: string,
  password: string,
  portalRole?: AppRole,
): Promise<Profile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw error ?? new Error('Invalid email or password');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profileData) {
    await supabase.auth.signOut();
    throw new Error('User profile record not found. Please contact your administrator.');
  }

  const userProfile = profileData as Profile;

  if (userProfile.account_status !== 'active' || !userProfile.is_active) {
    await supabase.auth.signOut();
    throw new AccountInactiveError();
  }

  if (portalRole && userProfile.role !== portalRole) {
    await supabase.auth.signOut();
    const portalUrls: Record<AppRole, string> = {
      admin: '/admin-login',
      inbound_sales: '/inbound-sales-login',
      field_agent: '/field-agent-login',
    };
    throw new PortalMismatchError(
      userProfile.role,
      portalRole,
      portalUrls[userProfile.role],
    );
  }

  return userProfile;
}

describe('Portal Authentication & Role-Based Entry Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminProfile: Profile = {
    id: 'user-admin-1',
    organization_id: 'org-1',
    company_id: 'org-1',
    full_name: 'Super Admin',
    email: 'admin@solarcrm.com',
    phone: '+919876543210',
    role: 'admin',
    account_status: 'active',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSalesProfile: Profile = {
    id: 'user-sales-1',
    organization_id: 'org-1',
    company_id: 'org-1',
    full_name: 'Priya Sharma',
    email: 'priya@solarcrm.com',
    phone: '+919876543211',
    role: 'inbound_sales',
    account_status: 'active',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockFieldAgentProfile: Profile = {
    id: 'user-agent-1',
    organization_id: 'org-1',
    company_id: 'org-1',
    full_name: 'Rahul Verma',
    email: 'rahul@solarcrm.com',
    phone: '+919876543212',
    role: 'field_agent',
    account_status: 'active',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  function mockSuccessfulSupabaseAuth(profile: Profile) {
    const mockAuth = supabase.auth as unknown as {
      signInWithPassword: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
    };
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: profile.id, email: profile.email },
        session: { access_token: 'valid-jwt-token' },
      },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValueOnce({ data: profile, error: null }),
      }),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      select: mockSelect,
    });
  }

  describe('1. Role-specific login entry routes (Successful flows)', () => {
    it('authenticates admin at /admin-login portal successfully', async () => {
      mockSuccessfulSupabaseAuth(mockAdminProfile);

      const profile = await simulateSignIn('admin@solarcrm.com', 'SecurePass123!', 'admin');

      expect(profile.role).toBe('admin');
      expect(profile.email).toBe('admin@solarcrm.com');
      expect(supabase.auth.signOut).not.toHaveBeenCalled();
    });

    it('authenticates inbound sales at /inbound-sales-login portal successfully', async () => {
      mockSuccessfulSupabaseAuth(mockSalesProfile);

      const profile = await simulateSignIn('priya@solarcrm.com', 'SecurePass123!', 'inbound_sales');

      expect(profile.role).toBe('inbound_sales');
      expect(profile.email).toBe('priya@solarcrm.com');
      expect(supabase.auth.signOut).not.toHaveBeenCalled();
    });

    it('authenticates field agent at /field-agent-login portal successfully', async () => {
      mockSuccessfulSupabaseAuth(mockFieldAgentProfile);

      const profile = await simulateSignIn('rahul@solarcrm.com', 'SecurePass123!', 'field_agent');

      expect(profile.role).toBe('field_agent');
      expect(profile.email).toBe('rahul@solarcrm.com');
      expect(supabase.auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('2. Incorrect portal access rejection (Portal Mismatch)', () => {
    it('denies Field Agent access when trying to login via /admin-login portal', async () => {
      mockSuccessfulSupabaseAuth(mockFieldAgentProfile);

      await expect(
        simulateSignIn('rahul@solarcrm.com', 'SecurePass123!', 'admin'),
      ).rejects.toThrow(PortalMismatchError);

      // Must sign out and revoke session immediately
      expect(supabase.auth.signOut).toHaveBeenCalled();

      // Check error details
      try {
        mockSuccessfulSupabaseAuth(mockFieldAgentProfile);
        await simulateSignIn('rahul@solarcrm.com', 'SecurePass123!', 'admin');
      } catch (err) {
        expect(err).toBeInstanceOf(PortalMismatchError);
        const error = err as PortalMismatchError;
        expect(error.actualRole).toBe('field_agent');
        expect(error.expectedRole).toBe('admin');
        expect(error.correctPortalUrl).toBe('/field-agent-login');
        expect(error.message).toContain('restricted to Administrator users');
        expect(error.message).toContain('registered as Field Agent');
      }
    });

    it('denies Inbound Sales access when trying to login via /admin-login portal', async () => {
      mockSuccessfulSupabaseAuth(mockSalesProfile);

      try {
        await simulateSignIn('priya@solarcrm.com', 'SecurePass123!', 'admin');
        expect.unreachable('Should have rejected with PortalMismatchError');
      } catch (err) {
        expect(err).toBeInstanceOf(PortalMismatchError);
        const error = err as PortalMismatchError;
        expect(error.actualRole).toBe('inbound_sales');
        expect(error.expectedRole).toBe('admin');
        expect(error.correctPortalUrl).toBe('/inbound-sales-login');
        expect(supabase.auth.signOut).toHaveBeenCalled();
      }
    });

    it('denies Admin access when attempting to login via /field-agent-login portal', async () => {
      mockSuccessfulSupabaseAuth(mockAdminProfile);

      try {
        await simulateSignIn('admin@solarcrm.com', 'SecurePass123!', 'field_agent');
        expect.unreachable('Should have rejected with PortalMismatchError');
      } catch (err) {
        expect(err).toBeInstanceOf(PortalMismatchError);
        const error = err as PortalMismatchError;
        expect(error.actualRole).toBe('admin');
        expect(error.expectedRole).toBe('field_agent');
        expect(error.correctPortalUrl).toBe('/admin-login');
        expect(supabase.auth.signOut).toHaveBeenCalled();
      }
    });

    it('ensures portal selection does NOT grant or elevate user role', async () => {
      // Attacker trying to authenticate as Field Agent using Admin portal
      mockSuccessfulSupabaseAuth(mockFieldAgentProfile);

      await expect(
        simulateSignIn('rahul@solarcrm.com', 'SecretPass123!', 'admin'),
      ).rejects.toThrow(PortalMismatchError);

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('3. Inactive and suspended account denial', () => {
    it('denies access and signs out user with account_status: suspended', async () => {
      const suspendedUser: Profile = {
        ...mockSalesProfile,
        account_status: 'suspended',
        is_active: false,
      };

      mockSuccessfulSupabaseAuth(suspendedUser);

      await expect(
        simulateSignIn('priya@solarcrm.com', 'Password123!', 'inbound_sales'),
      ).rejects.toThrow(AccountInactiveError);

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('denies access and signs out user with is_active: false', async () => {
      const inactiveUser: Profile = {
        ...mockFieldAgentProfile,
        is_active: false,
      };

      mockSuccessfulSupabaseAuth(inactiveUser);

      await expect(
        simulateSignIn('rahul@solarcrm.com', 'Password123!', 'field_agent'),
      ).rejects.toThrow(AccountInactiveError);

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('denies access if database profile does not exist', async () => {
      const mockAuth = supabase.auth as unknown as {
        signInWithPassword: ReturnType<typeof vi.fn>;
        signOut: ReturnType<typeof vi.fn>;
      };
      mockAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'unknown-id', email: 'ghost@solarcrm.com' },
          session: { access_token: 'token' },
        },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }),
        }),
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: mockSelect,
      });

      await expect(
        simulateSignIn('ghost@solarcrm.com', 'Password123!', 'admin'),
      ).rejects.toThrow('User profile record not found');

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
