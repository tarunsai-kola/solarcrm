import type { z } from 'zod';

import type {
  amendLeadActivitySchema,
  assignFieldAgentSchema,
  auditLogFilterSchema,
  auditLogSchema,
  bulkAssignLeadsSchema,
  bulkStatusUpdateSchema,
  calendarEventSchema,
  calendarIntegrationSchema,
  checkDuplicateLeadSchema,
  companyBankAccountSchema,
  companyOfficeSchema,
  companySettingsSchema,
  completeFollowUpSchema,
  createCallLogSchema,
  createFieldAgentSchema,
  createFollowUpSchema,
  createInboundSalesSchema,
  createLeadActivitySchema,
  createLeadSchema,
  createSiteVisitSchema,
  createUserSchema,
  defaultQuoteComponentSchema,
  fieldAgentProfileSchema,
  followUpFilterSchema,
  followUpSchema,
  leadActivitySchema,
  leadFilterSchema,
  leadSchema,
  notificationSchema,
  organizationSchema,
  paginatedResponseSchema,
  paginationSchema,
  communicationLogSchema,
  createCalendarEventSchema,
  dashboardDrillDownSchema,
  dashboardFilterSchema,
  profileSchema,
  quotationItemSchema,
  createQuotationItemInputSchema,
  quotationSchema,
  createQuotationInputSchema,
  updateQuotationInputSchema,
  reviseQuotationInputSchema,
  updateQuotationStatusSchema,
  quotationFilterSchema,
  createDefaultQuoteComponentSchema,
  updateDefaultQuoteComponentSchema,
  createCompanyOfficeSchema,
  updateCompanyOfficeSchema,
  createCompanyBankAccountSchema,
  updateCompanyBankAccountSchema,
  rescheduleFollowUpSchema,
  sendEmailSchema,
  sendWhatsAppSchema,
  siteVisitSchema,
  updateCalendarEventSchema,
  updateCompanySettingsSchema,
  updateFieldAgentProfileSchema,
  updateFollowUpSchema,
  updateLeadSchema,
  updateSiteVisitSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userFilterSchema,
  analyticsFilterSchema,
  exportReportSchema,
  leadStatusConfigItemSchema,
  enquiryTypeConfigItemSchema,
  leadSourceConfigItemSchema,
  assignmentRulesSchema,
  reminderPreferencesSchema,
  crmConfigSchema,
  updateCrmConfigSchema,
} from './schemas.js';

// ─── Domain Types ─────────────────────────────────────────────────────────────
export type Organization = z.infer<typeof organizationSchema>;

export type Profile = z.infer<typeof profileSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type CreateInboundSales = z.infer<typeof createInboundSalesSchema>;
export type CreateFieldAgent = z.infer<typeof createFieldAgentSchema>;
export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;

export type FieldAgentProfile = z.infer<typeof fieldAgentProfileSchema>;
export type UpdateFieldAgentProfile = z.infer<typeof updateFieldAgentProfileSchema>;

export type Lead = z.infer<typeof leadSchema>;
export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type LeadFilter = z.infer<typeof leadFilterSchema>;
export type CheckDuplicateLead = z.infer<typeof checkDuplicateLeadSchema>;
export type BulkAssignLeads = z.infer<typeof bulkAssignLeadsSchema>;
export type BulkStatusUpdate = z.infer<typeof bulkStatusUpdateSchema>;
export type AssignFieldAgent = z.infer<typeof assignFieldAgentSchema>;

export interface EligibleAgentMatch {
  agent_id: string;
  full_name: string;
  phone?: string | null;
  email: string;
  base_pincode?: string | null;
  service_pincodes: string[];
  service_areas: string[];
  availability: 'available' | 'busy' | 'on_leave' | 'offline';
  max_active_leads: number;
  current_active_leads: number;
  pending_site_visits: number;
  score: number;
  is_pincode_match: boolean;
  is_base_pincode_match: boolean;
  is_area_match: boolean;
  is_at_capacity: boolean;
  recommended: boolean;
  recommendation_reason: string;
  notes?: string | null;
}

