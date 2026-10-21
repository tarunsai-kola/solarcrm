import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  IndianRupee,
  Layers,
  MapPin,
  PieChart as PieIcon,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AdminDashboardData } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCardSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { DrillDownModal } from './DrillDownModal';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  color: string;
  onClickDrillDown?: () => void;
  tooltipFormula?: string;
}

function AdminKpiCard({
  title,
  value,
  subtitle,
  badge,
  badgeColor,
  icon: Icon,
  color,
  onClickDrillDown,
  tooltipFormula,
}: KpiCardProps) {
  return (
    <Card
      onClick={onClickDrillDown}
      className={`relative overflow-hidden transition-all border border-border bg-card/95 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 cursor-pointer group`}
    >
      <div
        className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-xl ${color}`}
        aria-hidden="true"
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          {tooltipFormula && (
            <span
              title={`Formula: ${tooltipFormula}`}
              className="text-muted-foreground/60 hover:text-foreground cursor-help"
            >
              <HelpCircle className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color} bg-opacity-15 shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
        <div className="mt-1 flex items-center justify-between">
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          {badge && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                badgeColor ?? 'bg-primary/10 text-primary'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#06b6d4',
  qualified: '#8b5cf6',
  site_visit_scheduled: '#f59e0b',
  site_visit_completed: '#eab308',
  quotation_sent: '#ec4899',
  negotiation: '#a855f7',
  won: '#10b981',
  lost: '#ef4444',
  disqualified: '#6b7280',
};

const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function AdminDashboard() {
  const [period, setPeriod] = useState<string>('30d');
  const [teamMemberId, setTeamMemberId] = useState<string>('all');
  const [drillDownTarget, setDrillDownTarget] = useState<{ metric: string; title: string } | null>(null);

  // Fetch Admin Dashboard Data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard', { period, teamMemberId }],
    queryFn: async () => {
      const params: Record<string, string> = { period };
      if (teamMemberId !== 'all') params['team_member_id'] = teamMemberId;

      const res = await apiClient.get('/dashboard/admin', { params });
      return res.data.data as AdminDashboardData;
    },
  });

  const kpis = data?.kpis;
  const charts = data?.charts;
  const teamMembers = data?.team_members;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* ── Control Bar: Filters & Team Member Selector ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-border">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: 'month', label: 'This Month' },
            { id: '90d', label: '90D' },
            { id: 'ytd', label: 'YTD' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === tab.id
                  ? 'bg-card text-foreground shadow-sm shadow-black/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Team Member Comparison Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Team View:</span>
          <select
            value={teamMemberId}
            onChange={(e) => setTeamMemberId(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Organization (Aggregate)</option>
            {teamMembers?.inbound_sales?.length ? (
              <optgroup label="Inbound Sales Representatives">
                {teamMembers.inbound_sales.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    Sales: {rep.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {teamMembers?.field_agents?.length ? (
              <optgroup label="Field Technical Agents">
                {teamMembers.field_agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    Field: {agent.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </div>
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error State ── */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">Failed to Load Dashboard Metrics</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            An error occurred while compiling aggregate analytics from the database.
          </p>
          <Button size="sm" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Analytics Calculation
          </Button>
        </Card>
      )}

      {/* ── Data Loaded Content ── */}
      {!isLoading && !isError && kpis && charts && (
        <>
          {/* ── 1. KPI Cards Grid ── */}
          <section aria-label="Key Performance Indicators" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Pipeline Health & Volume
              </h2>
              <span className="text-[11px] text-muted-foreground">Click any card to inspect underlying records</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminKpiCard
                title="Total Leads"
                value={kpis.total_leads}
                subtitle={`${kpis.fresh_leads} fresh, ${kpis.contacted_leads} contacted`}
                icon={Users}
                color="bg-blue-500 text-blue-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'total_leads', title: 'Total Leads' })
                }
              />
              <AdminKpiCard
                title="Fresh Leads"
                value={kpis.fresh_leads}
                subtitle="Awaiting initial sales contact"
                badge={kpis.fresh_leads > 0 ? 'Action Needed' : 'Caught Up'}
                badgeColor={kpis.fresh_leads > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'}
                icon={Compass}
                color="bg-amber-500 text-amber-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'fresh_leads', title: 'Fresh Leads' })
                }
              />
              <AdminKpiCard
                title="Contacted Leads"
                value={kpis.contacted_leads}
                subtitle="First outreach initiated"
                icon={Clock}
                color="bg-cyan-500 text-cyan-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'contacted_leads', title: 'Contacted Leads' })
                }
              />
              <AdminKpiCard
                title="Hot & Warm Leads"
                value={kpis.hot_and_warm_leads}
                subtitle={`${kpis.hot_leads} Hot 🔥 | ${kpis.warm_leads} Warm ☀️`}
                badge="High Intent"
                badgeColor="bg-orange-500/15 text-orange-600"
                icon={Flame}
                color="bg-orange-500 text-orange-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'hot_and_warm_leads', title: 'Hot & Warm High Intent Leads' })
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
              <AdminKpiCard
                title="Follow-Ups Due Today"
                value={kpis.follow_ups_due_today}
                subtitle="Scheduled sales calls today"
                badge={kpis.follow_ups_due_today > 0 ? 'Today' : 'None'}
                icon={Calendar}
                color="bg-indigo-500 text-indigo-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'follow_ups_due_today', title: 'Follow-ups Due Today' })
                }
              />
              <AdminKpiCard
                title="Overdue Follow-Ups"
                value={kpis.overdue_follow_ups}
                subtitle="Past due deadline"
                badge={kpis.overdue_follow_ups > 0 ? 'Urgent Alert' : 'On Track'}
                badgeColor={
                  kpis.overdue_follow_ups > 0
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-emerald-500/15 text-emerald-600'
                }
                icon={AlertCircle}
                color="bg-rose-500 text-rose-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'overdue_follow_ups', title: 'Overdue Follow-ups' })
                }
              />
              <AdminKpiCard
                title="Site Visits Scheduled"
                value={kpis.site_visits_scheduled}
                subtitle="On-site roof feasibility visits"
                icon={Wrench}
                color="bg-purple-500 text-purple-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'site_visits_scheduled', title: 'Site Visits Scheduled' })
                }
              />
              <AdminKpiCard
                title="Quotations Sent"
                value={kpis.quotations_sent}
                subtitle="Commercial quotes generated"
                icon={FileCheck}
                color="bg-pink-500 text-pink-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'quotations_sent', title: 'Quotations Sent' })
                }
              />
            </div>

            {/* ── Conversion & Won Revenue Section ── */}
            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <AdminKpiCard
                title="Won & Lost Deals"
                value={`${kpis.won_leads} Won / ${kpis.lost_leads} Lost`}
                subtitle={`Win-Loss Ratio: ${kpis.win_loss_rate}%`}
                badge={`${kpis.won_leads} Closed`}
                badgeColor="bg-emerald-500/15 text-emerald-600"
                icon={CheckCircle2}
                color="bg-emerald-500 text-emerald-500"
                onClickDrillDown={() =>
                  setDrillDownTarget({ metric: 'won_leads', title: 'Won Solar Installations' })
                }
              />
              <AdminKpiCard
                title="Conversion Rate"
                value={`${kpis.conversion_rate}%`}
                subtitle="Won deals / Total leads"
                badge={`Win/Loss: ${kpis.win_loss_rate}%`}
                icon={TrendingUp}
                color="bg-teal-500 text-teal-500"
                tooltipFormula="(Won Leads / Total Leads) * 100"
              />
              <AdminKpiCard
                title="Won Deal Revenue"
                value={formatCurrency(kpis.won_revenue)}
                subtitle={`Avg Deal Size: ${formatCurrency(kpis.average_deal_size)}`}
                badge="Confirmed Revenue"
                badgeColor="bg-emerald-500/15 text-emerald-600"
                icon={IndianRupee}
                color="bg-emerald-600 text-emerald-600"
                tooltipFormula="Sum of accepted quotation total amounts for won deals (deduplicated by lead)"
              />
            </div>
          </section>

          {/* ── 2. Primary Charts: Leads Over Time & Won Revenue ── */}
          <div className="grid gap-6 lg:grid-cols-2 pt-2">
            {/* Chart 1: Leads Created Over Time */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Leads Created Over Time</span>
                  <span className="text-xs font-normal text-muted-foreground">Intake vs Won Deals</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily timeline of total leads generated and won deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  {charts.leads_over_time.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      No lead activity in this date range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.leads_over_time}>
                        <defs>
                          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Total Leads"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorLeads)"
                        />
                        <Area
                          type="monotone"
                          dataKey="won"
                          name="Won Deals"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorWon)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chart 7: Won Revenue Over Time */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Won Revenue Trajectory</span>
                  <span className="text-xs text-emerald-500 font-bold">
                    {formatCurrency(kpis.won_revenue)}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Cumulative won deal revenue generated over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  {charts.won_revenue_over_time.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      No won revenue recorded in this date range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.won_revenue_over_time}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(v: number) => formatCurrency(v)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          name="Cumulative Revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── 3. Pipeline Distribution: Status & Source ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart 2A: Leads by Status */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Leads by Status</CardTitle>
                <CardDescription className="text-xs">Volume distribution across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.leads_by_status} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        width={130}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                        {charts.leads_by_status.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[entry.status] ?? '#3b82f6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2B: Leads by Source */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Lead Acquisition Sources</CardTitle>
                <CardDescription className="text-xs">Customer channels (Meta Ads, Tata Solar, JustDial, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.leads_by_source}
                        dataKey="count"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {charts.leads_by_source.map((entry, index) => (
                          <Cell
                            key={`src-${index}`}
                            fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── 4. Conversion Funnel & Follow-Up Completion ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart 5: Conversion Funnel */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Conversion Funnel Progression</CardTitle>
                <CardDescription className="text-xs">Lead progression from intake to won installation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {charts.conversion_funnel.map((stage, idx) => (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {stage.stage}
                        </span>
                        <span className="font-bold text-foreground">
                          {stage.count} leads{' '}
                          <span className="text-muted-foreground font-normal">({stage.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, stage.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart 6: Follow-Up Completion Status */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Follow-Up Completion Health</CardTitle>
                <CardDescription className="text-xs">Sales communication responsiveness and backlog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 pt-3 text-center">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {charts.follow_up_completion.completed}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Completed</div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <Clock className="h-6 w-6 text-amber-500 mx-auto" />
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {charts.follow_up_completion.pending}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Pending</div>
                  </div>

                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1">
                    <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
                    <div className="text-xl font-bold text-destructive">
                      {charts.follow_up_completion.overdue}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">Overdue</div>
                  </div>
                </div>

                <div className="mt-6 p-3 rounded-lg bg-muted/60 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall Tasks Completion Rate:</span>
                  <span className="font-bold text-foreground">
                    {charts.follow_up_completion.completion_rate}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── 5. Team Member Performance: Sales & Field Agents ── */}
          <div className="grid gap-6 lg:grid-cols-2 pt-2">
            {/* Salesperson Performance Table */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Inbound Sales Team Performance</span>
                  <UserCheck className="h-4 w-4 text-primary" />
                </CardTitle>
                <CardDescription className="text-xs">
                  Leads handled, outreach conversion rate, and closed deal revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Salesperson</th>
                        <th className="py-2 px-3 text-center">Handled</th>
                        <th className="py-2 px-3 text-center">Won</th>
                        <th className="py-2 px-3 text-center">Conv %</th>
                        <th className="py-2 px-3 text-right">Won Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {charts.salesperson_performance.map((rep) => (
                        <tr key={rep.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-foreground">
                            <div>{rep.name}</div>
                            <div className="text-[10px] text-muted-foreground">{rep.email}</div>
                          </td>
                          <td className="py-2 px-3 text-center text-foreground font-bold">{rep.leads_handled}</td>
                          <td className="py-2 px-3 text-center text-emerald-500 font-bold">{rep.won}</td>
                          <td className="py-2 px-3 text-center text-foreground">{rep.conversion_rate}%</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">
                            {formatCurrency(rep.won_revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Field Agent Performance Table */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Field Technical Agents Performance</span>
                  <Wrench className="h-4 w-4 text-primary" />
                </CardTitle>
                <CardDescription className="text-xs">
                  Assigned territory leads, site inspections completed, and won outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Field Agent</th>
                        <th className="py-2 px-3 text-center">Assigned</th>
                        <th className="py-2 px-3 text-center">Visits Done</th>
                        <th className="py-2 px-3 text-center">Scheduled</th>
                        <th className="py-2 px-3 text-center">Won Leads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {charts.field_agent_performance.map((agent) => (
                        <tr key={agent.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-foreground">
                            <div>{agent.name}</div>
                            <div className="text-[10px] text-muted-foreground">{agent.email}</div>
                          </td>
                          <td className="py-2 px-3 text-center text-foreground font-bold">{agent.assigned_leads}</td>
                          <td className="py-2 px-3 text-center text-emerald-500 font-bold">
                            {agent.visits_completed}
                          </td>
                          <td className="py-2 px-3 text-center text-amber-500 font-bold">
                            {agent.visits_scheduled}
                          </td>
                          <td className="py-2 px-3 text-center text-foreground font-semibold">
                            {agent.won_leads}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ── Drill-Down Modal ── */}
      {drillDownTarget && (
        <DrillDownModal
          metric={drillDownTarget.metric}
          metricTitle={drillDownTarget.title}
          from={period}
          teamMemberId={teamMemberId}
          onClose={() => setDrillDownTarget(null)}
        />
      )}
    </div>
  );
}
