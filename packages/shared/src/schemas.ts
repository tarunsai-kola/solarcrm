import { z } from 'zod';

import {
  ACCOUNT_STATUSES,
  APP_ROLES,
  AUDIT_ACTIONS,
  CALENDAR_PROVIDERS,
  CALENDAR_SYNC_STATUSES,
  CALL_OUTCOMES,
  COMPONENT_TYPES,
  ENQUIRY_TYPES,
  FOLLOWUP_COMPLETION_STATUSES,
  FOLLOWUP_REMINDER_STATUSES,
  FOLLOWUP_TYPES,
  LEAD_ACTIVITY_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TEMPERATURES,
  NOTIFICATION_TYPES,
  QUOTATION_STATUSES,
  ROOF_SUITABILITY,
  SITE_VISIT_STATUSES,
} from './constants.js';

export const uuidSchema = z.string().uuid();
export const optionalUuidSchema = z.preprocess(
  (val) => (val === '' ? null : val),
  uuidSchema.nullable().optional(),
);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// ─── 1. Organization ──────────────────────────────────────────────────────────
export const organizationSchema = z.object({
  id: uuidSchema,
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ─── 2. User / Profile ────────────────────────────────────────────────────────
export const profileSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  company_id: uuidSchema.optional(),
  email: z.string().email(),
  full_name: z.string().min(2).max(150),
  role: z.enum(APP_ROLES),
  account_status: z.enum(ACCOUNT_STATUSES).default('active'),
  avatar_url: z.string().url().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(150),
  role: z.enum(APP_ROLES),
  phone: z.string().max(30).optional(),
  organization_id: uuidSchema.optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
});

export const optionalPasswordSchema = z.preprocess(
  (val) => (!val || (typeof val === 'string' && val.trim() === '') ? undefined : typeof val === 'string' ? val.trim() : val),
  z.string().min(6, 'Password must be at least 6 characters').optional()
);

export const createInboundSalesSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(5, 'Phone number is required').max(30),
  send_invite: z.boolean().default(true),
  password: optionalPasswordSchema,
});

export const createFieldAgentSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(5, 'Phone number is required').max(30),
  address: z.string().min(5, 'Address is required'),
  pincode: z.string().min(4, 'Pincode is required').max(10),
  service_areas: z.array(z.string()).min(1, 'At least one service area is required'),
  service_pincodes: z.array(z.string()).default([]),
  max_active_leads: z.coerce.number().int().min(1).max(200).default(15),
  availability: z.enum(['available', 'busy', 'on_leave', 'offline']).default('available'),
  experience_years: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  send_invite: z.boolean().default(true),
  password: optionalPasswordSchema,
});

export const updateUserStatusSchema = z.object({
  account_status: z.enum(ACCOUNT_STATUSES),
});

export const userFilterSchema = paginationSchema.extend({
  role: z.enum(APP_ROLES).optional(),
  account_status: z.enum(ACCOUNT_STATUSES).optional(),
  search: z.string().max(200).optional(),
});

export const updateUserSchema = createUserSchema
  .omit({ email: true, password: true, organization_id: true })
  .extend({
    account_status: z.enum(ACCOUNT_STATUSES).optional(),
    is_active: z.boolean().optional(),
    avatar_url: z.string().url().nullable().optional(),
    address: z.string().optional(),
    pincode: z.string().optional(),
    service_areas: z.array(z.string()).optional(),
    service_pincodes: z.array(z.string()).optional(),
    max_active_leads: z.number().int().optional(),
    availability: z.enum(['available', 'busy', 'on_leave', 'offline']).optional(),
    password: optionalPasswordSchema,
  })
  .partial();