export interface EligibleAgentsResponse {
  lead_id: string;
  lead_pincode?: string | null;
  lead_area?: string | null;
  current_agent_id?: string | null;
  has_exact_pincode_match: boolean;
  unassigned_reason?: string | null;
  agents: EligibleAgentMatch[];
}

export type LeadActivity = z.infer<typeof leadActivitySchema>;
export type CreateLeadActivity = z.infer<typeof createLeadActivitySchema>;
export type CreateCallLog = z.infer<typeof createCallLogSchema>;
export type AmendLeadActivity = z.infer<typeof amendLeadActivitySchema>;

export type FollowUp = z.infer<typeof followUpSchema>;
export type CreateFollowUp = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUp = z.infer<typeof updateFollowUpSchema>;
export type RescheduleFollowUp = z.infer<typeof rescheduleFollowUpSchema>;
export type CompleteFollowUp = z.infer<typeof completeFollowUpSchema>;
export type FollowUpFilter = z.infer<typeof followUpFilterSchema>;

export type SiteVisit = z.infer<typeof siteVisitSchema>;
export type CreateSiteVisit = z.infer<typeof createSiteVisitSchema>;
export type UpdateSiteVisit = z.infer<typeof updateSiteVisitSchema>;

export type Notification = z.infer<typeof notificationSchema>;

export type CalendarIntegration = z.infer<typeof calendarIntegrationSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CreateCalendarEvent = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEvent = z.infer<typeof updateCalendarEventSchema>;

export type SendEmail = z.infer<typeof sendEmailSchema>;
export type SendWhatsApp = z.infer<typeof sendWhatsAppSchema>;
export type CommunicationLog = z.infer<typeof communicationLogSchema>;

export interface IntegrationStatus {
  provider: 'google' | 'smtp' | 'whatsapp';
  name: string;
  configured: boolean;
  connected: boolean;
  account_email?: string | null;
  calendar_id?: string | null;
  sync_enabled: boolean;
  sync_status: 'active' | 'paused' | 'error' | 'disconnected' | 'unconfigured';
  last_synced_at?: string | null;
  details?: string;
  scopes?: string[];
}

export interface GoogleOAuthInitResponse {
  auth_url: string;
  provider: 'google';
  state: string;
}

export type QuotationItem = z.infer<typeof quotationItemSchema>;
export type CreateQuotationItemInput = z.infer<typeof createQuotationItemInputSchema>;
export type Quotation = z.infer<typeof quotationSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationInputSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationInputSchema>;
export type ReviseQuotationInput = z.infer<typeof reviseQuotationInputSchema>;
export type UpdateQuotationStatus = z.infer<typeof updateQuotationStatusSchema>;
export type QuotationFilter = z.infer<typeof quotationFilterSchema>;

export type DefaultQuoteComponent = z.infer<typeof defaultQuoteComponentSchema>;
export type CreateDefaultQuoteComponent = z.infer<typeof createDefaultQuoteComponentSchema>;
export type UpdateDefaultQuoteComponent = z.infer<typeof updateDefaultQuoteComponentSchema>;

export type CompanySettings = z.infer<typeof companySettingsSchema>;
export type UpdateCompanySettings = z.infer<typeof updateCompanySettingsSchema>;
export type CompanyOffice = z.infer<typeof companyOfficeSchema>;
export type CreateCompanyOffice = z.infer<typeof createCompanyOfficeSchema>;
export type UpdateCompanyOffice = z.infer<typeof updateCompanyOfficeSchema>;
export type CompanyBankAccount = z.infer<typeof companyBankAccountSchema>;
export type CreateCompanyBankAccount = z.infer<typeof createCompanyBankAccountSchema>;
export type UpdateCompanyBankAccount = z.infer<typeof updateCompanyBankAccountSchema>;

export interface QuotationCalculationResult {
  subtotal: number;
  discount_amount: number;
  taxable_value: number;
  gst_rate: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  kseb_charges: number;
  total_amount: number;
  advance_percentage: number;
  advance_amount: number;
  balance_amount: number;
  items: Array<{
    id?: string | undefined;
    component_name: string;
    component_type: string;
    description?: string | null | undefined;
    specifications?: string | null | undefined;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    sort_order: number;
    is_optional: boolean;
    tax_rate: number;
  }>;
}

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── API Response wrapper types ───────────────────────────────────────────────
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Auth Context ─────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  profile: Profile;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: Profile['role'];
  organization_id: string;
  company_id?: string;
  iat: number;
  exp: number;
};

