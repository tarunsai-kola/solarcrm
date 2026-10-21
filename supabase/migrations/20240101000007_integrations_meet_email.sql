-- ============================================================================
-- Migration: 20240101000007_integrations_meet_email.sql
-- Description: Adds Google Meet links, reminder flags to calendar_events,
--              account email to calendar_integrations, and communication_logs.
-- ============================================================================

-- 1. Enhance calendar_events with Google Meet link and metadata
alter table public.calendar_events
  add column if not exists meet_link text,
  add column if not exists reminders_sent boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 2. Enhance calendar_integrations with account email display
alter table public.calendar_integrations
  add column if not exists email text;

-- 3. Communication logs table for Email and WhatsApp
create table if not exists public.communication_logs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  lead_id             uuid references public.leads(id) on delete cascade,
  user_id             uuid references public.profiles(id) on delete set null,
  channel             text not null check (channel in ('email', 'whatsapp')),
  recipient           text not null,
  subject             text,
  body_snippet        text,
  status              text not null check (status in ('sent', 'delivered', 'failed', 'opened', 'simulated', 'unconfigured')),
  provider            text not null,
  provider_message_id text,
  error_details       text,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists communication_logs_org_idx on public.communication_logs(organization_id);
create index if not exists communication_logs_lead_idx on public.communication_logs(lead_id);
create index if not exists communication_logs_user_idx on public.communication_logs(user_id);
create index if not exists communication_logs_channel_idx on public.communication_logs(channel, created_at desc);

-- 4. Row-Level Security for communication_logs
alter table public.communication_logs enable row level security;

create policy "communication_logs_select_org"
  on public.communication_logs for select
  using (organization_id = public.current_organization_id());

create policy "communication_logs_insert_org"
  on public.communication_logs for insert
  with check (organization_id = public.current_organization_id());
