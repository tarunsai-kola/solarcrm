import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileEdit,
  FileText,
  History,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneIncoming,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  CALL_OUTCOME_CONFIG,
  type AppRole,
  type CallOutcome,
  type LeadActivity,
  type Profile,
} from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { AmendActivityModal } from './AmendActivityModal';

interface ActivityTimelineProps {
  leadId: string;
  activities: Array<
    LeadActivity & {
      author?: Pick<Profile, 'id' | 'full_name' | 'role'> | null;
      follow_up?: any;
    }
  >;
  onLogCallClick?: () => void;
  onScheduleFollowUpClick?: () => void;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
  inbound_sales: {
    label: 'Inbound Sales',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  },
  field_agent: {
    label: 'Field Agent',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
};

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins} min`;
  return `${secs}s`;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'outgoing_call':
    case 'call':
      return { icon: PhoneCall, color: 'text-primary border-primary bg-primary/10' };
    case 'incoming_call':
      return { icon: PhoneIncoming, color: 'text-sky-500 border-sky-500 bg-sky-500/10' };
    case 'whatsapp':
      return { icon: MessageSquare, color: 'text-emerald-500 border-emerald-500 bg-emerald-500/10' };
    case 'email':
      return { icon: Mail, color: 'text-violet-500 border-violet-500 bg-violet-500/10' };
    case 'site_visit':
      return { icon: MapPin, color: 'text-amber-500 border-amber-500 bg-amber-500/10' };
    case 'meeting':
      return { icon: Users, color: 'text-purple-500 border-purple-500 bg-purple-500/10' };
    case 'amendment':
      return { icon: History, color: 'text-amber-600 border-amber-600 bg-amber-600/10' };
    case 'status_change':
      return { icon: Compass, color: 'text-indigo-500 border-indigo-500 bg-indigo-500/10' };
    case 'assignment':
      return { icon: UserCheck, color: 'text-cyan-500 border-cyan-500 bg-cyan-500/10' };
    case 'follow_up_completed':
      return { icon: CheckCircle2, color: 'text-emerald-600 border-emerald-600 bg-emerald-600/10' };
    case 'follow_up_rescheduled':
      return { icon: Clock, color: 'text-amber-600 border-amber-600 bg-amber-600/10' };
    case 'follow_up_cancelled':
      return { icon: XCircle, color: 'text-rose-500 border-rose-500 bg-rose-500/10' };
    case 'follow_up_created':
      return { icon: Calendar, color: 'text-teal-500 border-teal-500 bg-teal-500/10' };
    default:
      return { icon: FileText, color: 'text-muted-foreground border-border bg-muted' };
  }
}

export function ActivityTimeline({
  leadId,
  activities,
  onLogCallClick,
  onScheduleFollowUpClick,
}: ActivityTimelineProps) {
  const [selectedActivityForAmend, setSelectedActivityForAmend] = useState<
    (LeadActivity & { author?: Pick<Profile, 'id' | 'full_name' | 'role'> | null }) | null
  >(null);

  // Sort activities newest first
  const sorted = [...activities].sort(
    (a, b) =>
      new Date(b.occurred_at || b.created_at).getTime() -
      new Date(a.occurred_at || a.created_at).getTime(),
  );

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            Communication & Activity History
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Auditable, shared timeline visible to Inbound Sales and Field Agents
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLogCallClick && (
            <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={onLogCallClick}>
              <PhoneCall className="h-3.5 w-3.5" />
              Log Call
            </Button>
          )}
          {onScheduleFollowUpClick && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={onScheduleFollowUpClick}
            >
              <Calendar className="h-3.5 w-3.5" />
              Follow-up
            </Button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <History className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-medium text-foreground">No communication records yet</p>
          <p className="text-[11px] text-muted-foreground">
            Log outbound/inbound calls, WhatsApp interactions, or site visits above to build the shared history.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {sorted.map((act) => {
            const { icon: Icon, color } = getActivityIcon(act.activity_type);
            const durationStr = formatDuration(act.duration_seconds);
            const roleBadge = act.author?.role ? ROLE_BADGES[act.author.role] : null;
            const outcomeConfig = act.outcome ? CALL_OUTCOME_CONFIG[act.outcome as CallOutcome] : null;

            return (
              <div key={act.id} className="relative group">
                {/* Node Bullet Icon */}
                <div
                  className={`absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] ${color}`}
                >
                  <Icon className="h-2.5 w-2.5" />
                </div>

                {/* Entry Card */}
                <div
                  className={`rounded-xl border p-3.5 shadow-xs space-y-2 text-xs transition-colors ${
                    act.is_amendment
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  {/* Top Row: Author, Role, Outcome, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Author */}
                      <span className="font-semibold text-foreground">
                        {act.author?.full_name || 'System System'}
                      </span>

                      {/* Author Role */}
                      {roleBadge && (
                        <span
                          className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                      )}

                      {/* Activity Type Badge */}
                      <span className="rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-medium text-foreground capitalize">
                        {act.activity_type.replace(/_/g, ' ')}
                      </span>

                      {/* Outcome Badge */}
                      {act.outcome && (
                        <span
                          className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${
                            outcomeConfig?.badge ||
                            'border-border bg-muted/60 text-foreground'
                          }`}
                        >
                          {act.outcome}
                        </span>
                      )}

                      {/* Duration */}
                      {durationStr && (
                        <span className="flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {durationStr}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                      <span>{formatDateTime(act.occurred_at || act.created_at)}</span>

                      {/* Amend Action Button (only on non-amendments) */}
                      {!act.is_amendment && (
                        <button
                          type="button"
                          onClick={() => setSelectedActivityForAmend(act)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded"
                          title="Record an auditable correction"
                        >
                          <FileEdit className="h-2.5 w-2.5" />
                          Amend
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Amendment Callout if applicable */}
                  {act.is_amendment && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-200 space-y-0.5">
                      <div className="flex items-center gap-1 font-bold">
                        <History className="h-3 w-3" />
                        Audited Amendment
                      </div>
                      {act.amendment_reason && (
                        <p>
                          <strong className="font-semibold">Reason:</strong> {act.amendment_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes / Conversation takeaways */}
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs">
                    {act.notes}
                  </p>

                  {/* Footer Links: Follow-up deadline, Attachments, Site Visits, Quotations */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Follow-up reminder indicator */}
                    {(act.follow_up_id || act.follow_up) && (
                      <div className="flex items-center gap-1 rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>
                          Follow-up Scheduled: {formatDateTime(act.follow_up?.due_at || act.occurred_at)}
                        </span>
                      </div>
                    )}

                    {/* Attachment Link */}
                    {act.attachment_url && (
                      <a
                        href={act.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted hover:underline"
                      >
                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[180px]">
                          {act.attachment_name || 'View Attachment'}
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                      </a>
                    )}

                    {/* Site Visit link */}
                    {act.site_visit_id && (
                      <div className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        <MapPin className="h-3 w-3" />
                        <span>Site Visit Linked</span>
                      </div>
                    )}

                    {/* Quotation link */}
                    {act.quotation_id && (
                      <div className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <FileText className="h-3 w-3" />
                        <span>Quotation Linked</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auditable Amendment Modal */}
      {selectedActivityForAmend && (
        <AmendActivityModal
          isOpen={!!selectedActivityForAmend}
          onClose={() => setSelectedActivityForAmend(null)}
          leadId={leadId}
          activity={selectedActivityForAmend}
        />
      )}
    </div>
  );
}