// ─── Dashboard Domain Types ───────────────────────────────────────────────────
export interface AdminDashboardKpis {
  total_leads: number;
  fresh_leads: number;
  contacted_leads: number;
  hot_and_warm_leads: number;
  hot_leads: number;
  warm_leads: number;
  follow_ups_due_today: number;
  overdue_follow_ups: number;
  site_visits_scheduled: number;
  quotations_sent: number;
  won_leads: number;
  lost_leads: number;
  conversion_rate: number; // Formula: total_leads > 0 ? (won_leads / total_leads) * 100 : 0
  win_loss_rate: number;   // Formula: (won_leads + lost_leads) > 0 ? (won_leads / (won_leads + lost_leads)) * 100 : 0
  won_revenue: number;     // INR currency sum of deduplicated won quotations
  average_deal_size: number;
}

export interface LeadOverTimePoint {
  date: string;
  count: number;
  won: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  label: string;
}

export interface SourceDistribution {
  source: string;
  count: number;
}

export interface SalespersonPerformance {
  id: string;
  name: string;
  email: string;
  leads_handled: number;
  contacted: number;
  won: number;
  conversion_rate: number;
  won_revenue: number;
}

export interface FieldAgentPerformance {
  id: string;
  name: string;
  email: string;
  assigned_leads: number;
  visits_completed: number;
  visits_scheduled: number;
  won_leads: number;
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface FollowUpCompletionStats {
  completed: number;
  pending: number;
  overdue: number;
  completion_rate: number;
}

export interface WonRevenuePoint {
  date: string;
  revenue: number;
  cumulative: number;
}

export interface AdminDashboardData {
  kpis: AdminDashboardKpis;
  charts: {
    leads_over_time: LeadOverTimePoint[];
    leads_by_status: StatusDistribution[];
    leads_by_source: SourceDistribution[];
    salesperson_performance: SalespersonPerformance[];
    field_agent_performance: FieldAgentPerformance[];
    conversion_funnel: ConversionFunnelStage[];
    follow_up_completion: FollowUpCompletionStats;
    won_revenue_over_time: WonRevenuePoint[];
  };
  team_members: {
    inbound_sales: Array<{ id: string; name: string; email: string }>;
    field_agents: Array<{ id: string; name: string; email: string }>;
  };
}

export interface InboundSalesDashboardData {
  kpis: {
    my_total_leads: number;
    fresh_leads: number;
    assigned_follow_ups: number;
    overdue_tasks: number;
    hot_leads: number;
    site_visits_scheduled: number;
    quotations_sent: number;
    won_deals: number;
    conversion_rate: number;
    won_revenue: number;
  };
  urgent_follow_ups: Array<{
    id: string;
    lead_id: string;
    customer_name: string;
    phone: string;
    due_at: string;
    notes: string | null;
    is_overdue: boolean;
  }>;
  recent_hot_leads: Array<{
    id: string;
    customer_name: string;
    phone: string;
    status: string;
    temperature: string;
    enquiry_type: string;
    created_at: string;
  }>;
  funnel: Array<{ stage: string; count: number; percentage: number }>;
  leads_by_status: Array<{ status: string; count: number }>;
}

export interface FieldAgentDashboardData {
  kpis: {
    assigned_leads: number;
    today_visits: number;
    upcoming_visits: number;
    overdue_actions: number;
    completed_visits: number;
    pending_site_reports: number;
  };
  today_schedule: Array<{
    id: string;
    lead_id: string;
    customer_name: string;
    phone: string;
    address: string | null;
    scheduled_at: string;
    visit_status: string;
    roof_suitability: string | null;
  }>;
  upcoming_schedule: Array<{
    id: string;
    lead_id: string;
    customer_name: string;
    phone: string;
    address: string | null;
    scheduled_at: string;
    visit_status: string;
  }>;
  pending_reports: Array<{
    id: string;
    lead_id: string;
    customer_name: string;
    phone: string;
    scheduled_at: string;
    visit_status: string;
  }>;
}

export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;
export type DashboardDrillDown = z.infer<typeof dashboardDrillDownSchema>;

export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;
export type ExportReportQuery = z.infer<typeof exportReportSchema>;
export type LeadStatusConfigItem = z.infer<typeof leadStatusConfigItemSchema>;
export type EnquiryTypeConfigItem = z.infer<typeof enquiryTypeConfigItemSchema>;
export type LeadSourceConfigItem = z.infer<typeof leadSourceConfigItemSchema>;
export type AssignmentRules = z.infer<typeof assignmentRulesSchema>;
export type ReminderPreferences = z.infer<typeof reminderPreferencesSchema>;
export type CrmConfig = z.infer<typeof crmConfigSchema>;
export type UpdateCrmConfig = z.infer<typeof updateCrmConfigSchema>;

export interface InboundSalesUserAnalytics {
  user_id: string;
  user_name: string;
  email: string;
  total_leads_managed: number;
  fresh_leads_awaiting_contact: number;
  calls_and_activities_count: number;
  calls_count: number;
  follow_ups_completed: number;
  follow_ups_overdue: number;
  follow_ups_missed: number;
  temperature_distribution: {
    hot: number;
    warm: number;
    cold: number;
    unclassified: number;
  };
  qualified_leads: number;
  site_visits_arranged: number;
  quotations_prepared: number;
  quotations_sent: number;
  won_leads: number;
  lost_leads: number;
  conversion_rate: number;
  won_revenue: number;
  avg_time_to_first_contact_hours: number | null;
  lead_ageing: {
    days_0_3: number;
    days_4_7: number;
    days_8_14: number;
    days_14_plus: number;
  };
  inactive_leads_count: number;
}

export interface FieldAgentUserAnalytics {
  user_id: string;
  user_name: string;
  email: string;
  service_pincodes: string[];
  assigned_leads: number;
  site_visits_scheduled: number;
  site_visits_completed: number;
  visit_completion_rate: number;
  leads_awaiting_field_action: number;
  site_reports_submitted: number;
  follow_up_actions: number;
  outcomes_after_visits: {
    won: number;
    lost: number;
    quotation_sent: number;
    disqualified: number;
    in_progress: number;
  };
  current_active_workload: number;
  overdue_tasks: number;
}

export interface CompanyWideAnalytics {
  summary_kpis: {
    total_leads: number;
    fresh_leads: number;
    qualified_leads: number;
    site_visits_count: number;
    quotations_value_total: number;
    won_leads: number;
    won_revenue: number;
    overall_conversion_rate: number;
    follow_up_sla_compliance_rate: number;
  };
  sources_campaign_performance: Array<{
    source: string;
    total_leads: number;
    won_leads: number;
    conversion_rate: number;
    won_revenue: number;
    avg_deal_size: number;
  }>;
  conversion_funnel: Array<{
    stage: string;
    count: number;
    dropoff_pct: number;
    conversion_from_start_pct: number;
  }>;
  lead_ageing_report: {
    bucket_0_7d: number;
    bucket_8_14d: number;
    bucket_15_30d: number;
    bucket_30d_plus: number;
    inactive_leads: number;
  };
  pincode_performance: Array<{
    pincode: string;
    area?: string | undefined;
    total_leads: number;
    visits_completed: number;
    won_leads: number;
    conversion_rate: number;
    won_revenue: number;
  }>;
  salesperson_comparison: InboundSalesUserAnalytics[];
  field_agent_comparison: FieldAgentUserAnalytics[];
  trends: Array<{
    date: string;
    leads_created: number;
    activities: number;
    visits: number;
    quotes_sent: number;
    won_deals: number;
    revenue: number;
  }>;
  quotation_metrics: {
    total_quotes: number;
    total_value: number;
    avg_quote_value: number;
    won_quotes: number;
    won_value: number;
    win_rate: number;
  };
  follow_up_sla: {
    total_follow_ups: number;
    completed_on_time: number;
    overdue: number;
    missed: number;
    sla_compliance_pct: number;
    avg_delay_hours: number;
  };
}

export type { z };