// ─── 3. Field Agent Profile ───────────────────────────────────────────────────
export const fieldAgentProfileSchema = z.object({
  user_id: uuidSchema,
  organization_id: uuidSchema,
  address: z.string().nullable().optional(),
  pincode: z.string().min(4).max(10).nullable().optional(),
  service_pincodes: z.array(z.string()).default([]),
  service_areas: z.array(z.string()).default([]),
  availability: z.enum(['available', 'busy', 'on_leave', 'offline']).default('available'),
  max_active_leads: z.number().int().min(0).max(200).default(15),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  experience_years: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const updateFieldAgentProfileSchema = fieldAgentProfileSchema
  .omit({ user_id: true, organization_id: true, created_at: true, updated_at: true })
  .partial();

// ─── 4. Leads ─────────────────────────────────────────────────────────────────
export const leadSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  company_id: uuidSchema.optional(),
  customer_name: z.string().min(1).max(150),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().min(5).max(30),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  pincode: z.string().min(4).max(10).nullable().optional(),
  enquiry_type: z.enum(ENQUIRY_TYPES).default('residential'),
  lead_source: z.enum(LEAD_SOURCES).default('Other'),
  source: z.string().optional(),
  initial_note: z.string().nullable().optional(),
  status: z.enum(LEAD_STATUSES).default('new'),
  temperature: z.enum(LEAD_TEMPERATURES).default('unclassified'),
  inbound_sales_id: uuidSchema.nullable().optional(),
  assigned_field_agent_id: uuidSchema.nullable().optional(),
  assigned_to: uuidSchema.nullable().optional(),
  next_follow_up_at: z.string().datetime().nullable().optional(),
  created_by: uuidSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const checkDuplicateLeadSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  exclude_id: uuidSchema.optional(),
});

