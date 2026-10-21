import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  History,
  Loader2,
  MessageSquare,
  Phone,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  LEAD_TEMPERATURES,
  type FollowUpFilter,
  type LeadTemperature,
} from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import { AddCallLogModal } from '@/features/leads/components/AddCallLogModal';
import { LeadDetailDrawer } from '@/features/leads/components/LeadDetailDrawer';
import { LeadTemperatureBadge } from '@/features/leads/components/LeadTemperatureBadge';
import { useLead, useTeamMembers } from '@/features/leads/hooks/use-leads';
import { CompleteFollowUpModal } from '../components/CompleteFollowUpModal';
import { RescheduleFollowUpModal } from '../components/RescheduleFollowUpModal';
import {
  useCancelFollowUp,
  useFollowUps,
  type FollowUpWithRelations,
} from '../hooks/use-followups';

type TabKey = 'overdue' | 'dueToday' | 'upcoming' | 'completed' | 'cancelled';

export function FollowUpsPage() {
  const { user, role } = useAuth();
  const { data: team } = useTeamMembers();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabKey>('dueToday');

  // Filter State
  const [search, setSearch] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [temperature, setTemperature] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals & Action States
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadForCallLogId, setLeadForCallLogId] = useState<string | null>(null);
  const [rescheduleFollowUp, setRescheduleFollowUp] = useState<FollowUpWithRelations | null>(null);
  const [completeFollowUp, setCompleteFollowUp] = useState<FollowUpWithRelations | null>(null);

  // Hook to fetch lead data when user clicks Log Call on a follow-up card
  const { data: leadForCallLog } = useLead(leadForCallLogId || '');

  // Cancel Mutation
  const cancelMutation = useCancelFollowUp();

  // Compute tab filter parameter
  const getTabParam = (tab: TabKey): Partial<FollowUpFilter> => {
    switch (tab) {
      case 'overdue':
        return { tab: 'overdue' };
      case 'dueToday':
        return { tab: 'due_today' };
      case 'upcoming':
        return { tab: 'upcoming' };
      case 'completed':
        return { tab: 'completed' };
      case 'cancelled':
        return { tab: 'cancelled' };
    }
  };

  const queryParams: Partial<FollowUpFilter> = {
    ...getTabParam(activeTab),
    page,
    pageSize: 20,
    ...(search ? { search } : {}),
    ...(ownerId ? { assigned_to: ownerId } : {}),
    ...(temperature ? { temperature: temperature as LeadTemperature } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useFollowUps(queryParams);

  const counts = data?.counts || {
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  };

  // Filter items in memory if client wants temperature filtering on lead
  const filteredItems = (data?.items || []).filter((item) => {
    if (!temperature) return true;
    return item.lead?.temperature === temperature;
  });

  const handleCancelClick = async (followUp: FollowUpWithRelations) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel the follow-up reminder for "${followUp.lead?.customer_name || 'Customer'}"?`,
      )
    ) {
      return;
    }

    try {
      await cancelMutation.mutateAsync(followUp.id);
      toast({
        title: 'Follow-up Cancelled',
        description: 'Reminder has been moved to Cancelled status.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Cancel',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Follow-ups & Reminders
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage upcoming customer touchpoints, callbacks, and commitments across sales & field teams.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { key: 'overdue', label: 'Overdue', count: counts.overdue, color: 'text-red-600 bg-red-500/10' },
          { key: 'dueToday', label: 'Due Today', count: counts.dueToday, color: 'text-amber-600 bg-amber-500/10' },
          { key: 'upcoming', label: 'Upcoming', count: counts.upcoming, color: 'text-blue-600 bg-blue-500/10' },
          { key: 'completed', label: 'Completed', count: counts.completed, color: 'text-emerald-600 bg-emerald-500/10' },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, color: 'text-muted-foreground bg-muted' },
        ].map(({ key, label, count, color }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as TabKey);
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : color
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Filters Bar */}
      <Card className="p-3.5 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search customer, phone, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Owner Filter */}
          <div>
            <select
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                setPage(1);
              }}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-ring"
            >
              <option value="">All Owners (Sales & Field)</option>
              {team?.inboundSales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} (Sales)
                </option>
              ))}
              {team?.fieldAgents?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} (Field Agent)
                </option>
              ))}
            </select>
          </div>

          {/* Lead Temperature Filter */}
          <div>
            <select
              value={temperature}
              onChange={(e) => {
                setTemperature(e.target.value);
              }}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-ring"
            >
              <option value="">All Temperatures</option>
              {LEAD_TEMPERATURES.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center justify-end">
            {(search || ownerId || temperature) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setOwnerId('');
                  setTemperature('');
                  setPage(1);
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 4. Follow-ups List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-border bg-card/60 animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3 bg-card/40">
          <CalendarClock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-sm">
              No {activeTab} follow-ups found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab === 'overdue'
                ? 'Great job! You have zero overdue tasks.'
                : activeTab === 'dueToday'
                  ? 'All tasks scheduled for today have been completed or none were assigned.'
                  : `There are currently no items under the ${activeTab} tab matching your search.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isPending = item.completion_status === 'pending';
            const isOverdue = item.is_overdue || (isPending && new Date(item.due_at) < new Date());

            return (
              <Card
                key={item.id}
                className={`p-4 transition-all hover:border-primary/40 space-y-3 ${
                  isOverdue ? 'border-red-500/30 bg-red-500/5' : 'bg-card'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Lead details & Temperature */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLeadId(item.lead_id)}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {item.lead?.customer_name || 'Customer'}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </button>

                      {item.lead?.temperature && (
                        <LeadTemperatureBadge
                          temperature={item.lead.temperature as LeadTemperature}
                        />
                      )}

                      <span className="text-xs text-muted-foreground">
                        {item.lead?.phone}
                      </span>

                      {item.lead?.area && (
                        <span className="text-xs text-muted-foreground">
                          • {item.lead.area}
                        </span>
                      )}
                    </div>

                    {/* Due Date Indicator */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Clock className="h-3 w-3 text-primary" />
                        Due: {formatDateTime(item.due_at)}
                      </span>

                      {isOverdue && (
                        <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                          OVERDUE
                        </span>
                      )}

                      {/* Rescheduled Badge if count > 0 */}
                      {item.rescheduled_count && item.rescheduled_count > 0 ? (
                        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                          Rescheduled {item.rescheduled_count}x
                        </span>
                      ) : null}

                      {/* Assignee Badge */}
                      <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground font-medium flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        Owner: {item.assignee?.full_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 1. Open Lead Drawer */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => setSelectedLeadId(item.lead_id)}
                    >
                      Open Lead
                    </Button>

                    {/* 2. Log Call */}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs gap-1"
                      onClick={() => setLeadForCallLogId(item.lead_id)}
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-primary" />
                      Log Call
                    </Button>

                    {/* 3. Pending Actions: Reschedule & Complete */}
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 text-amber-600 hover:text-amber-700 border-amber-500/30 hover:bg-amber-500/10"
                          onClick={() => setRescheduleFollowUp(item)}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reschedule
                        </Button>

                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setCompleteFollowUp(item)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleCancelClick(item)}
                          disabled={cancelMutation.isPending}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                          title="Cancel reminder"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Follow-up Objective / Notes */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs text-foreground space-y-1">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
                    Reminder Note / Agenda
                  </span>
                  <p className="whitespace-pre-wrap">{item.notes}</p>
                </div>

                {/* If Rescheduled, show last reschedule reason */}
                {item.reschedule_reason && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1">
                    <span className="font-semibold">Last Reschedule Reason:</span> {item.reschedule_reason}
                  </div>
                )}

                {/* If Completed, show outcome */}
                {item.completion_status === 'completed' && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 flex items-center justify-between">
                    <span>
                      <strong className="font-semibold">Completed:</strong> {formatDateTime(item.completed_at || item.updated_at)}
                    </span>
                    <span className="font-medium">Status: Resolved</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Modals */}
      {/* Lead Detail Drawer */}
      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          isOpen={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}

      {/* Add Call Log Modal from quick action */}
      {leadForCallLogId && leadForCallLog && (
        <AddCallLogModal
          isOpen={!!leadForCallLogId}
          onClose={() => setLeadForCallLogId(null)}
          lead={leadForCallLog}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleFollowUp && (
        <RescheduleFollowUpModal
          isOpen={!!rescheduleFollowUp}
          onClose={() => setRescheduleFollowUp(null)}
          followUp={rescheduleFollowUp}
        />
      )}

      {/* Complete Modal */}
      {completeFollowUp && (
        <CompleteFollowUpModal
          isOpen={!!completeFollowUp}
          onClose={() => setCompleteFollowUp(null)}
          followUp={completeFollowUp}
        />
      )}
    </div>
  );
}
