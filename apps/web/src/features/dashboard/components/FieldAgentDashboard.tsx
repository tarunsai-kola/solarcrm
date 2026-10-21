import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  FileText,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { FieldAgentDashboardData } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCardSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { DrillDownModal } from './DrillDownModal';

export function FieldAgentDashboard() {
  const [drillDownTarget, setDrillDownTarget] = useState<{ metric: string; title: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['field-agent-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/field-agent');
      return res.data.data as FieldAgentDashboardData;
    },
  });

  const kpis = data?.kpis;
  const todaySchedule = data?.today_schedule ?? [];
  const upcomingSchedule = data?.upcoming_schedule ?? [];
  const pendingReports = data?.pending_reports ?? [];

  return (
    <div className="space-y-6">
      {/* ── Subtitle / Action Status ── */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Field Operations & Inspection Schedule</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your assigned site audits, rooftop solar feasibility inspections, and technical reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Field Privacy Guard Active
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs h-8">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error State ── */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">Unable to Load Field Inspections</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Failed to connect to the database to retrieve your scheduled site visits.
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
          {/* ── 1. Field Agent KPIs ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Assigned Leads */}
            <Card
              onClick={() => setDrillDownTarget({ metric: 'total_leads', title: 'My Assigned Leads' })}
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assigned Leads
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.assigned_leads}</div>
                <p className="text-xs text-muted-foreground mt-1">Solar leads assigned in your service area</p>
              </CardContent>
            </Card>

            {/* Today's Visits */}
            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'site_visits_scheduled', title: "Today's Scheduled Visits" })
              }
              className={`border-border bg-card/95 hover:shadow-md transition-all cursor-pointer ${
                kpis.today_visits > 0 ? 'border-primary/40 bg-primary/5' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today's Site Visits
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-primary">{kpis.today_visits}</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled for on-site inspection today</p>
              </CardContent>
            </Card>

            {/* Upcoming Visits */}
            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'site_visits_scheduled', title: 'Upcoming Visits' })
              }
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming Visits
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{kpis.upcoming_visits}</div>
                <p className="text-xs text-muted-foreground mt-1">Booked for upcoming days</p>
              </CardContent>
            </Card>

            {/* Overdue Actions */}
            <Card
              className={`border-border bg-card/95 ${
                kpis.overdue_actions > 0 ? 'border-destructive/40 bg-destructive/5' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Overdue Actions
                </CardTitle>
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    kpis.overdue_actions > 0
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
                    kpis.overdue_actions > 0 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {kpis.overdue_actions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Uncompleted past visits or actions</p>
              </CardContent>
            </Card>

            {/* Completed Visits */}
            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'site_visits_completed', title: 'Completed Site Visits' })
              }
              className="border-border bg-card/95 hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Completed Visits
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.completed_visits}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Successfully inspected roofs</p>
              </CardContent>
            </Card>

            {/* Pending Site Reports */}
            <Card
              onClick={() =>
                setDrillDownTarget({ metric: 'pending_site_reports', title: 'Pending Technical Reports' })
              }
              className={`border-border bg-card/95 hover:shadow-md transition-all cursor-pointer ${
                kpis.pending_site_reports > 0 ? 'border-amber-500/40 bg-amber-500/5' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pending Site Reports
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-black ${
                    kpis.pending_site_reports > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                  }`}
                >
                  {kpis.pending_site_reports}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting roof assessment / capacity measurements</p>
              </CardContent>
            </Card>
          </div>

          {/* ── 2. Today's Visit Schedule ── */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    Today's Inspection Schedule
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Visits booked on your route for today
                  </CardDescription>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {todaySchedule.length} Scheduled
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {todaySchedule.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-medium">No site inspections scheduled for today</p>
                  <p className="text-xs">Your route is clear. Check upcoming visits for tomorrow.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {todaySchedule.map((visit) => (
                    <div
                      key={visit.id}
                      className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{visit.customer_name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(visit.scheduled_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            visit.visit_status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {visit.visit_status}
                        </span>
                      </div>

                      {visit.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                          <span className="line-clamp-2">{visit.address}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <div className="text-xs text-muted-foreground">
                          {visit.roof_suitability ? (
                            <span className="text-emerald-500 font-semibold capitalize">
                              Roof: {visit.roof_suitability}
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium">Audit pending</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${visit.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
                          >
                            <PhoneCall className="h-3 w-3" />
                            Call
                          </a>
                          {visit.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                visit.address,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                            >
                              <Navigation className="h-3 w-3" />
                              Map
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 3. Upcoming Schedule & Pending Reports ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Visits */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Upcoming Site Audits
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Scheduled inspections on your upcoming calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                {upcomingSchedule.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    No upcoming inspections scheduled
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingSchedule.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-2.5 rounded-lg border border-border bg-card text-xs flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <span className="font-bold text-foreground truncate block">
                            {visit.customer_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(visit.scheduled_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <a
                          href={`tel:${visit.phone}`}
                          className="shrink-0 p-1.5 rounded-md bg-muted text-foreground hover:bg-muted/80"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Site Reports */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Pending Technical Reports
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Completed visits requiring roof assessment & kW measurements
                    </CardDescription>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                    {pendingReports.length} Required
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {pendingReports.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-medium">All technical reports up to date!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <span className="font-bold text-foreground truncate block">
                            {report.customer_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Inspected on{' '}
                            {new Date(report.scheduled_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-amber-500/30">
                          Submit Report
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
          onClose={() => setDrillDownTarget(null)}
        />
      )}
    </div>
  );
}
