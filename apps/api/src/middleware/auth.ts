import type { NextFunction, Request, Response } from 'express';

import { authStorage, getScopedClient, supabaseAdmin } from '../lib/supabase.js';
import { AppError } from './errorHandler.js';

/**
 * Verifies the Supabase JWT from the Authorization header
 * and attaches the auth context to req.auth.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7);
  const client = getScopedClient(token);

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    return;
  }

  // Fetch profile for role, organization_id & company_id
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, organization_id, company_id, is_active, account_status')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    next(new AppError(403, 'FORBIDDEN', 'User profile not found'));
    return;
  }

  const isAccountActive =
    (profile.account_status ? profile.account_status === 'active' : true) &&
    (profile.is_active !== undefined ? profile.is_active : true);

  if (!isAccountActive) {
    next(new AppError(403, 'ACCOUNT_INACTIVE', 'Account is deactivated or suspended. Access denied.'));
    return;
  }

  const orgId = (profile.organization_id ?? profile.company_id) as string;

  req.auth = {
    userId: data.user.id,
    email: data.user.email ?? '',
    role: profile.role as string,
    organizationId: orgId,
    companyId: (profile.company_id ?? orgId) as string,
  };

  authStorage.run({ client, token }, () => {
    next();
  });
}

/**
 * Requires the authenticated user to have one of the specified roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError(401, 'UNAUTHORIZED', 'Not authenticated'));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, 'FORBIDDEN', `Requires role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}
