import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertCircle,
  UserPlus,
  UserCheck,
  Calendar,
  MessageSquare,
  FileText,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { Notification } from '@solar-crm/shared';
import { cn } from '@/lib/utils';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';

function getNotificationBadge(type: string) {
  switch (type) {
    case 'lead_assigned':
      return {
        icon: <UserPlus className="h-4 w-4 text-blue-500" />,
        label: 'Lead Assigned',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      };
    case 'lead_reassigned':
      return {
        icon: <UserCheck className="h-4 w-4 text-amber-500" />,
        label: 'Reassigned',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    case 'followup_due':
    case 'followup_due_today':
      return {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        label: 'Follow-up Due',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    case 'followup_overdue':
    case 'task_overdue':
      return {
        icon: <AlertCircle className="h-4 w-4 text-rose-500" />,
        label: 'Overdue',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      };
    case 'site_visit_changed':
      return {
        icon: <Calendar className="h-4 w-4 text-indigo-500" />,
        label: 'Site Visit',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      };
    case 'activity_shared':
      return {
        icon: <MessageSquare className="h-4 w-4 text-emerald-500" />,
        label: 'Timeline Activity',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    case 'quotation_status_changed':
      return {
        icon: <FileText className="h-4 w-4 text-purple-500" />,
        label: 'Quotation',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      };
    default:
      return {
        icon: <Bell className="h-4 w-4 text-primary" />,
        label: 'System Notification',
        color: 'bg-muted text-muted-foreground border-border',
      };
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const queryParams = {
    is_read: filterRead === 'all' ? undefined : filterRead === 'read',
    page,
    pageSize,
  };

  const { data, isLoading } = useNotifications(queryParams);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleActionClick = (notif: Notification) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    const meta = notif.metadata as Record<string, any> | undefined;
    if (meta?.lead_id) {
      navigate(`/leads/${meta.lead_id}`);
    } else if (meta?.quotation_id) {
      navigate('/quotations');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time activity alerts, task reminders, lead assignments and quotation updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || notifications.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setFilterRead('all');
            setPage(1);
          }}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            filterRead === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterRead('unread');
            setPage(1);
          }}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            filterRead === 'unread'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          Unread
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterRead('read');
            setPage(1);
          }}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            filterRead === 'read'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 opacity-25 mb-3" />
            <p className="font-semibold text-foreground">No notifications found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filterRead === 'unread' ? 'All caught up! No unread notifications.' : 'Activity alerts will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => {
              const badge = getNotificationBadge(notif.type);
              const meta = notif.metadata as Record<string, any> | undefined;
              const hasTarget = Boolean(meta?.lead_id || meta?.quotation_id);

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                    !notif.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/40',
                  )}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="mt-0.5 rounded-full bg-background p-2 shadow-sm border border-border shrink-0">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                            badge.color,
                          )}
                        >
                          {badge.label}
                        </span>
                        {!notif.is_read && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                            NEW
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <h4
                        className={cn(
                          'text-sm truncate',
                          !notif.is_read ? 'font-bold text-foreground' : 'font-medium text-foreground/80',
                        )}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {hasTarget && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(notif)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(notif.id)}
                        disabled={markReadMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(notif.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({data?.total ?? 0} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