export const createLeadSchema = z.object({
  customer_name: z.string().min(2, 'Customer name must be at least 2 characters').max(150),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').max(30),
  email: z.string().email('Please enter a valid email address').nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit postal code')
    .nullable()
    .optional()
    .or(z.literal('')),
  enquiry_type: z.enum(ENQUIRY_TYPES).default('residential'),
  lead_source: z.enum(LEAD_SOURCES).default('Other'),
  initial_note: z.string().nullable().optional(),
  status: z.enum(LEAD_STATUSES).default('new').optional(),
  temperature: z.enum(LEAD_TEMPERATURES).default('unclassified').optional(),
  inbound_sales_id: optionalUuidSchema,
  assigned_field_agent_id: optionalUuidSchema,
  assigned_to: optionalUuidSchema,
  next_follow_up_at: z.string().datetime().nullable().optional(),
  allow_duplicate: z.boolean().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const bulkAssignLeadsSchema = z.object({
  lead_ids: z.array(uuidSchema).min(1, 'Select at least one lead'),
  assigned_field_agent_id: optionalUuidSchema,
  inbound_sales_id: optionalUuidSchema,
});

export const assignFieldAgentSchema = z.object({
  agent_id: uuidSchema,
  override_reason: z.string().max(500).optional(),
});

export const bulkStatusUpdateSchema = z.object({
  lead_ids: z.array(uuidSchema).min(1, 'Select at least one lead'),
  status: z.enum(LEAD_STATUSES),
  notes: z.string().optional(),
});

export const leadFilterSchema = paginationSchema.extend({
  status: z.enum(LEAD_STATUSES).optional(),
  temperature: z.enum(LEAD_TEMPERATURES).optional(),
  lead_source: z.enum(LEAD_SOURCES).optional(),
  source: z.string().optional(),
  enquiry_type: z.enum(ENQUIRY_TYPES).optional(),
  pincode: z.string().optional(),
  assigned_field_agent_id: optionalUuidSchema,
  assigned_to: optionalUuidSchema,
  inbound_sales_id: optionalUuidSchema,
  search: z.string().max(200).optional(),
  quick_filter: z
    .enum(['all', 'fresh', 'contacted', 'follow_up_due', 'overdue', 'won', 'lost'])
    .optional(),
  sort_by: z
    .enum(['created_at', 'customer_name', 'next_follow_up_at', 'status', 'temperature'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  ...dateRangeSchema.shape,
});

// ─── 5. Lead Activities ───────────────────────────────────────────────────────
export const leadActivitySchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  lead_id: uuidSchema,
  author_id: uuidSchema,
  activity_type: z.enum(LEAD_ACTIVITY_TYPES),
  outcome: z.string().nullable().optional(),
  notes: z.string().min(1).max(5000),
  duration_seconds: z.number().int().min(0).nullable().optional(),
  attachment_url: z.string().url().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
  follow_up_id: uuidSchema.nullable().optional(),
  site_visit_id: uuidSchema.nullable().optional(),
  quotation_id: uuidSchema.nullable().optional(),
  amends_activity_id: uuidSchema.nullable().optional(),
  is_amendment: z.boolean().default(false),
  amendment_reason: z.string().nullable().optional(),
  occurred_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const createLeadActivitySchema = z.object({
  lead_id: uuidSchema,
  activity_type: z.enum(LEAD_ACTIVITY_TYPES),
  outcome: z.string().nullable().optional(),
  notes: z.string().min(1).max(5000),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  attachment_url: z.string().url().nullable().optional().or(z.literal('')),
  attachment_name: z.string().max(255).nullable().optional().or(z.literal('')),
  follow_up_id: uuidSchema.optional().nullable(),
  site_visit_id: uuidSchema.optional().nullable(),
  quotation_id: uuidSchema.optional().nullable(),
  occurred_at: z.string().datetime().optional(),
});

export const createCallLogSchema = z.object({
  lead_id: uuidSchema,
  activity_type: z
    .enum([
      'outgoing_call',
      'incoming_call',
      'whatsapp',
      'email',
      'site_visit',
      'meeting',
      'other',
    ])
    .default('outgoing_call'),
  outcome: z.enum(CALL_OUTCOMES),
  temperature: z.enum(LEAD_TEMPERATURES).optional(),
  notes: z.string().min(1, 'Detailed notes are required').max(5000),
  follow_up_required: z.boolean().default(false),
  next_follow_up_at: z.string().datetime().optional().nullable(),
  follow_up_owner: uuidSchema.optional().nullable(),
  duration_seconds: z.number().int().min(0).max(86400).optional().nullable(),
  attachment_url: z.string().url().nullable().optional().or(z.literal('')),
  attachment_name: z.string().max(255).nullable().optional().or(z.literal('')),
});

export const amendLeadActivitySchema = z.object({
  notes: z.string().min(1, 'Correction details are required').max(5000),
  amendment_reason: z.string().min(2, 'Reason for correction is required').max(500),
});

// ─── 6. Follow-up ─────────────────────────────────────────────────────────────
export const followUpSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  lead_id: uuidSchema,
  assigned_to: uuidSchema,
  due_at: z.string().datetime(),
  reminder_status: z.enum(FOLLOWUP_REMINDER_STATUSES).default('pending'),
  completion_status: z.enum(FOLLOWUP_COMPLETION_STATUSES).default('pending'),
  notes: z.string().max(5000).nullable().optional(),
  rescheduled_count: z.number().int().default(0),
  last_rescheduled_at: z.string().datetime().nullable().optional(),
  reschedule_reason: z.string().nullable().optional(),
  created_by: uuidSchema,
  completed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createFollowUpSchema = z.object({
  lead_id: uuidSchema,
  assigned_to: uuidSchema.optional(),
  due_at: z.string().datetime(),
  notes: z.string().max(5000).nullable().optional(),
  reminder_status: z.enum(FOLLOWUP_REMINDER_STATUSES).default('pending').optional(),
});

export const updateFollowUpSchema = z.object({
  due_at: z.string().datetime().optional(),
  reminder_status: z.enum(FOLLOWUP_REMINDER_STATUSES).optional(),
  completion_status: z.enum(FOLLOWUP_COMPLETION_STATUSES).optional(),
  notes: z.string().max(5000).nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
});

export const rescheduleFollowUpSchema = z.object({
  due_at: z.string().datetime('Must be a valid ISO datetime'),
  reason: z.string().min(1, 'Reschedule reason is required').max(500),
  notes: z.string().max(2000).optional().nullable(),
});

export const completeFollowUpSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
  outcome: z.string().max(200).optional().nullable(),
});

export const followUpFilterSchema = paginationSchema.extend({
  tab: z.enum(['all', 'overdue', 'due_today', 'upcoming', 'completed', 'cancelled']).optional(),
  status: z.enum(['all', 'pending', 'completed', 'cancelled', 'overdue']).optional(),
  assigned_to: uuidSchema.optional(),
  lead_id: uuidSchema.optional(),
  temperature: z.enum(LEAD_TEMPERATURES).optional(),
  search: z.string().max(200).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ─── 7. Site Visit ────────────────────────────────────────────────────────────
export const siteVisitSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  lead_id: uuidSchema,
  field_agent_id: uuidSchema,
  scheduled_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
  visit_status: z.enum(SITE_VISIT_STATUSES).default('scheduled'),
  site_observations: z.string().nullable().optional(),
  roof_suitability: z.enum(ROOF_SUITABILITY).nullable().optional(),
  electricity_bill_amount: z.number().min(0).nullable().optional(),
  monthly_consumption_kwh: z.number().min(0).nullable().optional(),
  recommended_system_capacity_kw: z.number().min(0).nullable().optional(),
  attachments: z.array(z.record(z.unknown())).default([]),
  next_action: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createSiteVisitSchema = z.object({
  lead_id: uuidSchema,
  field_agent_id: uuidSchema,
  scheduled_at: z.string().datetime(),
  visit_status: z.enum(SITE_VISIT_STATUSES).default('scheduled').optional(),
  site_observations: z.string().nullable().optional(),
  roof_suitability: z.enum(ROOF_SUITABILITY).nullable().optional(),
  electricity_bill_amount: z.number().min(0).nullable().optional(),
  monthly_consumption_kwh: z.number().min(0).nullable().optional(),
  recommended_system_capacity_kw: z.number().min(0).nullable().optional(),
  attachments: z.array(z.record(z.unknown())).optional(),
  next_action: z.string().nullable().optional(),
});

export const updateSiteVisitSchema = createSiteVisitSchema
  .omit({ lead_id: true })
  .extend({
    completed_at: z.string().datetime().nullable().optional(),
  })
  .partial();

// ─── 8. Notifications ─────────────────────────────────────────────────────────
export const notificationSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  user_id: uuidSchema,
  type: z.string().default('system'),
  title: z.string().max(200),
  body: z.string().max(1000),
  is_read: z.boolean().default(false),
  read_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});

// ─── 9. Calendar Integrations ─────────────────────────────────────────────────
export const calendarIntegrationSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  user_id: uuidSchema,
  provider: z.enum(CALENDAR_PROVIDERS),
  email: z.string().nullable().optional(),
  calendar_id: z.string().nullable().optional(),
  sync_enabled: z.boolean().default(true),
  sync_status: z.enum(CALENDAR_SYNC_STATUSES).default('active'),
  last_synced_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ─── 10. Calendar Events ──────────────────────────────────────────────────────
export const calendarEventSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  user_id: uuidSchema,
  lead_id: uuidSchema.nullable().optional(),
  site_visit_id: uuidSchema.nullable().optional(),
  follow_up_id: uuidSchema.nullable().optional(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().nullable().optional(),
  external_event_id: z.string().nullable().optional(),
  meet_link: z.string().nullable().optional(),
  reminders_sent: z.boolean().default(false),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createCalendarEventSchema = z.object({
  lead_id: uuidSchema.optional(),
  site_visit_id: uuidSchema.optional(),
  follow_up_id: uuidSchema.optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().max(300).optional(),
  create_meet_link: z.boolean().default(false),
  attendee_email: z.string().email().optional(),
  send_reminders: z.boolean().default(true),
});

export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
  create_meet_link: z.boolean().optional(),
});

// ─── 10b. Communications: Email & WhatsApp ───────────────────────────────────
export const sendEmailSchema = z.object({
  lead_id: uuidSchema,
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  template_type: z.enum(['consultation_follow_up', 'site_visit_confirmation', 'quotation_ready', 'custom']).default('custom'),
});

export const sendWhatsAppSchema = z.object({
  lead_id: uuidSchema,
  phone: z.string().min(10).max(15),
  template_type: z.enum(['greeting', 'site_visit_confirmation', 'follow_up', 'quotation_ready', 'custom']),
  custom_text: z.string().max(2000).optional(),
  automated_send: z.boolean().default(false),
});

export const communicationLogSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  lead_id: uuidSchema.nullable().optional(),
  user_id: uuidSchema.nullable().optional(),
  channel: z.enum(['email', 'whatsapp']),
  recipient: z.string(),
  subject: z.string().nullable().optional(),
  body_snippet: z.string().nullable().optional(),
  status: z.enum(['sent', 'delivered', 'failed', 'opened', 'simulated', 'unconfigured']),
  provider: z.string(),
  provider_message_id: z.string().nullable().optional(),
  error_details: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});

