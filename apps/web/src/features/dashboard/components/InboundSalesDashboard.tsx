import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Flame,
  IndianRupee,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { InboundSalesDashboardData } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCardSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { DrillDownModal } from './DrillDownModal';

export function InboundSalesDashboard() {
  const [drillDownTarget, setDrillDownTarget] = useState<{ metric: string; title: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inbound-sales-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/inbound-sales');
      return res.data.data as InboundSalesDashboardData;
    },
  });

  const kpis = data?.kpis;
  const urgentFollowUps = data?.urgent_follow_ups ?? [];
  const recentHotLeads = data?.recent_hot_leads ?? [];
  const funnel = data?.funnel ?? [];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* ── Subtitle / Action Status ── */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Sales Outreach & Pipeline Workspace</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time pipeline tracking, urgent follow-up calls, and conversion metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs h-8">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Pipeline
        </Button>
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
          <h3 className="text-base font-bold text-foreground">Unable to Load Sales Workspace</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Failed to retrieve your assigned leads and follow-up activities.
          </p>
          <Button size="sm" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      )}

      {/* ── Data Loaded Content ── */}
      {!isLoading && !isError && kpis && (
        <>
          {/* ── 1. Sales KPI Cards ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* My Total Leads */}
            <Card
              onClick={() => setDrillDownTarget({ metric: 'total_leads', title: 'My Total Leads' })}
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  My Total Leads
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.my_total_leads}</div>
                <p className="text-xs text-muted-foreground mt-1">Assigned or registered by you</p>
              </CardContent>
            </Card>

            {/* Fresh Leads */}
            <Card
              onClick={() => setDrillDownTarget({ metric: 'fresh_leads', title: 'Fresh Leads' })}
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fresh Leads
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                  <Compass className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.fresh_leads}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">Uncontacted</p>
                  {kpis.fresh_leads > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600">
                      Outreach Pending
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assigned Follow-Ups */}
            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'follow_ups_due_today', title: 'Follow-ups Due' })
              }
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assigned Follow-Ups
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.assigned_follow_ups}</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled calls on your calendar</p>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'overdue_follow_ups', title: 'Overdue Follow-ups' })
              }
              className={`border-border bg-card/95 hover:shadow-md transition-all cursor-pointer ${
                kpis.overdue_tasks > 0 ? 'border-destructive/40 bg-destructive/5' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Overdue Tasks
                </CardTitle>
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    kpis.overdue_tasks > 0
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-emerald-500/15 text-emerald-500'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-black ${
                    kpis.overdue_tasks > 0 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {kpis.overdue_tasks}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">Missed deadline</p>
                  {kpis.overdue_tasks > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                      Requires Action
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              onClick={() => setDrillDownTarget({ metric: 'hot_leads', title: 'Hot Leads' })}
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hot Leads
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-orange-500/15 text-orange-500 flex items-center justify-center">
                  <Flame className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.hot_leads}</div>
                <p className="text-xs text-muted-foreground mt-1">High purchase propensity</p>
              </CardContent>
            </Card>

            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'site_visits_scheduled', title: 'Site Visits Scheduled' })
              }
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Site Visits Scheduled
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                  <Wrench className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.site_visits_scheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">Field roof measurements booked</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/95">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  My Win Rate
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.conversion_rate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.won_deals} won deals closed
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/95">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Won Deals Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(kpis.won_revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Confirmed signed quotations</p>
              </CardContent>
            </Card>
          </div>

          {/* ── 2. Worklist: Urgent Follow-Ups & Priority Hot Leads ── */}
          <div className="grid gap-6 lg:grid-cols-2 pt-2">
            {/* Urgent Follow-Up Calls */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      Urgent Follow-Up Calls
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Pending customer touchpoints due today or overdue
                    </CardDescription>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {urgentFollowUps.length} Pending
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {urgentFollowUps.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-medium">All follow-ups completed!</p>
                    <p className="text-xs">No pending scheduled calls for today.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {urgentFollowUps.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                          task.is_overdue
                            ? 'bg-destructive/5 border-destructive/25'
                            : 'bg-muted/40 border-border hover:bg-muted/70'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground truncate">
                              {task.customer_name}
                            </span>
                            {task.is_overdue && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-destructive/15 text-destructive shrink-0">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {task.phone}
                            </span>
                            <span>
                              Due:{' '}
                              {new Date(task.due_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {task.notes && (
                            <p className="text-muted-foreground truncate max-w-sm italic text-[11px]">
                              "{task.notes}"
                            </p>
                          )}
                        </div>
                        <a
                          href={`tel:${task.phone}`}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <PhoneCall className="h-3 w-3" />
                          Call
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Hot Leads */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" />
                      Priority Hot Leads
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Fastest moving opportunities requiring immediate closing
                    </CardDescription>
                  </div>
                  <Link to="/leads" className="text-xs text-primary hover:underline font-semibold">
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {recentHotLeads.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Search className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-sm font-medium">No hot leads at the moment</p>
                    <p className="text-xs">Classify interested leads as hot to prioritize them here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentHotLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-xs flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground truncate">
                              {lead.customer_name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-600">
                              HOT 🔥
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                            <span>{lead.phone}</span>
                            <span>•</span>
                            <span className="capitalize">{lead.enquiry_type}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 3. Personal Sales Funnel ── */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">My Opportunity Funnel</CardTitle>
              <CardDescription className="text-xs">
                Stage conversion velocity across your authorized leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center">
                {funnel.map((stage) => (
                  <div key={stage.stage} className="p-3 rounded-xl bg-muted/50 border border-border space-y-1">
                    <div className="text-xs text-muted-foreground font-semibold">{stage.stage}</div>
                    <div className="text-xl font-bold text-foreground">{stage.count}</div>
                    <div className="text-[11px] text-primary font-bold">{stage.percentage}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Drill-Down Modal ── */}
      {drillDownTarget && (
        <DrillDownModal
          metric={drillDownTarget.metric}
          metricTitle={drillDownTarget.title}
          onClose={() => setDrillDownTarget(null)}
        />
      )}
    </div>
  );
}
