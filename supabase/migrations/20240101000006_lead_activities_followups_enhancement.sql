-- ============================================================
-- Migration 006: Lead Activities & Follow-ups Enhancements
-- Adds: Call details, duration, attachments, auditable amendments,
--       and follow-up reschedule tracking
-- ============================================================

-- 1. Expand lead_activities check constraint
alter table public.lead_activities drop constraint if exists lead_activities_activity_type_check;

alter table public.lead_activities add constraint lead_activities_activity_type_check
  check (activity_type in (
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
    'other'
  ));

-- 2. Add columns to lead_activities
alter table public.lead_activities
  add column if not exists duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists follow_up_id uuid references public.follow_ups(id) on delete set null,
  add column if not exists site_visit_id uuid references public.site_visits(id) on delete set null,
  add column if not exists quotation_id uuid references public.quotations(id) on delete set null,
  add column if not exists amends_activity_id uuid references public.lead_activities(id) on delete set null,
  add column if not exists is_amendment boolean not null default false,
  add column if not exists amendment_reason text;

create index if not exists lead_activities_amends_idx on public.lead_activities(amends_activity_id);
create index if not exists lead_activities_followup_idx on public.lead_activities(follow_up_id);

-- 3. Add reschedule columns to follow_ups
alter table public.follow_ups
  add column if not exists rescheduled_count integer not null default 0,
  add column if not exists last_rescheduled_at timestamptz,
  add column if not exists reschedule_reason text;

create index if not exists follow_ups_due_at_idx on public.follow_ups(organization_id, due_at);
