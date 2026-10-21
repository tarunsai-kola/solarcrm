import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Plug,
  Settings,
  Sun,
  Users,
  UserSquare2,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import type { AppRole } from '@solar-crm/shared';
import { ROLE_NAV_PERMISSIONS } from '@solar-crm/shared';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { key: 'leads', label: 'Manage Leads', icon: ClipboardList, to: '/leads' },
  { key: 'follow-ups', label: 'Follow-ups', icon: Bell, to: '/follow-ups' },
  { key: 'calendar', label: 'Calendar', icon: Calendar, to: '/calendar' },
  { key: 'quotations', label: 'Quotations', icon: FileText, to: '/quotations' },
  { key: 'customers', label: 'Customers', icon: UserSquare2, to: '/customers' },
  { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, to: '/reports' },
  { key: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications' },
] as const;

const ADMIN_NAV_ITEMS = [
  { key: 'user-management', label: 'User Management', icon: Users, to: '/user-management' },
  { key: 'company-settings', label: 'Company Settings', icon: Building2, to: '/company-settings' },
  { key: 'integrations', label: 'Integrations & Sync', icon: Plug, to: '/integrations' },
  { key: 'audit-logs', label: 'Audit Logs', icon: BookOpen, to: '/audit-logs' },
] as const;

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const { role } = useAuth();
  const location = useLocation();
  const permissions = ROLE_NAV_PERMISSIONS[(role ?? 'field_agent') as AppRole];

  const visibleNav = NAV_ITEMS.filter((item) => permissions.includes(item.key));
  const visibleAdmin = ADMIN_NAV_ITEMS.filter((item) => permissions.includes(item.key));

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
        'lg:relative lg:translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64',
      )}
      aria-label="Main navigation"
    >
      {/* ── Logo ── */}
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4 gap-3', collapsed && 'lg:justify-center lg:px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
          <Sun className="h-4.5 w-4.5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground tracking-tight leading-none">Solar CRM</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{role?.replace('_', ' ')}</p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleNav.map((item) => (
          <NavItem key={item.key} item={item} collapsed={collapsed} />
        ))}

        {visibleAdmin.length > 0 && (
          <>
            <div className={cn('mx-1 my-3 border-t border-sidebar-border')} />
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Administration
              </p>
            )}
            {visibleAdmin.map((item) => (
              <NavItem key={item.key} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* ── Settings link ── */}
      <div className="border-t border-sidebar-border p-2">
        <NavItem
          item={{ key: 'company-settings', label: 'Settings', icon: Settings, to: '/company-settings' }}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

function NavItem({
  item,
  collapsed,
}: {
  item: { key?: string; label: string; icon: React.ElementType; to: string };
  collapsed: boolean;
}) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.to);

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/50',
        isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
        collapsed && 'lg:justify-center lg:px-0 lg:py-2.5',
      )}
    >
      <item.icon
        className={cn(
          'h-4.5 w-4.5 shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground',
        )}
        aria-hidden="true"
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {isActive && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      )}
    </NavLink>
  );
}
