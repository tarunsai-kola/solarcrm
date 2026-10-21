import { Compass, Eye, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { useState } from 'react';

import type { AppRole } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '../components/AdminDashboard';
import { FieldAgentDashboard } from '../components/FieldAgentDashboard';
import { InboundSalesDashboard } from '../components/InboundSalesDashboard';

export function DashboardPage() {
  const { profile } = useAuth();
  const actualRole = (profile?.role ?? 'inbound_sales') as AppRole;

  // For Admins: Allow previewing Inbound Sales and Field Agent viewports
  const [adminViewRole, setAdminViewRole] = useState<AppRole>('admin');

  const activeRole = actualRole === 'admin' ? adminViewRole : actualRole;

  const roleConfigs: Record<
    AppRole,
    { label: string; badgeColor: string; icon: React.ElementType }
  > = {
    admin: {
      label: 'Executive Administrator',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: ShieldCheck,
    },
    inbound_sales: {
      label: 'Inbound Sales Representative',
      badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      icon: UserCheck,
    },
    field_agent: {
      label: 'Field Technical Agent',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: Wrench,
    },
  };

  const config = roleConfigs[activeRole];
  const IconComponent = config.icon;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Greeting ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Good {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeColor}`}
            >
              <IconComponent className="h-3 w-3" />
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time solar pipeline telemetry, lead operations, and conversion analytics
          </p>
        </div>

        {/* Admin Multi-Role Viewport Switcher */}
        {actualRole === 'admin' && (
          <div className="flex items-center gap-1.5 p-1 bg-muted/80 border border-border rounded-lg self-start md:self-auto">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              View as:
            </span>
            <button
              onClick={() => setAdminViewRole('admin')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                adminViewRole === 'admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Executive Admin
            </button>
            <button
              onClick={() => setAdminViewRole('inbound_sales')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                adminViewRole === 'inbound_sales'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inbound Sales
            </button>
            <button
              onClick={() => setAdminViewRole('field_agent')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                adminViewRole === 'field_agent'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Field Agent
            </button>
          </div>
        )}
      </div>

      {/* ── Active Role Dashboard Component ── */}
      {activeRole === 'admin' && <AdminDashboard />}
      {activeRole === 'inbound_sales' && <InboundSalesDashboard />}
      {activeRole === 'field_agent' && <FieldAgentDashboard />}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
