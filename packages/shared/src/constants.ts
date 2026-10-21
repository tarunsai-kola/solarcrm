// ─── Application Roles ───────────────────────────────────────────────────────
export const APP_ROLES = ['admin', 'inbound_sales', 'field_agent'] as const;
export type AppRole = (typeof APP_ROLES)[number];

// ─── Account Statuses ─────────────────────────────────────────────────────────
export const ACCOUNT_STATUSES = ['active', 'pending', 'suspended', 'inactive'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// ─── Lead Statuses ────────────────────────────────────────────────────────────
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'follow_up',
  'site_visit_scheduled',
  'site_visit_completed',
  'quotation_prepared',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
  'not_interested',
  'disqualified',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; badge: string; dotColor: string; description: string }
> = {
  new: {
    label: 'Fresh',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-500',
    description: 'New lead arrived, initial outreach pending',
  },
  contacted: {
    label: 'Contacted',
    badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    dotColor: 'bg-cyan-500',
    description: 'Initial customer touchpoint established',
  },
  qualified: {
    label: 'Qualified',
    badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    dotColor: 'bg-purple-500',
    description: 'Electricity bill & preliminary criteria confirmed',
  },
  follow_up: {
    label: 'Follow-up',
    badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    dotColor: 'bg-indigo-500',
    description: 'Active consultation in progress, callback scheduled',
  },
  site_visit_scheduled: {
    label: 'Site Visit Scheduled',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotColor: 'bg-amber-500',
    description: 'Field agent rooftop feasibility visit booked',
  },
  site_visit_completed: {
    label: 'Site Visit Completed',
    badge: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    dotColor: 'bg-yellow-500',
    description: 'Rooftop measurements and orientation assessed',
  },
  quotation_prepared: {
    label: 'Quotation Prepared',
    badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    dotColor: 'bg-violet-500',
    description: 'BOM pricing and system proposal drafted',
  },
  quotation_sent: {
    label: 'Quotation Sent',
    badge: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
    dotColor: 'bg-pink-500',
    description: 'Official proposal delivered to customer',
  },
  negotiation: {
    label: 'Negotiation',
    badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    dotColor: 'bg-orange-500',
    description: 'Commercial terms or subsidy discussion underway',
  },
  won: {
    label: 'Won',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    description: 'Deal closed, contract signed or advance received',
  },
  lost: {
    label: 'Lost',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    dotColor: 'bg-rose-500',
    description: 'Customer selected competitor or cancelled',
  },
  not_interested: {
    label: 'Not Interested',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
    dotColor: 'bg-slate-500',
    description: 'Customer declined solar installation proposal',
  },
  disqualified: {
    label: 'Disqualified',
    badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotColor: 'bg-zinc-500',
    description: 'Unsuitable roof, structural issues, or unreachable',
  },
};

// ─── Lead Temperatures ────────────────────────────────────────────────────────
export const LEAD_TEMPERATURES = ['hot', 'warm', 'cold', 'unclassified'] as const;
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];

// ─── Enquiry Types ────────────────────────────────────────────────────────────
export const ENQUIRY_TYPES = [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'housing_society',
  'other',
] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

