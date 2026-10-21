-- ============================================================
-- Migration 002: Leads, Lead Activities, Follow-ups, and Site Visits
-- Tables: leads, lead_activities, follow_ups, site_visits
-- ============================================================

-- ─── 1. Leads Table ──────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  company_id              uuid references public.organizations(id) on delete cascade,
  customer_name           text not null check (char_length(customer_name) between 1 and 150),
  first_name              text,
  last_name               text,
  phone                   text not null check (char_length(phone) between 5 and 30),
  email                   text check (email is null or email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  address                 text,
  area                    text,
  pincode                 text check (pincode is null or char_length(pincode) between 4 and 10),
  enquiry_type            text not null default 'residential' check (enquiry_type in ('residential', 'commercial', 'industrial', 'agricultural', 'housing_society', 'other')),
  lead_source             text not null check (lead_source in ('Meta Ads', 'Tata Solar', 'JustDial', 'Other', 'Website', 'Referral', 'Cold Call')),
  initial_note            text,
  status                  text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'site_visit_scheduled', 'site_visit_completed', 'quotation_sent', 'negotiation', 'won', 'lost', 'disqualified')),
  temperature             text not null default 'unclassified' check (temperature in ('hot', 'warm', 'cold', 'unclassified')),
  inbound_sales_id        uuid references public.profiles(id) on delete set null,
  assigned_field_agent_id uuid references public.profiles(id) on delete set null,
  assigned_to             uuid references public.profiles(id) on delete set null,
  next_follow_up_at       timestamptz,
  created_by              uuid not null references public.profiles(id) on delete restrict,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Sync compatibility columns: company_id, assigned_to, first_name, last_name
create or replace function public.sync_lead_compat_fields()
returns trigger
language plpgsql
as $$
begin
  if new.company_id is null then
    new.company_id = new.organization_id;
  end if;
  if new.assigned_to is null and new.assigned_field_agent_id is not null then
    new.assigned_to = new.assigned_field_agent_id;
  elsif new.assigned_field_agent_id is null and new.assigned_to is not null then
    new.assigned_field_agent_id = new.assigned_to;
  end if;
  -- If customer_name was supplied without first/last
  if new.customer_name is not null and (new.first_name is null or new.last_name is null) then
    new.first_name = split_part(new.customer_name, ' ', 1);
    new.last_name = nullif(substring(new.customer_name from length(new.first_name) + 2), '');
    if new.last_name is null then
      new.last_name = '';
    end if;
  elsif (new.first_name is not null or new.last_name is not null) and new.customer_name is null then
    new.customer_name = trim(concat(coalesce(new.first_name, ''), ' ', coalesce(new.last_name, '')));
  end if;
  return new;
end;
$$;

create trigger leads_sync_compat
  before insert or update on public.leads
  for each row execute function public.sync_lead_compat_fields();

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create index if not exists leads_org_idx on public.leads(organization_id);
create index if not exists leads_status_idx on public.leads(organization_id, status);
create index if not exists leads_temperature_idx on public.leads(organization_id, temperature);
create index if not exists leads_source_idx on public.leads(organization_id, lead_source);
create index if not exists leads_agent_idx on public.leads(organization_id, assigned_field_agent_id);
create index if not exists leads_inbound_idx on public.leads(organization_id, inbound_sales_id);
create index if not exists leads_next_follow_up_idx on public.leads(organization_id, next_follow_up_at);
create index if not exists leads_created_at_idx on public.leads(organization_id, created_at desc);
create index if not exists leads_phone_idx on public.leads(organization_id, phone);

-- Full-text search index
create index if not exists leads_fts_idx on public.leads
  using gin(to_tsvector('english', customer_name || ' ' || coalesce(phone, '') || ' ' || coalesce(email, '') || ' ' || coalesce(area, '') || ' ' || coalesce(pincode, '')));

