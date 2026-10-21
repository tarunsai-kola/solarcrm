-- ============================================================================
-- Migration: 20240101000009_admin_crm_controls.sql
-- Description: Adds configurable CRM controls to company_settings:
--              custom lead statuses, enquiry types, lead sources,
--              automated assignment rules, and reminder preferences.
-- ============================================================================

alter table public.company_settings
  add column if not exists custom_lead_statuses jsonb not null default '[]'::jsonb,
  add column if not exists custom_enquiry_types jsonb not null default '["residential", "commercial", "industrial", "agricultural", "housing_society", "other"]'::jsonb,
  add column if not exists lead_sources jsonb not null default '["Meta Ads", "Tata Solar", "JustDial", "Website", "Referral", "Cold Call", "Other"]'::jsonb,
  add column if not exists assignment_rules jsonb not null default '{"mode": "pincode_match", "auto_assign": true, "fallback_to_round_robin": true, "max_workload_cap": 15, "reassign_uncontacted_after_hours": 24}'::jsonb,
  add column if not exists reminder_preferences jsonb not null default '{"lead_times_minutes": [15, 60, 1440], "daily_digest_time": "09:00", "enable_email": true, "enable_in_app": true, "enable_whatsapp": true, "overdue_escalation_hours": 24}'::jsonb;
