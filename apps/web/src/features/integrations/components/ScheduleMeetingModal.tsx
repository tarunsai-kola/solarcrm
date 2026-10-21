import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  Smartphone,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { useCreateCalendarEvent, useIntegrationStatus } from '../hooks/use-integrations';
import {
  downloadIcsFile,
  getGoogleCalendarUrl,
  type CalendarEventDetails,
} from '../utils/calendar-utils';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string | undefined;
  customerName?: string | undefined;
  customerEmail?: string | undefined;
  customerAddress?: string | undefined;
  followUpId?: string | undefined;
  siteVisitId?: string | undefined;
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  leadId,
  customerName = 'Customer',
  customerEmail,
  customerAddress,
  followUpId,
  siteVisitId,
}: ScheduleMeetingModalProps) {
  const { data: integrations } = useIntegrationStatus();
  const googleIntegration = integrations?.find((i) => i.provider === 'google');
  const isGoogleConnected = googleIntegration?.connected ?? false;

  const createEventMutation = useCreateCalendarEvent();

  // Initialize start time to tomorrow at 11:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 45);

  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes(),
    )}`;
  };

  const [title, setTitle] = useState(`Rooftop Solar Consultation — ${customerName}`);
  const [startTime, setStartTime] = useState(formatDateTimeLocal(tomorrow));
  const [endTime, setEndTime] = useState(formatDateTimeLocal(tomorrowEnd));
  const [location, setLocation] = useState(customerAddress || '');
  const [attendeeEmail, setAttendeeEmail] = useState(customerEmail || '');
  const [createMeetLink, setCreateMeetLink] = useState(true);
  const [sendReminders, setSendReminders] = useState(true);
  const [description, setDescription] = useState(
    `Discussion on solar rooftop sizing, expected monthly electricity savings, PM Surya Ghar subsidy, and site feasibility survey.`,
  );

  // Success view state
  const [createdEventDetails, setCreatedEventDetails] = useState<CalendarEventDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModalClose = () => {
    setCreatedEventDetails(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    try {
      const res = await createEventMutation.mutateAsync({
        lead_id: leadId,
        follow_up_id: followUpId,
        site_visit_id: siteVisitId,
        title,
        description,
        start_time: startIso,
        end_time: endIso,
        location: location || undefined,
        attendee_email: attendeeEmail || undefined,
        create_meet_link: createMeetLink,
        send_reminders: sendReminders,
      });

      const details: CalendarEventDetails = {
        title,
        description,
        location: location || undefined,
        startTime: startIso,
        endTime: endIso,
        meetLink: res.meet_link || null,
        attendeeEmail: attendeeEmail || undefined,
      };

      setCreatedEventDetails(details);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to schedule meeting event.',
      );
    }
  };

  const handleCopyLink = () => {
    if (createdEventDetails?.meetLink) {
      navigator.clipboard.writeText(createdEventDetails.meetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={handleModalClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleModalClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {createdEventDetails ? (
          /* ── SUCCESS STATE WITH MOBILE NOTIFICATIONS & GOOGLE SYNC ── */
          <div className="space-y-5 text-center py-2 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground tracking-tight">
                Meeting Scheduled!
              </h3>
              <p className="text-xs text-muted-foreground">
                Your solar appointment has been recorded. Sync it to your phone below to ensure mobile alerts.
              </p>
            </div>

            {/* Mobile Reminder Notification Highlight Box */}
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Smartphone className="h-4 w-4" />
                Mobile Notifications Enabled
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Google Calendar will alert your smartphone with sound and vibration <strong>10 minutes</strong> and <strong>30 minutes</strong> before this consultation.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-medium text-primary">
                <span className="px-2.5 py-1 rounded-lg bg-background border border-primary/20 flex items-center gap-1">
                  <Bell className="h-3 w-3" /> 10m Phone Alarm
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-background border border-primary/20 flex items-center gap-1">
                  <Bell className="h-3 w-3" /> 30m Notification
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-background border border-primary/20 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 1h Email Alert
                </span>
              </div>
            </div>

            {/* Google Meet Link if Created */}
            {createdEventDetails.meetLink && (
              <div className="rounded-xl bg-muted/60 border border-border p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden text-left">
                  <Video className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-mono text-foreground truncate">
                    {createdEventDetails.meetLink}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shrink-0 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            {/* Action Buttons: Sync to Google & Download ICS */}
            <div className="space-y-2.5 pt-2">
              <a
                href={getGoogleCalendarUrl(createdEventDetails)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <Calendar className="h-4 w-4" />
                Add to Google Calendar (Sync to Phone & Web)
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => downloadIcsFile(createdEventDetails)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download .ICS (Phone)
                </button>

                {createdEventDetails.meetLink && (
                  <a
                    href={createdEventDetails.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" /> Join Meet
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleModalClose}
                className="w-full py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Close & Return to Client Page
              </button>
            </div>
          </div>
        ) : (
          /* ── SCHEDULING FORM ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Schedule Meeting & Mobile Alert
                </h3>
                <p className="text-xs text-muted-foreground">
                  Set up consultation or site visit for {customerName}
                </p>
              </div>
            </div>

            {/* Google Sync Status Callout */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <Smartphone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Google Calendar & Mobile Notifications Ready</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Scheduled events include automated 10m & 30m phone alarm triggers and 1-click Google Calendar sync.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Meeting Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Customer Email (for calendar invitation & RSVP)
              </label>
              <input
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location / Rooftop Premises
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Client premises address or Google Meet"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Mobile Notification & Options */}
            <div className="space-y-2 rounded-xl bg-muted/40 border border-border p-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={createMeetLink}
                  onChange={(e) => setCreateMeetLink(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-emerald-500" />
                  Generate Google Meet video link
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={sendReminders}
                  onChange={(e) => setSendReminders(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Bell className="h-4 w-4 text-primary" />
                  Trigger Mobile Push Alarms (10m & 30m prior)
                </span>
              </label>
            </div>

            {/* Agenda / Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Meeting Agenda & Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEventMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {createEventMutation.isPending ? 'Scheduling...' : 'Schedule Event'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