// ─── 11. Quotations ───────────────────────────────────────────────────────────
export const quotationItemSchema = z.object({
  id: uuidSchema,
  quotation_id: uuidSchema,
  component_name: z.string().min(1).max(200),
  component_type: z.enum(COMPONENT_TYPES),
  description: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  quantity: z.number().min(0.001),
  unit: z.string().default('nos'),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
  sort_order: z.number().int().default(0),
  is_optional: z.boolean().default(false),
  tax_rate: z.number().min(0).default(0),
  created_at: z.string().datetime(),
});

export const createQuotationItemInputSchema = z.object({
  id: uuidSchema.optional(),
  component_name: z.string().min(1).max(200),
  component_type: z.enum(COMPONENT_TYPES).default('other'),
  description: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  quantity: z.number().min(0.001),
  unit: z.string().default('nos'),
  unit_price: z.number().min(0),
  sort_order: z.number().int().default(0),
  is_optional: z.boolean().default(false),
  tax_rate: z.number().min(0).default(0),
});

export const quotationSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  company_id: uuidSchema.nullable().optional(),
  lead_id: uuidSchema,
  created_by: uuidSchema,
  quotation_number: z.string().min(1).max(50),
  version: z.number().int().min(1).default(1),
  title: z.string().min(1).max(200),
  status: z.enum(QUOTATION_STATUSES).default('draft'),
  system_capacity_kw: z.number().min(0).nullable().optional(),
  phase: z.string().nullable().optional(),
  system_type: z.string().nullable().optional(),
  subtotal: z.number().min(0),
  discount_amount: z.number().min(0).default(0),
  taxable_value: z.number().min(0).default(0),
  gst_rate: z.number().min(0).default(13.80),
  tax_amount: z.number().min(0).default(0),
  kseb_charges: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  advance_percentage: z.number().min(0).max(100).default(20),
  advance_amount: z.number().min(0).default(0),
  balance_amount: z.number().min(0).default(0),
  valid_until: z.string().nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  warranty_terms: z.string().nullable().optional(),
  exclusions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  authorized_signature_name: z.string().nullable().optional(),
  parent_quotation_id: uuidSchema.nullable().optional(),
  is_latest: z.boolean().default(true),
  company_snapshot: z.record(z.unknown()).default({}),
  items: z.array(quotationItemSchema).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createQuotationInputSchema = z.object({
  lead_id: uuidSchema,
  title: z.string().min(1).max(200).default('Solar Rooftop System Quotation'),
  system_capacity_kw: z.number().min(0.01).max(10000),
  phase: z.string().default('3-Phase'),
  system_type: z.string().default('On-Grid'),
  discount_amount: z.number().min(0).default(0),
  gst_rate: z.number().min(0).max(100).default(13.80),
  kseb_charges: z.number().min(0).default(0),
  advance_percentage: z.number().min(0).max(100).default(20),
  valid_until: z.string().nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  warranty_terms: z.string().nullable().optional(),
  exclusions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  authorized_signature_name: z.string().nullable().optional(),
  items: z.array(createQuotationItemInputSchema).min(1, 'At least one line item is required'),
});

