import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AppRole, Profile } from '@solar-crm/shared';

import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
export class PortalMismatchError extends Error {
  constructor(
    public readonly actualRole: AppRole,
    public readonly expectedRole: AppRole,
    public readonly correctPortalUrl: string,
  ) {
    const roleLabels: Record<AppRole, string> = {
      admin: 'Administrator',
      inbound_sales: 'Inbound Sales',
      field_agent: 'Field Agent',
    };
    super(
      `Access Denied: This portal is restricted to ${roleLabels[expectedRole]} users. Your account is registered as ${roleLabels[actualRole]}.`,
    );
    this.name = 'PortalMismatchError';
  }
}

export class AccountInactiveError extends Error {
  constructor(message = 'Your account has been deactivated or suspended. Please contact your organization administrator.') {
    super(message);
    this.name = 'AccountInactiveError';
  }
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, portalRole?: AppRole) => Promise<Profile>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AppRole[]) => boolean;
  refreshProfile: () => Promise<Profile | null>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile(null);
        return null;
      }

      const userProfile = data as Profile;

      // Verify active account status
      if (userProfile.account_status !== 'active' || !userProfile.is_active) {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        return null;
      }

      setProfile(userProfile);
      return userProfile;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;
    return fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void fetchProfile(data.session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string, portalRole?: AppRole): Promise<Profile> => {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        throw error ?? new Error('Invalid email or password');
      }

      // 2. Retrieve authoritative profile from database
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

      // 3. Verify active status
      if (userProfile.account_status !== 'active' || !userProfile.is_active) {
        await supabase.auth.signOut();
        throw new AccountInactiveError();
      }

      // 4. Verify portal role match
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

      setProfile(userProfile);
      setUser(data.user);
      setSession(data.session);
      return userProfile;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const hasRole = useCallback(
    (...roles: AppRole[]) => {
      if (!profile) return false;
      return roles.includes(profile.role);
    },
    [profile],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      role: profile?.role ?? null,
      isLoading,
      isAuthenticated: !!user && !!profile && profile.account_status === 'active',
      signIn,
      signOut,
      hasRole,
      refreshProfile,
    }),
    [user, profile, session, isLoading, signIn, signOut, hasRole, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
