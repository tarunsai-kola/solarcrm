import type { AppRole } from '@solar-crm/shared';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  roles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has one of the required roles.
 * Shows nothing (or a fallback) otherwise.
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) return <>{fallback}</>;
  return <>{children}</>;
}