export const updateQuotationInputSchema = createQuotationInputSchema
  .omit({ lead_id: true })
  .partial()
  .extend({
    items: z.array(createQuotationItemInputSchema).min(1).optional(),
  });

export const reviseQuotationInputSchema = z.object({
  notes: z.string().optional(),
  changes: updateQuotationInputSchema.optional(),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(QUOTATION_STATUSES),
  notes: z.string().optional(),
});

export const quotationFilterSchema = paginationSchema.extend({
  lead_id: uuidSchema.optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
  search: z.string().max(100).optional(),
  is_latest: z.boolean().optional(),
});

// ─── 12. Default Quote Components ─────────────────────────────────────────────
export const defaultQuoteComponentSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  name: z.string().min(2).max(200),
  component_type: z.enum(COMPONENT_TYPES),
  default_unit: z.string().default('nos'),
  default_unit_price: z.number().min(0),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createDefaultQuoteComponentSchema = z.object({
  name: z.string().min(2).max(200),
  component_type: z.enum(COMPONENT_TYPES),
  default_unit: z.string().default('nos'),
  default_unit_price: z.number().min(0),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().default(0).optional(),
  is_active: z.boolean().default(true).optional(),
});

export const updateDefaultQuoteComponentSchema = createDefaultQuoteComponentSchema.partial();