// ─── Lead Sources ─────────────────────────────────────────────────────────────
export const LEAD_SOURCES = [
  'Meta Ads',
  'Tata Solar',
  'JustDial',
  'Other',
  'Website',
  'Referral',
  'Cold Call',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

// ─── Lead Activity Types ──────────────────────────────────────────────────────
export const LEAD_ACTIVITY_TYPES = [
  'call',
  'outgoing_call',
  'incoming_call',
  'note',
  'email',
  'site_visit',
  'meeting',
  'status_change',
  'site_visit_scheduled',
  'assignment',
  'whatsapp',
  'quotation_sent',
  'amendment',
  'other',
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

// ─── Call Outcomes ────────────────────────────────────────────────────────────
export const CALL_OUTCOMES = [
  'Connected',
  'No Answer',
  'Busy',
  'Call Back Requested',
  'Interested',
  'Not Interested',
  'Wrong Number',
  'Site Visit Required',
  'Other',
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_OUTCOME_CONFIG: Record<
  CallOutcome,
  { label: string; badge: string; color: string }
> = {
  Connected: {
    label: 'Connected',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    color: 'emerald',
  },
  'Call Back Requested': {
    label: 'Call Back Requested',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    color: 'amber',
  },
  Interested: {
    label: 'Interested',
    badge: 'bg-primary/15 text-primary border-primary/30',
    color: 'primary',
  },
  'Site Visit Required': {
    label: 'Site Visit Required',
    badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    color: 'purple',
  },
  'No Answer': {
    label: 'No Answer',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    color: 'rose',
  },
  Busy: {
    label: 'Busy',
    badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    color: 'orange',
  },
  'Not Interested': {
    label: 'Not Interested',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
    color: 'slate',
  },
  'Wrong Number': {
    label: 'Wrong Number',
    badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    color: 'zinc',
  },
  Other: {
    label: 'Other',
    badge: 'bg-muted text-muted-foreground border-border',
    color: 'gray',
  },
};

// ─── Follow-up Reminder & Completion Statuses ─────────────────────────────────
export const FOLLOWUP_REMINDER_STATUSES = ['pending', 'sent', 'dismissed', 'snoozed'] as const;
export type FollowUpReminderStatus = (typeof FOLLOWUP_REMINDER_STATUSES)[number];

export const FOLLOWUP_COMPLETION_STATUSES = ['pending', 'completed', 'cancelled', 'overdue'] as const;
export type FollowUpCompletionStatus = (typeof FOLLOWUP_COMPLETION_STATUSES)[number];

export const FOLLOWUP_TYPES = ['call', 'email', 'meeting', 'site_visit', 'whatsapp'] as const;
export type FollowUpType = (typeof FOLLOWUP_TYPES)[number];

// ─── Site Visit Statuses & Roof Suitability ───────────────────────────────────
export const SITE_VISIT_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'rescheduled',
] as const;
export type SiteVisitStatus = (typeof SITE_VISIT_STATUSES)[number];

export const ROOF_SUITABILITY = [
  'excellent',
  'good',
  'fair',
  'poor',
  'unsuitable',
  'needs_reinforcement',
] as const;
export type RoofSuitability = (typeof ROOF_SUITABILITY)[number];

// ─── Quotation Statuses ───────────────────────────────────────────────────────
export const QUOTATION_STATUSES = [
  'draft',
  'issued',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'revised',
  'cancelled',
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

// ─── Quotation Component Types ────────────────────────────────────────────────
export const COMPONENT_TYPES = [
  'solar_panel',
  'inverter',
  'battery',
  'structure',
  'bos',
  'installation',
  'net_metering',
  'other',
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

// ─── Calendar Integrations ────────────────────────────────────────────────────
export const CALENDAR_PROVIDERS = ['google', 'outlook', 'apple', 'caldav'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

export const CALENDAR_SYNC_STATUSES = ['active', 'paused', 'error', 'disconnected'] as const;
export type CalendarSyncStatus = (typeof CALENDAR_SYNC_STATUSES)[number];

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = [
  'lead_assigned',
  'follow_up_due',
  'site_visit_scheduled',
  'quotation_viewed',
  'quotation_accepted',
  'quotation_rejected',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ─── Audit Actions ────────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'import',
  'assign',
  'status_change',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ─── Role permissions map ─────────────────────────────────────────────────────
export const ROLE_NAV_PERMISSIONS: Record<AppRole, string[]> = {
  admin: [
    'dashboard',
    'leads',
    'follow-ups',
    'site-visits',
    'calendar',
    'quotations',
    'quote-components',
    'customers',
    'reports',
    'notifications',
    'user-management',
    'company-settings',
    'audit-logs',
    'integrations',
  ],
  inbound_sales: [
    'dashboard',
    'leads',
    'follow-ups',
    'site-visits',
    'calendar',
    'quotations',
    'quote-components',
    'customers',
    'reports',
    'notifications',
    'integrations',
  ],
  field_agent: [
    'dashboard',
    'leads',
    'follow-ups',
    'site-visits',
    'calendar',
    'quotations',
    'notifications',
  ],
};
