import { useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Plus,
  RefreshCw,
  Smartphone,
  Video,
} from 'lucide-react';
import { useCalendarEvents, useConnectDemoGoogle, useIntegrationStatus } from '../hooks/use-integrations';
import { ScheduleMeetingModal } from '../components/ScheduleMeetingModal';
import { downloadIcsFile, getGoogleCalendarUrl } from '../utils/calendar-utils';

export function CalendarPage() {
  const { data: integrations } = useIntegrationStatus();
  const google = integrations?.find((i) => i.provider === 'google');
  const { data: events, isLoading, refetch } = useCalendarEvents();
  const connectDemoMutation = useConnectDemoGoogle();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Solar Calendar & Mobile Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage consultations, rooftop assessments, and Google Meet video appointments with phone notifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* Sync Status Callout */}
      {!google?.connected ? (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-700 dark:text-amber-400">
          <div className="space-y-0.5">
            <p className="font-bold">Google Calendar & Mobile Sync:</p>
            <p className="text-[11px] opacity-90">
              Connect your Google account to automatically push consultation reminders to the Google Calendar app on your phone.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => connectDemoMutation.mutate()}
              disabled={connectDemoMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              {connectDemoMutation.isPending ? 'Connecting...' : 'Quick Connect Google Calendar'}
            </button>
            <a
              href="/integrations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-600/40 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-500/10 transition-colors"
            >
              OAuth Settings <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold flex items-center gap-2 text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Google Calendar & Mobile Alerts Active
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                Account: <span className="font-mono">{google.account_email || 'Connected Google Account'}</span> • Timezone: Asia/Kolkata
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Bell className="h-3 w-3" /> 10m & 30m Alarms Set
            </span>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Scheduled Appointments ({events?.length || 0})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading calendar events...
          </div>
        ) : !events || events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
            <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-bold text-foreground">No Upcoming Meetings</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Schedule your first rooftop survey or consultation video call using the button above.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const startDate = new Date(ev.start_time);
              const endDate = new Date(ev.end_time);

              const eventDetails = {
                title: ev.title,
                description: ev.description,
                location: ev.location,
                startTime: ev.start_time,
                endTime: ev.end_time,
                meetLink: ev.meet_link,
              };

              const gcalUrl = getGoogleCalendarUrl(eventDetails);

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{ev.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {startDate.toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' • '}
                            {startDate.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {endDate.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ev.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : ev.status === 'cancelled'
                              ? 'bg-destructive/10 text-destructive border border-destructive/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {ev.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Bell className="h-2.5 w-2.5" /> 10m & 30m Alarm
                        </span>
                      </div>
                    </div>

                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}

                    {ev.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Calendar Sync Toolbar */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {ev.meet_link ? (
                        <a
                          href={ev.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          <Video className="h-3.5 w-3.5" /> Join Meet <ExternalLink className="h-2.5 w-2.5 opacity-80" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> In-person / On-site
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => downloadIcsFile(eventDetails)}
                          title="Download .ICS for phone calendar"
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-medium">.ICS</span>
                        </button>

                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in Google Calendar app on phone or web"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          <CalendarIcon className="h-3 w-3" />
                          Sync to Google
                          <ExternalLink className="h-2.5 w-2.5 opacity-80" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ScheduleMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
