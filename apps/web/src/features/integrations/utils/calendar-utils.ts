/**
 * Calendar Utilities for Google Calendar Universal Sync & Mobile Alarms
 */

export interface CalendarEventDetails {
  title: string;
  description?: string | null | undefined;
  location?: string | null | undefined;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  meetLink?: string | null | undefined;
  attendeeEmail?: string | null | undefined;
}

/**
 * Formats ISO date string to Google Calendar UTC format: YYYYMMDDTHHmmssZ
 */
export function formatGCalDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  } catch {
    return '';
  }
}

/**
 * Builds universal Google Calendar web/mobile render URL.
 * When opened on mobile (Android/iOS) or desktop, this launches Google Calendar
 * with pre-filled title, dates, meet link, and automated mobile notifications.
 */
export function getGoogleCalendarUrl(event: CalendarEventDetails): string {
  const startStr = formatGCalDate(event.startTime);
  const endStr = formatGCalDate(event.endTime);
  const dates = startStr && endStr ? `${startStr}/${endStr}` : '';

  let details = event.description || '';
  if (event.meetLink) {
    details += `\n\n🎥 Google Meet Video Link: ${event.meetLink}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
  });

  if (dates) {
    params.set('dates', dates);
  }

  if (details) {
    params.set('details', details);
  }

  if (event.location) {
    params.set('location', event.location);
  }

  if (event.attendeeEmail) {
    params.set('add', event.attendeeEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads an RFC 5545 compliant .ICS calendar file
 * with pre-configured VALARM sound & popup reminder notifications
 * at -10 minutes and -30 minutes for mobile phone calendar apps (iOS/Android).
 */
export function downloadIcsFile(event: CalendarEventDetails): void {
  const startStr = formatGCalDate(event.startTime);
  const endStr = formatGCalDate(event.endTime);
  const nowStr = formatGCalDate(new Date().toISOString());

  let desc = (event.description || '').replace(/\r?\n/g, '\\n');
  if (event.meetLink) {
    desc += `\\n\\n🎥 Google Meet: ${event.meetLink}`;
  }

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sunbeam Solar CRM//Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:crm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@sunbeam.solar`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title.replace(/\r?\n/g, ' ')}`,
    `DESCRIPTION:${desc}`,
    event.location ? `LOCATION:${event.location.replace(/\r?\n/g, ' ')}` : '',
    event.meetLink ? `URL:${event.meetLink}` : '',
    'STATUS:CONFIRMED',
    // Mobile Notification Alarm 1: 10 minutes before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Solar Consultation Meeting in 10 minutes',
    'TRIGGER:-PT10M',
    'END:VALARM',
    // Mobile Notification Alarm 2: 30 minutes before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Solar Consultation Meeting in 30 minutes',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  link.setAttribute('download', `${safeFilename || 'solar_meeting'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