// ─── 13. Company Settings ─────────────────────────────────────────────────────
export const companySettingsSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  company_name: z.string().min(2).max(200),
  legal_name: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  credential_line: z.string().nullable().optional(),
  gst_number: z.string().min(5).max(20).nullable().optional(),
  pan_number: z.string().min(5).max(15).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  website: z.string().url().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  currency: z.string().length(3).default('INR'),
  timezone: z.string().max(100).default('Asia/Kolkata'),
  product_warranty_years: z.number().int().min(0).default(10),
  performance_warranty_years: z.number().int().min(0).default(25),
  inverter_warranty_years: z.number().int().min(0).default(5),
  battery_warranty_years: z.number().int().min(0).default(5),
  tax_rates: z.record(z.unknown()).default({ cgst_rate: 6.9, sgst_rate: 6.9, igst_rate: 13.8 }),
  tax_rate: z.number().min(0).max(100).default(13.8),
  kseb_charges: z.number().min(0).default(0),
  terms_and_conditions: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const updateCompanySettingsSchema = companySettingsSchema
  .omit({ id: true, organization_id: true, created_at: true, updated_at: true })
  .partial();

// ─── 14. Company Offices ──────────────────────────────────────────────────────
export const companyOfficeSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  office_name: z.string().min(2).max(100),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(4).max(10),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  is_headquarters: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createCompanyOfficeSchema = z.object({
  office_name: z.string().min(2).max(100),
  address: z.string().min(1),
  city: z.string().min(1).max(100).default('Kochi'),
  state: z.string().min(1).max(100).default('Kerala'),
  pincode: z.string().min(4).max(10).default('682001'),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  is_headquarters: z.boolean().default(false),
});

export const updateCompanyOfficeSchema = createCompanyOfficeSchema.partial();

// ─── 15. Company Bank Accounts ────────────────────────────────────────────────
export const companyBankAccountSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  bank_name: z.string().min(2).max(100),
  account_holder_name: z.string().min(2).max(150),
  account_number: z.string().min(5).max(40),
  ifsc_code: z.string().min(4).max(15),
  branch_name: z.string().nullable().optional(),
  upi_id: z.string().nullable().optional(),
  is_primary: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createCompanyBankAccountSchema = z.object({
  bank_name: z.string().min(2).max(100),
  account_holder_name: z.string().min(2).max(150),
  account_number: z.string().min(5).max(40),
  ifsc_code: z.string().min(4).max(15),
  branch_name: z.string().nullable().optional(),
  upi_id: z.string().nullable().optional(),
  is_primary: z.boolean().default(false),
});

export const updateCompanyBankAccountSchema = createCompanyBankAccountSchema.partial();


