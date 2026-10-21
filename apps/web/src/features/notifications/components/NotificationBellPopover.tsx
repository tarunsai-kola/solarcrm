import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';
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
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { Notification } from '@solar-crm/shared';
import { cn } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '../hooks/use-notifications';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'lead_assigned':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'lead_reassigned':
      return <UserCheck className="h-4 w-4 text-amber-500" />;
    case 'followup_due':
    case 'followup_due_today':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'followup_overdue':
    case 'task_overdue':
      return <AlertCircle className="h-4 w-4 text-rose-500" />;
    case 'site_visit_changed':
      return <Calendar className="h-4 w-4 text-indigo-500" />;
    case 'activity_shared':
      return <MessageSquare className="h-4 w-4 text-emerald-500" />;
    case 'quotation_status_changed':
      return <FileText className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
}

function formatNotificationTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NotificationBellPopover() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { data: notifData, isLoading } = useNotifications({ pageSize: 5 });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = notifData?.items ?? [];

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    setOpen(false);

    const meta = notif.metadata as Record<string, any> | undefined;
    if (meta?.lead_id) {
      navigate(`/leads/${meta.lead_id}`);
    } else if (meta?.quotation_id) {
      navigate('/quotations');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications"
          id="header-notifications-btn"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-bold text-white',
                'bg-rose-500 shadow-sm animate-in fade-in zoom-in',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-2xl outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Bell className="mx-auto h-6 w-6 opacity-30 mb-2" />
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/60 text-left',
                    !notif.is_read && 'bg-primary/5',
                  )}
                >
                  <div className="mt-0.5 rounded-full bg-background p-1.5 shadow-sm border border-border shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          'text-xs truncate',
                          !notif.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/75 mt-1">
                      {formatNotificationTime(notif.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2 bg-muted/20">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <span>View all notifications</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
