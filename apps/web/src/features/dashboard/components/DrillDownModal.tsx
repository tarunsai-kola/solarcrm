import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';

interface DrillDownModalProps {
  metric: string;
  metricTitle: string;
  from?: string;
  to?: string;
  teamMemberId?: string;
  onClose: () => void;
}

export function DrillDownModal({
  metric,
  metricTitle,
  from,
  to,
  teamMemberId,
  onClose,
}: DrillDownModalProps) {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['drill-down', { metric, from, to, teamMemberId, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        metric,
        page,
        pageSize,
      };
      if (from) params['from'] = from;
      if (to) params['to'] = to;
      if (teamMemberId && teamMemberId !== 'all') params['team_member_id'] = teamMemberId;

      const res = await apiClient.get('/dashboard/drill-down', { params });
      return res.data.data as {
        items: any[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const isFollowUpMetric = metric === 'follow_ups_due_today' || metric === 'overdue_follow_ups';
  const isVisitMetric =
    metric === 'site_visits_scheduled' ||
    metric === 'site_visits_completed' ||
    metric === 'pending_site_reports';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Record Drill-Down:</span>
              <span className="text-primary">{metricTitle}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {total} underlying record{total === 1 ? '' : 's'} matching this KPI criteria
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Table */}
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading && (
            <table className="w-full">
              <tbody>
                <TableSkeleton rows={5} cols={5} />
              </tbody>
            </table>
          )}

          {isError && (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-destructive font-medium">Failed to load drill-down records</p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Search className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-sm font-medium">No records found for this metric</p>
              <p className="text-xs">There are no records currently categorized under {metricTitle}.</p>
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <div className="border border-border/80 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Customer / Title</th>
                    <th className="py-2.5 px-3">Contact & Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Details / Notes</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item, idx) => {
                    const customerName =
                      item.customer_name ??
                      item.leads?.customer_name ??
                      item.first_name ??
                      'Solar Customer';
                    const phone = item.phone ?? item.leads?.phone ?? '—';
                    const location =
                      item.area ??
                      item.pincode ??
                      item.leads?.area ??
                      item.address ??
                      '—';

                    return (
                      <tr key={item.id ?? idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            {item.temperature === 'hot' && (
                              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                            )}
                            <span className="truncate max-w-[160px]">{customerName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{phone}</span>
                            </div>
                            {location !== '—' && (
                              <div className="flex items-center gap-1 text-[11px] opacity-80">
                                <MapPin className="h-2.5 w-2.5" />
                                <span className="truncate max-w-[150px]">{location}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              item.status === 'won' || item.completion_status === 'completed' || item.visit_status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : item.status === 'lost' || item.completion_status === 'overdue'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : item.status === 'new'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.status ?? item.completion_status ?? item.visit_status ?? 'Active'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                          {isFollowUpMetric
                            ? item.notes ?? 'Scheduled follow-up call'
                            : isVisitMetric
                            ? item.roof_suitability
                              ? `Roof: ${item.roof_suitability}`
                              : 'Pending site observation'
                            : item.enquiry_type ?? item.lead_source ?? 'Lead Record'}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {new Date(
                            item.due_at ?? item.scheduled_at ?? item.created_at ?? Date.now(),
                          ).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/40">
          <div className="text-xs text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of{' '}
            <strong className="text-foreground">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs h-8"
            >
              Next
            </Button>
            <Button size="sm" onClick={onClose} className="text-xs h-8 ml-2">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