// ─── 16. Audit Logs ───────────────────────────────────────────────────────────
export const auditLogSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  actor_id: uuidSchema.nullable(),
  action: z.enum(AUDIT_ACTIONS),
  entity_type: z.string().max(100),
  entity_id: uuidSchema.nullable().optional(),
  old_values: z.record(z.unknown()).nullable().optional(),
  new_values: z.record(z.unknown()).nullable().optional(),
  ip_address: z.string().max(45).nullable().optional(),
  user_agent: z.string().max(500).nullable().optional(),
  created_at: z.string().datetime(),
});

export const auditLogFilterSchema = paginationSchema.extend({
  actor_id: uuidSchema.optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  entity_type: z.string().optional(),
  ...dateRangeSchema.shape,
});

// ─── 17. Dashboard & Analytics ────────────────────────────────────────────────
export const dashboardFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['7d', '30d', 'month', '90d', 'ytd', 'all']).optional(),
  team_member_id: z.string().min(1).optional(),
});

export const dashboardDrillDownSchema = paginationSchema.extend({
  metric: z.enum([
    'total_leads',
    'fresh_leads',
    'contacted_leads',
    'hot_and_warm_leads',
    'hot_leads',
    'warm_leads',
    'follow_ups_due_today',
    'overdue_follow_ups',
    'site_visits_scheduled',
    'site_visits_completed',
    'quotations_sent',
    'won_leads',
    'lost_leads',
    'pending_site_reports',
  ]),
  from: z.string().optional(),
  to: z.string().optional(),
  team_member_id: z.string().min(1).optional(),
});

// ─── API Responses ────────────────────────────────────────────────────────────
export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalPages: z.number().int().min(0),
  });

// ─── 18. Advanced Admin Analytics & CRM Controls ─────────────────────────────
export const analyticsFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['7d', '30d', 'month', '90d', 'ytd', 'all']).optional(),
  user_id: z.string().optional(),
  role: z.enum(['inbound_sales', 'field_agent', 'all']).optional(),
  lead_source: z.string().optional(),
  status: z.string().optional(),
  temperature: z.enum(['hot', 'warm', 'cold', 'unclassified']).optional(),
  pincode: z.string().optional(),
});

export const exportReportSchema = z.object({
  type: z.enum(['leads', 'sales_performance', 'agent_performance', 'quotations', 'audit_logs']),
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['7d', '30d', 'month', '90d', 'ytd', 'all']).optional(),
  user_id: z.string().optional(),
  lead_source: z.string().optional(),
  status: z.string().optional(),
  temperature: z.string().optional(),
  pincode: z.string().optional(),
});

export const leadStatusConfigItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(50),
  is_active: z.boolean(),
  is_system: z.boolean().default(false),
  color: z.string().default('blue'),
  sort_order: z.number().int().default(0),
});

export const enquiryTypeConfigItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(50),
  is_active: z.boolean(),
  sort_order: z.number().int().default(0),
});

export const leadSourceConfigItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  is_active: z.boolean(),
  is_campaign: z.boolean().default(false),
});

export const assignmentRulesSchema = z.object({
  mode: z.enum(['pincode_match', 'round_robin', 'manual']).default('pincode_match'),
  auto_assign: z.boolean().default(true),
  fallback_to_round_robin: z.boolean().default(true),
  max_workload_cap: z.number().int().min(1).max(100).default(15),
  reassign_uncontacted_after_hours: z.number().int().min(1).max(168).default(24),
});

export const reminderPreferencesSchema = z.object({
  lead_times_minutes: z.array(z.number().int()).default([15, 60, 1440]),
  daily_digest_time: z.string().default('09:00'),
  enable_email: z.boolean().default(true),
  enable_in_app: z.boolean().default(true),
  enable_whatsapp: z.boolean().default(true),
  overdue_escalation_hours: z.number().int().min(1).max(168).default(24),
});

export const crmConfigSchema = z.object({
  lead_statuses: z.array(leadStatusConfigItemSchema),
  enquiry_types: z.array(enquiryTypeConfigItemSchema),
  lead_sources: z.array(leadSourceConfigItemSchema),
  assignment_rules: assignmentRulesSchema,
  reminder_preferences: reminderPreferencesSchema,
});

export const updateCrmConfigSchema = crmConfigSchema.partial();

