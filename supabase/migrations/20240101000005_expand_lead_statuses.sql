-- ============================================================
-- Migration 005: Expand Lead Statuses Workflow
-- Adds: follow_up, quotation_prepared, not_interested
-- ============================================================

alter table public.leads drop constraint if exists leads_status_check;

alter table public.leads add constraint leads_status_check
  check (status in (
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
    'disqualified'
  ));