-- ─── 2. Lead Activities Table ────────────────────────────────────────────────
create table if not exists public.lead_activities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id         uuid not null references public.leads(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete restrict,
  activity_type   text not null check (activity_type in ('call', 'note', 'email', 'status_change', 'site_visit_scheduled', 'assignment', 'whatsapp', 'quotation_sent', 'other')),
  outcome         text,
  notes           text not null check (char_length(notes) > 0),
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists lead_activities_org_idx on public.lead_activities(organization_id);
create index if not exists lead_activities_lead_idx on public.lead_activities(lead_id, occurred_at desc);
create index if not exists lead_activities_author_idx on public.lead_activities(author_id);

-- ─── 3. Follow-Ups Table ─────────────────────────────────────────────────────
create table if not exists public.follow_ups (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  lead_id           uuid not null references public.leads(id) on delete cascade,
  assigned_to       uuid not null references public.profiles(id) on delete cascade,
  due_at            timestamptz not null,
  reminder_status   text not null default 'pending' check (reminder_status in ('pending', 'sent', 'dismissed', 'snoozed')),
  completion_status text not null default 'pending' check (completion_status in ('pending', 'completed', 'cancelled', 'overdue')),
  notes             text,
  created_by        uuid not null references public.profiles(id) on delete restrict,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger follow_ups_updated_at
  before update on public.follow_ups
  for each row execute function public.set_updated_at();

create index if not exists follow_ups_org_idx on public.follow_ups(organization_id);
create index if not exists follow_ups_lead_idx on public.follow_ups(lead_id);
create index if not exists follow_ups_assigned_idx on public.follow_ups(assigned_to, due_at);
create index if not exists follow_ups_status_idx on public.follow_ups(organization_id, completion_status, due_at);

-- ─── 4. Site Visits Table ────────────────────────────────────────────────────
create table if not exists public.site_visits (
  id                              uuid primary key default gen_random_uuid(),
  organization_id                 uuid not null references public.organizations(id) on delete cascade,
  lead_id                         uuid not null references public.leads(id) on delete cascade,
  field_agent_id                  uuid not null references public.profiles(id) on delete restrict,
  scheduled_at                    timestamptz not null,
  completed_at                    timestamptz,
  visit_status                    text not null default 'scheduled' check (visit_status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  site_observations               text,
  roof_suitability                text check (roof_suitability is null or roof_suitability in ('excellent', 'good', 'fair', 'poor', 'unsuitable', 'needs_reinforcement')),
  electricity_bill_amount         numeric(12, 2) check (electricity_bill_amount is null or electricity_bill_amount >= 0),
  monthly_consumption_kwh         numeric(10, 2) check (monthly_consumption_kwh is null or monthly_consumption_kwh >= 0),
  recommended_system_capacity_kw numeric(8, 2) check (recommended_system_capacity_kw is null or recommended_system_capacity_kw >= 0),
  attachments                     jsonb not null default '[]'::jsonb,
  next_action                     text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create trigger site_visits_updated_at
  before update on public.site_visits
  for each row execute function public.set_updated_at();

create index if not exists site_visits_org_idx on public.site_visits(organization_id);
create index if not exists site_visits_lead_idx on public.site_visits(lead_id);
create index if not exists site_visits_agent_idx on public.site_visits(field_agent_id, scheduled_at);
create index if not exists site_visits_status_idx on public.site_visits(organization_id, visit_status);

-- ─── Row-Level Security: leads ───────────────────────────────────────────────
alter table public.leads enable row level security;

-- Admin: full access to organization's leads
create policy "leads_admin_all"
  on public.leads for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all leads in organization
create policy "leads_sales_select"
  on public.leads for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: insert new leads in organization
create policy "leads_sales_insert"
  on public.leads for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update leads in organization
create policy "leads_sales_update"
  on public.leads for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select ONLY leads assigned to them
create policy "leads_agent_select"
  on public.leads for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_field_agent_id = auth.uid()
  );

-- Field Agent: update assigned leads (e.g. status, notes)
create policy "leads_agent_update"
  on public.leads for update
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_field_agent_id = auth.uid()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_field_agent_id = auth.uid()
  );

-- ─── Row-Level Security: lead_activities ─────────────────────────────────────
alter table public.lead_activities enable row level security;

-- Admin: full access to lead activities in organization
create policy "lead_activities_admin_all"
  on public.lead_activities for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all activities in organization
create policy "lead_activities_sales_select"
  on public.lead_activities for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: insert activity with author_id = self
create policy "lead_activities_sales_insert"
  on public.lead_activities for insert
  with check (
    organization_id = public.current_organization_id()
    and public.is_inbound_sales()
    and author_id = auth.uid()
  );

-- Field Agent: select activities for assigned leads only
create policy "lead_activities_agent_select"
  on public.lead_activities for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and exists (
      select 1 from public.leads l
      where l.id = lead_activities.lead_id
        and l.assigned_field_agent_id = auth.uid()
    )
  );

-- Field Agent: insert activity for assigned leads with author_id = self
create policy "lead_activities_agent_insert"
  on public.lead_activities for insert
  with check (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and author_id = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_activities.lead_id
        and l.assigned_field_agent_id = auth.uid()
    )
  );

-- ─── Row-Level Security: follow_ups ──────────────────────────────────────────
alter table public.follow_ups enable row level security;

-- Admin: full access to follow_ups in organization
create policy "follow_ups_admin_all"
  on public.follow_ups for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all follow_ups in organization
create policy "follow_ups_sales_select"
  on public.follow_ups for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: insert follow_ups in organization
create policy "follow_ups_sales_insert"
  on public.follow_ups for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update follow_ups in organization
create policy "follow_ups_sales_update"
  on public.follow_ups for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select follow_ups assigned to them
create policy "follow_ups_agent_select"
  on public.follow_ups for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_to = auth.uid()
  );

-- Field Agent: create follow_up for assigned lead and self
create policy "follow_ups_agent_insert"
  on public.follow_ups for insert
  with check (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_to = auth.uid()
    and created_by = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = follow_ups.lead_id
        and l.assigned_field_agent_id = auth.uid()
    )
  );

-- Field Agent: update their assigned follow_up
create policy "follow_ups_agent_update"
  on public.follow_ups for update
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_to = auth.uid()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_to = auth.uid()
  );

-- ─── Row-Level Security: site_visits ─────────────────────────────────────────
alter table public.site_visits enable row level security;

-- Admin: full access to site visits in organization
create policy "site_visits_admin_all"
  on public.site_visits for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all site visits in organization
create policy "site_visits_sales_select"
  on public.site_visits for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: schedule site visits for any field agent
create policy "site_visits_sales_insert"
  on public.site_visits for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update site visits
create policy "site_visits_sales_update"
  on public.site_visits for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select site visits assigned to them
create policy "site_visits_agent_select"
  on public.site_visits for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and field_agent_id = auth.uid()
  );

-- Field Agent: insert site visit for themselves on assigned lead
create policy "site_visits_agent_insert"
  on public.site_visits for insert
  with check (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and field_agent_id = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = site_visits.lead_id
        and l.assigned_field_agent_id = auth.uid()
    )
  );

-- Field Agent: update their own site visits (e.g. record observations, attachments, status)
create policy "site_visits_agent_update"
  on public.site_visits for update
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and field_agent_id = auth.uid()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and field_agent_id = auth.uid()
  );
