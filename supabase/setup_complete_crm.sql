-- ==============================================================================
-- Sunbeam Solar CRM: Complete Database Schema, Seed & Admin Activation Script
-- Target Project: https://ixncpmlhfzeoxxtjyzum.supabase.co
-- Admin User: tarunsaikolaa@gmail.com (Role: admin, Pass: 12345)
-- ==============================================================================

-- ─── 0. Extensions ───────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";
create extension if not exists "pgcrypto";


-- ==============================================================================
-- MIGRATION: 20240101000001_core_organizations_and_profiles.sql
-- ==============================================================================

-- ============================================================
-- Migration 001: Core Multi-Tenant Architecture & Profiles
-- Tables: organizations, companies, profiles, field_agent_profiles
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ─── Utility: updated_at trigger ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Application Roles & Account Status Enums ────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'inbound_sales', 'field_agent');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('active', 'pending', 'suspended', 'inactive');
  end if;
end $$;

-- ─── 1. Organizations (Multi-Tenancy Root) ───────────────────────────────────
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 200),
  slug          text not null unique check (char_length(slug) between 2 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create index if not exists organizations_slug_idx on public.organizations(slug);

-- ─── Ensure default organizations exist early so foreign keys resolve ────────
insert into public.organizations (id, name, slug)
values
  ('00000000-0000-0000-0000-000000000001', 'Sunbeam Solar Solutions Ltd', 'sunbeam-solar'),
  ('00000000-0000-0000-0000-000000000002', 'Apex Renewable Energy Corp', 'apex-energy')
on conflict (id) do update set name = excluded.name;


-- ─── Backward-Compatible Companies table ────────────────────────────────────
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 200),
  currency      char(3) not null default 'INR',
  timezone      text not null default 'Asia/Kolkata',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── 2. Profiles (Extends auth.users) ────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  company_id      uuid references public.organizations(id) on delete restrict,
  full_name       text not null check (char_length(full_name) between 2 and 150),
  email           text not null check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone           text check (phone is null or char_length(phone) between 5 and 30),
  role            public.app_role not null default 'field_agent',
  account_status  public.account_status not null default 'active',
  avatar_url      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Sync company_id with organization_id and is_active with account_status
create or replace function public.sync_profile_compat_fields()
returns trigger
language plpgsql
as $$
begin
  if new.company_id is null then
    new.company_id = new.organization_id;
  end if;
  new.is_active = (new.account_status = 'active');
  return new;
end;
$$;

drop trigger if exists profiles_sync_compat on public.profiles;
create trigger profiles_sync_compat
  before insert or update on public.profiles
  for each row execute function public.sync_profile_compat_fields();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_role_idx on public.profiles(organization_id, role);
create index if not exists profiles_account_status_idx on public.profiles(organization_id, account_status);
create index if not exists profiles_email_idx on public.profiles(email);

-- ─── 3. Field Agent Profiles ────────────────────────────────────────────────
create table if not exists public.field_agent_profiles (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  address           text,
  pincode           text check (pincode is null or char_length(pincode) between 4 and 10),
  service_pincodes  text[] not null default '{}',
  service_areas     text[] not null default '{}',
  availability      text not null default 'available' check (availability in ('available', 'busy', 'on_leave', 'offline')),
  max_active_leads  integer not null default 15 check (max_active_leads >= 0 and max_active_leads <= 200),
  latitude          numeric(10, 7) check (latitude is null or (latitude >= -90.0 and latitude <= 90.0)),
  longitude         numeric(10, 7) check (longitude is null or (longitude >= -180.0 and longitude <= 180.0)),
  experience_years  numeric(4, 1) not null default 0 check (experience_years >= 0),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists field_agent_profiles_updated_at on public.field_agent_profiles;
create trigger field_agent_profiles_updated_at
  before update on public.field_agent_profiles
  for each row execute function public.set_updated_at();

create index if not exists field_agent_profiles_org_idx on public.field_agent_profiles(organization_id);
create index if not exists field_agent_profiles_avail_idx on public.field_agent_profiles(organization_id, availability);
create index if not exists field_agent_profiles_pincodes_idx on public.field_agent_profiles using gin(service_pincodes);

-- ─── Security Helpers (SECURITY DEFINER) ────────────────────────────────────
-- Helper: get current user organization_id
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- Helper: backward compatible company_id
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(company_id, organization_id) from public.profiles where id = auth.uid();
$$;

-- Helper: get current user role
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: check if current user is active admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

-- Helper: check if current user is active inbound sales
create or replace function public.is_inbound_sales()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'inbound_sales'
      and account_status = 'active'
  );
$$;

-- Helper: check if current user is active field agent
create or replace function public.is_field_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'field_agent'
      and account_status = 'active'
  );
$$;

-- ─── Role Escalation & Self-Modification Security Trigger ──────────────────
create or replace function public.enforce_profile_role_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Prevent role modification unless performed by an active admin of the same organization
  if (old.role is distinct from new.role) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only administrators can modify user roles.';
    end if;

    -- Prevent an admin from modifying/demoting their own role
    if (auth.uid() = old.id and new.role <> 'admin') then
      raise exception 'Unauthorized: Administrators cannot change their own role.';
    end if;
  end if;

  -- Prevent users from reassigning organization unless done by an admin
  if (old.organization_id is distinct from new.organization_id) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only administrators can modify organization membership.';
    end if;
  end if;

  -- Prevent non-admins from changing account status of other users
  if (old.account_status is distinct from new.account_status) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only administrators can modify account status.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_role_security_trigger on public.profiles;
create trigger profiles_role_security_trigger
  before update on public.profiles
  for each row execute function public.enforce_profile_role_security();

-- ─── Row-Level Security: organizations ──────────────────────────────────────
alter table public.organizations enable row level security;

drop policy if exists "org_select_member" on public.organizations;
create policy "org_select_member"
  on public.organizations for select
  using (id = public.current_organization_id());

drop policy if exists "org_update_admin" on public.organizations;
create policy "org_update_admin"
  on public.organizations for update
  using (id = public.current_organization_id() and public.is_admin())
  with check (id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: companies (backward compat) ────────────────────────
alter table public.companies enable row level security;

drop policy if exists "companies_select_member" on public.companies;
create policy "companies_select_member"
  on public.companies for select
  using (organization_id = public.current_organization_id());

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin"
  on public.companies for update
  using (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: profiles ───────────────────────────────────────────
alter table public.profiles enable row level security;

-- Members can see all profiles in their organization
drop policy if exists "profiles_select_same_org" on public.profiles;
create policy "profiles_select_same_org"
  on public.profiles for select
  using (organization_id = public.current_organization_id());

-- Users can update their own non-privileged profile fields
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid() and organization_id = public.current_organization_id())
  with check (id = auth.uid() and organization_id = public.current_organization_id());

-- Admins can update any profile within their organization
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Only admins can insert new profiles into their organization
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Only admins can delete profiles from their organization (except themselves)
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (
    organization_id = public.current_organization_id()
    and public.is_admin()
    and id <> auth.uid()
  );

-- ─── Row-Level Security: field_agent_profiles ───────────────────────────────
alter table public.field_agent_profiles enable row level security;

drop policy if exists "field_agent_profiles_select_org" on public.field_agent_profiles;
create policy "field_agent_profiles_select_org"
  on public.field_agent_profiles for select
  using (organization_id = public.current_organization_id());

drop policy if exists "field_agent_profiles_insert" on public.field_agent_profiles;
create policy "field_agent_profiles_insert"
  on public.field_agent_profiles for insert
  with check (
    organization_id = public.current_organization_id()
    and (public.is_admin() or user_id = auth.uid())
  );

drop policy if exists "field_agent_profiles_update" on public.field_agent_profiles;
create policy "field_agent_profiles_update"
  on public.field_agent_profiles for update
  using (
    organization_id = public.current_organization_id()
    and (public.is_admin() or user_id = auth.uid())
  )
  with check (
    organization_id = public.current_organization_id()
    and (public.is_admin() or user_id = auth.uid())
  );

drop policy if exists "field_agent_profiles_delete_admin" on public.field_agent_profiles;
create policy "field_agent_profiles_delete_admin"
  on public.field_agent_profiles for delete
  using (organization_id = public.current_organization_id() and public.is_admin());


-- ==============================================================================
-- MIGRATION: 20240101000002_leads_activities_visits.sql
-- ==============================================================================

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

drop trigger if exists leads_sync_compat on public.leads;
create trigger leads_sync_compat
  before insert or update on public.leads
  for each row execute function public.sync_lead_compat_fields();

drop trigger if exists leads_updated_at on public.leads;
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

drop trigger if exists follow_ups_updated_at on public.follow_ups;
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

drop trigger if exists site_visits_updated_at on public.site_visits;
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
drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all"
  on public.leads for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all leads in organization
drop policy if exists "leads_sales_select" on public.leads;
create policy "leads_sales_select"
  on public.leads for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: insert new leads in organization
drop policy if exists "leads_sales_insert" on public.leads;
create policy "leads_sales_insert"
  on public.leads for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update leads in organization
drop policy if exists "leads_sales_update" on public.leads;
create policy "leads_sales_update"
  on public.leads for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select ONLY leads assigned to them
drop policy if exists "leads_agent_select" on public.leads;
create policy "leads_agent_select"
  on public.leads for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_field_agent_id = auth.uid()
  );

-- Field Agent: update assigned leads (e.g. status, notes)
drop policy if exists "leads_agent_update" on public.leads;
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
drop policy if exists "lead_activities_admin_all" on public.lead_activities;
create policy "lead_activities_admin_all"
  on public.lead_activities for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all activities in organization
drop policy if exists "lead_activities_sales_select" on public.lead_activities;
create policy "lead_activities_sales_select"
  on public.lead_activities for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: insert activity with author_id = self
drop policy if exists "lead_activities_sales_insert" on public.lead_activities;
create policy "lead_activities_sales_insert"
  on public.lead_activities for insert
  with check (
    organization_id = public.current_organization_id()
    and public.is_inbound_sales()
    and author_id = auth.uid()
  );

-- Field Agent: select activities for assigned leads only
drop policy if exists "lead_activities_agent_select" on public.lead_activities;
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
drop policy if exists "lead_activities_agent_insert" on public.lead_activities;
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
drop policy if exists "follow_ups_admin_all" on public.follow_ups;
create policy "follow_ups_admin_all"
  on public.follow_ups for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all follow_ups in organization
drop policy if exists "follow_ups_sales_select" on public.follow_ups;
create policy "follow_ups_sales_select"
  on public.follow_ups for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: insert follow_ups in organization
drop policy if exists "follow_ups_sales_insert" on public.follow_ups;
create policy "follow_ups_sales_insert"
  on public.follow_ups for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update follow_ups in organization
drop policy if exists "follow_ups_sales_update" on public.follow_ups;
create policy "follow_ups_sales_update"
  on public.follow_ups for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select follow_ups assigned to them
drop policy if exists "follow_ups_agent_select" on public.follow_ups;
create policy "follow_ups_agent_select"
  on public.follow_ups for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_to = auth.uid()
  );

-- Field Agent: create follow_up for assigned lead and self
drop policy if exists "follow_ups_agent_insert" on public.follow_ups;
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
drop policy if exists "follow_ups_agent_update" on public.follow_ups;
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
drop policy if exists "site_visits_admin_all" on public.site_visits;
create policy "site_visits_admin_all"
  on public.site_visits for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all site visits in organization
drop policy if exists "site_visits_sales_select" on public.site_visits;
create policy "site_visits_sales_select"
  on public.site_visits for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: schedule site visits for any field agent
drop policy if exists "site_visits_sales_insert" on public.site_visits;
create policy "site_visits_sales_insert"
  on public.site_visits for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update site visits
drop policy if exists "site_visits_sales_update" on public.site_visits;
create policy "site_visits_sales_update"
  on public.site_visits for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select site visits assigned to them
drop policy if exists "site_visits_agent_select" on public.site_visits;
create policy "site_visits_agent_select"
  on public.site_visits for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and field_agent_id = auth.uid()
  );

-- Field Agent: insert site visit for themselves on assigned lead
drop policy if exists "site_visits_agent_insert" on public.site_visits;
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
drop policy if exists "site_visits_agent_update" on public.site_visits;
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


-- ==============================================================================
-- MIGRATION: 20240101000003_quotations_and_calendar.sql
-- ==============================================================================

-- ============================================================
-- Migration 003: Quotations, Quote Items, Default Quote Components & Calendar
-- Tables: default_quote_components, quotations, quotation_items,
--         calendar_integrations, calendar_events
-- ============================================================

-- ─── 1. Default Quote Components Library ─────────────────────────────────────
create table if not exists public.default_quote_components (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  name                text not null check (char_length(name) between 2 and 200),
  component_type      text not null check (component_type in ('solar_panel', 'inverter', 'battery', 'structure', 'bos', 'installation', 'net_metering', 'other')),
  default_unit        text not null default 'nos',
  default_unit_price  numeric(14, 2) not null default 0 check (default_unit_price >= 0),
  description         text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists default_quote_components_updated_at on public.default_quote_components;
create trigger default_quote_components_updated_at
  before update on public.default_quote_components
  for each row execute function public.set_updated_at();

create index if not exists quote_components_org_idx on public.default_quote_components(organization_id);
create index if not exists quote_components_type_idx on public.default_quote_components(organization_id, component_type);

-- ─── 2. Quotations Table ─────────────────────────────────────────────────────
create table if not exists public.quotations (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  company_id          uuid references public.organizations(id) on delete cascade,
  lead_id             uuid not null references public.leads(id) on delete cascade,
  created_by          uuid not null references public.profiles(id) on delete restrict,
  quotation_number    text not null check (char_length(quotation_number) between 1 and 50),
  version             integer not null default 1 check (version >= 1),
  title               text not null check (char_length(title) between 1 and 200),
  status              text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised')),
  system_capacity_kw  numeric(8, 2) check (system_capacity_kw is null or system_capacity_kw >= 0),
  subtotal            numeric(14, 2) not null default 0 check (subtotal >= 0),
  discount_amount     numeric(14, 2) not null default 0 check (discount_amount >= 0),
  tax_amount          numeric(14, 2) not null default 0 check (tax_amount >= 0),
  total_amount        numeric(14, 2) not null default 0 check (total_amount >= 0),
  valid_until         timestamptz,
  payment_terms       text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint quotations_org_num_ver_unique unique (organization_id, quotation_number, version)
);

-- Sync compatibility company_id
create or replace function public.sync_quotation_compat_fields()
returns trigger
language plpgsql
as $$
begin
  if new.company_id is null then
    new.company_id = new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists quotations_sync_compat on public.quotations;
create trigger quotations_sync_compat
  before insert or update on public.quotations
  for each row execute function public.sync_quotation_compat_fields();

drop trigger if exists quotations_updated_at on public.quotations;
create trigger quotations_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

create index if not exists quotations_org_idx on public.quotations(organization_id);
create index if not exists quotations_lead_idx on public.quotations(lead_id);
create index if not exists quotations_number_idx on public.quotations(organization_id, quotation_number);
create index if not exists quotations_status_idx on public.quotations(organization_id, status);

-- ─── 3. Quotation Items Table ────────────────────────────────────────────────
create table if not exists public.quotation_items (
  id              uuid primary key default gen_random_uuid(),
  quotation_id    uuid not null references public.quotations(id) on delete cascade,
  component_name  text not null check (char_length(component_name) between 1 and 200),
  component_type  text not null check (component_type in ('solar_panel', 'inverter', 'battery', 'structure', 'bos', 'installation', 'net_metering', 'other')),
  description     text,
  quantity        numeric(10, 2) not null default 1 check (quantity > 0),
  unit            text not null default 'nos',
  unit_price      numeric(14, 2) not null default 0 check (unit_price >= 0),
  total_price     numeric(14, 2) not null default 0 check (total_price >= 0),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Auto-calculate total_price if not explicitly set
create or replace function public.calculate_quotation_item_total()
returns trigger
language plpgsql
as $$
begin
  if new.total_price = 0 and new.unit_price > 0 then
    new.total_price = round(new.quantity * new.unit_price, 2);
  end if;
  return new;
end;
$$;

drop trigger if exists quotation_items_calc_total on public.quotation_items;
create trigger quotation_items_calc_total
  before insert or update on public.quotation_items
  for each row execute function public.calculate_quotation_item_total();

create index if not exists quotation_items_quotation_idx on public.quotation_items(quotation_id, sort_order);

-- ─── 4. Calendar Integrations Table ──────────────────────────────────────────
create table if not exists public.calendar_integrations (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  provider          text not null check (provider in ('google', 'outlook', 'apple', 'caldav')),
  access_token      text,
  refresh_token     text,
  token_expires_at  timestamptz,
  calendar_id       text,
  sync_enabled      boolean not null default true,
  sync_status       text not null default 'active' check (sync_status in ('active', 'paused', 'error', 'disconnected')),
  last_synced_at    timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint calendar_integrations_user_provider_unique unique (user_id, provider)
);

drop trigger if exists calendar_integrations_updated_at on public.calendar_integrations;
create trigger calendar_integrations_updated_at
  before update on public.calendar_integrations
  for each row execute function public.set_updated_at();

create index if not exists calendar_integrations_user_idx on public.calendar_integrations(user_id);
create index if not exists calendar_integrations_org_idx on public.calendar_integrations(organization_id);

-- ─── 5. Calendar Events Table ────────────────────────────────────────────────
create table if not exists public.calendar_events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  lead_id           uuid references public.leads(id) on delete set null,
  site_visit_id     uuid references public.site_visits(id) on delete set null,
  follow_up_id      uuid references public.follow_ups(id) on delete set null,
  title             text not null check (char_length(title) between 1 and 200),
  description       text,
  start_time        timestamptz not null,
  end_time          timestamptz not null check (end_time >= start_time),
  location          text,
  external_event_id text,
  status            text not null default 'confirmed' check (status in ('confirmed', 'tentative', 'cancelled')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

create index if not exists calendar_events_org_idx on public.calendar_events(organization_id);
create index if not exists calendar_events_user_idx on public.calendar_events(user_id, start_time);
create index if not exists calendar_events_lead_idx on public.calendar_events(lead_id);
create index if not exists calendar_events_visit_idx on public.calendar_events(site_visit_id);

-- ─── Row-Level Security: default_quote_components ────────────────────────────
alter table public.default_quote_components enable row level security;

drop policy if exists "quote_components_select_org" on public.default_quote_components;
create policy "quote_components_select_org"
  on public.default_quote_components for select
  using (organization_id = public.current_organization_id());

drop policy if exists "quote_components_admin_all" on public.default_quote_components;
create policy "quote_components_admin_all"
  on public.default_quote_components for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: quotations ──────────────────────────────────────────
alter table public.quotations enable row level security;

-- Admin: full access to organization quotations
drop policy if exists "quotations_admin_all" on public.quotations;
create policy "quotations_admin_all"
  on public.quotations for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all quotations in organization
drop policy if exists "quotations_sales_select" on public.quotations;
create policy "quotations_sales_select"
  on public.quotations for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: create quotations
drop policy if exists "quotations_sales_insert" on public.quotations;
create policy "quotations_sales_insert"
  on public.quotations for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update quotations
drop policy if exists "quotations_sales_update" on public.quotations;
create policy "quotations_sales_update"
  on public.quotations for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select quotations for assigned leads only
drop policy if exists "quotations_agent_select" on public.quotations;
create policy "quotations_agent_select"
  on public.quotations for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and exists (
      select 1 from public.leads l
      where l.id = quotations.lead_id
        and l.assigned_field_agent_id = auth.uid()
    )
  );

-- ─── Row-Level Security: quotation_items ─────────────────────────────────────
alter table public.quotation_items enable row level security;

-- Items inherit access permissions from the parent quotation
drop policy if exists "quotation_items_select" on public.quotation_items;
create policy "quotation_items_select"
  on public.quotation_items for select
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
    )
  );

drop policy if exists "quotation_items_admin_all" on public.quotation_items;
create policy "quotation_items_admin_all"
  on public.quotation_items for all
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_organization_id()
        and public.is_admin()
    )
  )
  with check (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_organization_id()
        and public.is_admin()
    )
  );

drop policy if exists "quotation_items_sales_write" on public.quotation_items;
create policy "quotation_items_sales_write"
  on public.quotation_items for insert
  with check (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_organization_id()
        and public.is_inbound_sales()
    )
  );

drop policy if exists "quotation_items_sales_update" on public.quotation_items;
create policy "quotation_items_sales_update"
  on public.quotation_items for update
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_organization_id()
        and public.is_inbound_sales()
    )
  )
  with check (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_organization_id()
        and public.is_inbound_sales()
    )
  );

-- ─── Row-Level Security: calendar_integrations ───────────────────────────────
alter table public.calendar_integrations enable row level security;

drop policy if exists "calendar_integrations_own_select" on public.calendar_integrations;
create policy "calendar_integrations_own_select"
  on public.calendar_integrations for select
  using (
    (user_id = auth.uid() and organization_id = public.current_organization_id())
    or (organization_id = public.current_organization_id() and public.is_admin())
  );

drop policy if exists "calendar_integrations_own_insert" on public.calendar_integrations;
create policy "calendar_integrations_own_insert"
  on public.calendar_integrations for insert
  with check (user_id = auth.uid() and organization_id = public.current_organization_id());

drop policy if exists "calendar_integrations_own_update" on public.calendar_integrations;
create policy "calendar_integrations_own_update"
  on public.calendar_integrations for update
  using (user_id = auth.uid() and organization_id = public.current_organization_id())
  with check (user_id = auth.uid() and organization_id = public.current_organization_id());

drop policy if exists "calendar_integrations_own_delete" on public.calendar_integrations;
create policy "calendar_integrations_own_delete"
  on public.calendar_integrations for delete
  using (
    (user_id = auth.uid() and organization_id = public.current_organization_id())
    or (organization_id = public.current_organization_id() and public.is_admin())
  );

-- ─── Row-Level Security: calendar_events ─────────────────────────────────────
alter table public.calendar_events enable row level security;

drop policy if exists "calendar_events_select" on public.calendar_events;
create policy "calendar_events_select"
  on public.calendar_events for select
  using (
    organization_id = public.current_organization_id()
    and (
      user_id = auth.uid()
      or public.is_admin()
      or public.is_inbound_sales()
    )
  );

drop policy if exists "calendar_events_insert" on public.calendar_events;
create policy "calendar_events_insert"
  on public.calendar_events for insert
  with check (
    organization_id = public.current_organization_id()
    and user_id = auth.uid()
  );

drop policy if exists "calendar_events_update" on public.calendar_events;
create policy "calendar_events_update"
  on public.calendar_events for update
  using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_admin())
  )
  with check (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_admin())
  );

drop policy if exists "calendar_events_delete" on public.calendar_events;
create policy "calendar_events_delete"
  on public.calendar_events for delete
  using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_admin())
  );


-- ==============================================================================
-- MIGRATION: 20240101000004_company_audit_notifications.sql
-- ==============================================================================

-- ============================================================
-- Migration 004: Company Settings, Offices, Bank Accounts,
--                Notifications & Immutable Audit Logs
-- Tables: company_settings, company_offices, company_bank_accounts,
--         notifications, audit_logs
-- ============================================================

-- ─── 1. Company Settings Table ───────────────────────────────────────────────
create table if not exists public.company_settings (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null unique references public.organizations(id) on delete cascade,
  company_name          text not null check (char_length(company_name) between 2 and 200),
  legal_name            text,
  gst_number            text check (gst_number is null or char_length(gst_number) between 5 and 20),
  pan_number            text check (pan_number is null or char_length(pan_number) between 5 and 15),
  email                 text check (email is null or email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone                 text check (phone is null or char_length(phone) between 5 and 30),
  website               text,
  logo_url              text,
  currency              char(3) not null default 'INR',
  timezone              text not null default 'Asia/Kolkata',
  tax_rate              numeric(5, 2) not null default 13.80 check (tax_rate >= 0 and tax_rate <= 100),
  terms_and_conditions  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists company_settings_updated_at on public.company_settings;
create trigger company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

create index if not exists company_settings_org_idx on public.company_settings(organization_id);

-- ─── 2. Company Offices Table ────────────────────────────────────────────────
create table if not exists public.company_offices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  office_name     text not null check (char_length(office_name) between 2 and 100),
  address         text not null,
  city            text not null check (char_length(city) between 1 and 100),
  state           text not null check (char_length(state) between 1 and 100),
  pincode         text not null check (char_length(pincode) between 4 and 10),
  phone           text check (phone is null or char_length(phone) between 5 and 30),
  email           text check (email is null or email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  is_headquarters boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists company_offices_updated_at on public.company_offices;
create trigger company_offices_updated_at
  before update on public.company_offices
  for each row execute function public.set_updated_at();

create index if not exists company_offices_org_idx on public.company_offices(organization_id);

-- ─── 3. Company Bank Accounts Table ──────────────────────────────────────────
create table if not exists public.company_bank_accounts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  bank_name           text not null check (char_length(bank_name) between 2 and 100),
  account_holder_name text not null check (char_length(account_holder_name) between 2 and 150),
  account_number      text not null check (char_length(account_number) between 5 and 40),
  ifsc_code           text not null check (char_length(ifsc_code) between 4 and 15),
  branch_name         text,
  upi_id              text,
  is_primary          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists company_bank_accounts_updated_at on public.company_bank_accounts;
create trigger company_bank_accounts_updated_at
  before update on public.company_bank_accounts
  for each row execute function public.set_updated_at();

create index if not exists company_bank_accounts_org_idx on public.company_bank_accounts(organization_id);

-- ─── 4. Notifications Table ──────────────────────────────────────────────────
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null default 'system',
  title           text not null check (char_length(title) between 1 and 200),
  body            text not null check (char_length(body) between 1 and 1000),
  is_read         boolean not null default false,
  read_at         timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, is_read);
create index if not exists notifications_org_idx on public.notifications(organization_id);
create index if not exists notifications_created_at_idx on public.notifications(user_id, created_at desc);

-- ─── 5. Audit Logs Table (Tamper-Resistant) ──────────────────────────────────
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id      uuid references public.organizations(id) on delete cascade,
  actor_id        uuid references public.profiles(id) on delete set null,
  action          text not null check (action in ('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'assign', 'status_change')),
  entity_type     text not null check (char_length(entity_type) <= 100),
  entity_id       uuid,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- Sync compat company_id
create or replace function public.sync_audit_compat_fields()
returns trigger
language plpgsql
as $$
begin
  if new.company_id is null then
    new.company_id = new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_logs_sync_compat on public.audit_logs;
create trigger audit_logs_sync_compat
  before insert on public.audit_logs
  for each row execute function public.sync_audit_compat_fields();

-- Immutability trigger: deny any update or delete on audit logs
create or replace function public.deny_audit_log_modification()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Security violation: Audit logs are immutable and cannot be modified or deleted.';
end;
$$;

drop trigger if exists audit_logs_immutable_trigger on public.audit_logs;
create trigger audit_logs_immutable_trigger
  before update or delete on public.audit_logs
  for each row execute function public.deny_audit_log_modification();

create index if not exists audit_logs_org_idx on public.audit_logs(organization_id, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- ─── Secure Audit Event Logger (SECURITY DEFINER) ───────────────────────────
create or replace function public.log_audit_event(
  p_organization_id uuid,
  p_actor_id        uuid,
  p_action          text,
  p_entity_type     text,
  p_entity_id       uuid default null,
  p_old_values      jsonb default null,
  p_new_values      jsonb default null,
  p_ip_address      text default null,
  p_user_agent      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type,
    entity_id, old_values, new_values, ip_address, user_agent
  ) values (
    p_organization_id, p_actor_id, p_action, p_entity_type,
    p_entity_id, p_old_values, p_new_values, p_ip_address, p_user_agent
  ) returning id into v_id;
  return v_id;
end;
$$;

-- ─── Row-Level Security: company_settings ────────────────────────────────────
alter table public.company_settings enable row level security;

drop policy if exists "company_settings_select_org" on public.company_settings;
create policy "company_settings_select_org"
  on public.company_settings for select
  using (organization_id = public.current_organization_id());

drop policy if exists "company_settings_admin_all" on public.company_settings;
create policy "company_settings_admin_all"
  on public.company_settings for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: company_offices ─────────────────────────────────────
alter table public.company_offices enable row level security;

drop policy if exists "company_offices_select_org" on public.company_offices;
create policy "company_offices_select_org"
  on public.company_offices for select
  using (organization_id = public.current_organization_id());

drop policy if exists "company_offices_admin_all" on public.company_offices;
create policy "company_offices_admin_all"
  on public.company_offices for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: company_bank_accounts ───────────────────────────────
alter table public.company_bank_accounts enable row level security;

drop policy if exists "company_bank_accounts_select_org" on public.company_bank_accounts;
create policy "company_bank_accounts_select_org"
  on public.company_bank_accounts for select
  using (organization_id = public.current_organization_id());

drop policy if exists "company_bank_accounts_admin_all" on public.company_bank_accounts;
create policy "company_bank_accounts_admin_all"
  on public.company_bank_accounts for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: notifications ──────────────────────────────────────
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Direct client inserts denied (notifications must be inserted by server or SECURITY DEFINER functions)
drop policy if exists "notifications_no_client_insert" on public.notifications;
create policy "notifications_no_client_insert"
  on public.notifications for insert
  with check (false);

-- ─── Row-Level Security: audit_logs ──────────────────────────────────────────
alter table public.audit_logs enable row level security;

-- Only organization admins can view audit logs
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (
    organization_id = public.current_organization_id()
    and public.is_admin()
  );

-- Direct client inserts denied (must use log_audit_event or server service-role)
drop policy if exists "audit_logs_no_client_insert" on public.audit_logs;
create policy "audit_logs_no_client_insert"
  on public.audit_logs for insert
  with check (false);

-- Updates completely denied at RLS level (also blocked by immutable trigger)
drop policy if exists "audit_logs_no_update" on public.audit_logs;
create policy "audit_logs_no_update"
  on public.audit_logs for update
  using (false);

-- Deletions completely denied at RLS level (also blocked by immutable trigger)
drop policy if exists "audit_logs_no_delete" on public.audit_logs;
create policy "audit_logs_no_delete"
  on public.audit_logs for delete
  using (false);


-- ==============================================================================
-- MIGRATION: 20240101000005_expand_lead_statuses.sql
-- ==============================================================================

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


-- ==============================================================================
-- MIGRATION: 20240101000006_lead_activities_followups_enhancement.sql
-- ==============================================================================

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


-- ==============================================================================
-- MIGRATION: 20240101000007_integrations_meet_email.sql
-- ==============================================================================

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

drop policy if exists "communication_logs_select_org" on public.communication_logs;
create policy "communication_logs_select_org"
  on public.communication_logs for select
  using (organization_id = public.current_organization_id());

drop policy if exists "communication_logs_insert_org" on public.communication_logs;
create policy "communication_logs_insert_org"
  on public.communication_logs for insert
  with check (organization_id = public.current_organization_id());


-- ==============================================================================
-- MIGRATION: 20240101000008_quotations_enhancement.sql
-- ==============================================================================

-- ============================================================================
-- Migration: 20240101000008_quotations_enhancement.sql
-- Description: Enhances company_settings with branding, warranties, and tax rates;
--              enhances quotations with system type, advance terms, company snapshot;
--              seeds the 12 configurable Bill of Materials default components.
-- ============================================================================

-- 1. Enhance company_settings
alter table public.company_settings
  add column if not exists tagline text default 'Powering a Greener Tomorrow',
  add column if not exists credential_line text default 'MNRE Empanelled Solar Partner • ISO 9001:2015 Certified',
  add column if not exists product_warranty_years integer not null default 10,
  add column if not exists performance_warranty_years integer not null default 25,
  add column if not exists inverter_warranty_years integer not null default 5,
  add column if not exists battery_warranty_years integer not null default 5,
  add column if not exists tax_rates jsonb not null default '{"cgst_rate": 6.9, "sgst_rate": 6.9, "igst_rate": 13.8}'::jsonb,
  add column if not exists kseb_charges numeric(12, 2) not null default 0;

-- 2. Enhance quotations
alter table public.quotations
  add column if not exists phase text default '3-Phase',
  add column if not exists system_type text default 'On-Grid',
  add column if not exists taxable_value numeric(14, 2) not null default 0,
  add column if not exists gst_rate numeric(5, 2) not null default 13.80,
  add column if not exists kseb_charges numeric(14, 2) not null default 0,
  add column if not exists advance_percentage numeric(5, 2) not null default 20.00,
  add column if not exists advance_amount numeric(14, 2) not null default 0,
  add column if not exists balance_amount numeric(14, 2) not null default 0,
  add column if not exists warranty_terms text,
  add column if not exists exclusions text,
  add column if not exists authorized_signature_name text,
  add column if not exists parent_quotation_id uuid references public.quotations(id) on delete set null,
  add column if not exists is_latest boolean not null default true,
  add column if not exists company_snapshot jsonb not null default '{}'::jsonb;

-- 3. Enhance quotation_items
alter table public.quotation_items
  add column if not exists specifications text,
  add column if not exists is_optional boolean not null default false,
  add column if not exists tax_rate numeric(5, 2) not null default 0;

-- 4. Seed 12 Configurable Bill of Materials (BOM) Defaults
insert into public.default_quote_components (
  id, organization_id, name, component_type, default_unit, default_unit_price, description, is_active
) values
(
  '40000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Solar PV Modules — Tier-1 Mono PERC/TOPCon Half-Cut',
  'solar_panel',
  'Nos',
  24000.00,
  'Tier-1 high efficiency solar photovoltaic modules with 25-year linear performance warranty',
  true
),
(
  '40000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'Solar Inverter — Grid-Tied/Hybrid Inverter',
  'inverter',
  'Set',
  45000.00,
  'High efficiency solar grid-tied/hybrid string inverter with WiFi monitoring and dual MPPT',
  true
),
(
  '40000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000001',
  'Module Mounting Structure — Hot-Dip Galvanized/Anodized Aluminium',
  'structure',
  'Set',
  8500.00,
  'Corrosion-resistant HDG/Aluminium structure engineered for 150 km/h wind loads',
  true
),
(
  '40000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000001',
  'AC Distribution Box — SPD, MCB and IP65 enclosure',
  'bos',
  'Set',
  3500.00,
  'IP65 outdoor enclosure with Type-2 surge protection device and calibrated miniature circuit breaker',
  true
),
(
  '40000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000001',
  'DC Distribution Box — Fuse, SPD and isolator',
  'bos',
  'Set',
  4000.00,
  '1000V DC surge protection device, high-voltage gPV fuses, and rotary DC isolator switch',
  true
),
(
  '40000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000001',
  'DC Solar Cables — UV-resistant 4/6 sq.mm copper cable',
  'bos',
  'Mtr',
  65.00,
  'Electron-beam crosslinked halogen-free UV and weather-resistant solar copper cables',
  true
),
(
  '40000000-0000-0000-0000-000000000017',
  '00000000-0000-0000-0000-000000000001',
  'AC Cables — 4-core armoured copper/aluminium cable',
  'bos',
  'Mtr',
  120.00,
  'Heavy duty XLPE insulated multi-strand armoured cable for inverter-to-panel connectivity',
  true
),
(
  '40000000-0000-0000-0000-000000000018',
  '00000000-0000-0000-0000-000000000001',
  'Earthing System — Chemical earthing rods',
  'bos',
  'Sets',
  2800.00,
  'Maintenance-free chemical copper bonded earthing electrode with low-resistivity compound',
  true
),
(
  '40000000-0000-0000-0000-000000000019',
  '00000000-0000-0000-0000-000000000001',
  'Lightning Arrester — Conventional/ESE with mast',
  'bos',
  'Set',
  4200.00,
  'Early Streamer Emission (ESE) lightning protection terminal with 2m mounting mast',
  true
),
(
  '40000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Net Metering & Disconnect Kit — Metering box, CTs and isolator',
  'net_metering',
  'Set',
  6500.00,
  'Utility approved bi-directional meter enclosure, current transformers, and isolation switch',
  true
),
(
  '40000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'Civil & Hardware Fasteners — SS304 anchors, clamps and hardware',
  'structure',
  'Set',
  3200.00,
  'Stainless Steel 304 chemical anchor fasteners, mid-clamps, end-clamps and spring washers',
  true
),
(
  '40000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000001',
  'Installation & Commissioning — Installation, testing and liaisoning',
  'installation',
  'Job',
  15000.00,
  'Complete rooftop mounting, electrical wiring, testing, commissioning, and DISCOM liaisoning',
  true
)
on conflict (id) do nothing;

-- 5. Update quotations status constraint to include 'issued' and 'cancelled'
alter table public.quotations drop constraint if exists quotations_status_check;
alter table public.quotations add constraint quotations_status_check
  check (status in ('draft', 'issued', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised', 'cancelled'));

-- 6. Seed sample Office and Bank Details for Default Organization
insert into public.company_offices (
  id, organization_id, office_name, address, city, state, pincode, phone, email, is_headquarters
) values
(
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Headquarters & Experience Center',
  'Sunbeam Solar Towers, Tech Park Road, Edappally',
  'Kochi',
  'Kerala',
  '682024',
  '+91 484 290 8800',
  'contact@sunbeamsolar.in',
  true
),
(
  '50000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Regional Operations Office',
  '2nd Floor, Energy Plaza, MG Road',
  'Trivandrum',
  'Kerala',
  '695001',
  '+91 471 230 4455',
  'trivandrum@sunbeamsolar.in',
  false
)
on conflict (id) do nothing;

insert into public.company_bank_accounts (
  id, organization_id, bank_name, account_holder_name, account_number, ifsc_code, branch_name, upi_id, is_primary
) values
(
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'HDFC Bank Ltd',
  'Sunbeam Solar Energy Solutions Pvt Ltd',
  '50200088991122',
  'HDFC0001234',
  'Edappally Branch, Kochi',
  'sunbeam.solar@hdfcbank',
  true
)
on conflict (id) do nothing;


-- ==============================================================================
-- MIGRATION: 20240101000009_admin_crm_controls.sql
-- ==============================================================================

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


-- ==============================================================================
-- MIGRATION: 20240101000010_storage_buckets_and_policies.sql
-- ==============================================================================

-- ==============================================================================
-- Migration: 20240101000010_storage_buckets_and_policies.sql
-- Configure private Supabase Storage buckets and access control policies
-- ==============================================================================

-- ─── 1. Create Storage Buckets ────────────────────────────────────────────────
-- Bucket for lead attachments (customer roof photos, electricity bills, drawings)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-attachments',
  'lead-attachments',
  false,
  26214400, -- 25MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
) on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];

-- Bucket for generated quotation PDFs and signed proposals
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quotation-pdfs',
  'quotation-pdfs',
  false,
  10485760, -- 10MB limit
  array['application/pdf']
) on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf'];

-- Bucket for company branding assets (company logos, signature stamps)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  true, -- Public read for PDF rendering and email embeds
  5242880, -- 5MB limit
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
) on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

-- ─── 2. Row Level Security Policies for Storage Objects ───────────────────────

-- Lead Attachments: SELECT
drop policy if exists "lead_attachments_org_select" on storage.objects;
create policy "lead_attachments_org_select"
  on storage.objects for select
  using (
    bucket_id = 'lead-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Lead Attachments: INSERT
drop policy if exists "lead_attachments_org_insert" on storage.objects;
create policy "lead_attachments_org_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'lead-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Lead Attachments: DELETE (Admin only or uploader)
drop policy if exists "lead_attachments_admin_delete" on storage.objects;
create policy "lead_attachments_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'lead-attachments'
    and auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
      or owner = auth.uid()
    )
  );

-- Quotation PDFs: SELECT
drop policy if exists "quotation_pdfs_org_select" on storage.objects;
create policy "quotation_pdfs_org_select"
  on storage.objects for select
  using (
    bucket_id = 'quotation-pdfs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Quotation PDFs: INSERT
drop policy if exists "quotation_pdfs_org_insert" on storage.objects;
create policy "quotation_pdfs_org_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'quotation-pdfs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Company Assets: SELECT (Public)
drop policy if exists "company_assets_public_select" on storage.objects;
create policy "company_assets_public_select"
  on storage.objects for select
  using (bucket_id = 'company-assets');

-- Company Assets: INSERT & UPDATE (Admin only)
drop policy if exists "company_assets_admin_insert" on storage.objects;
create policy "company_assets_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'company-assets'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ==============================================================================
-- SEED REFERENCE DATA (seed.sql)
-- ==============================================================================

-- ============================================================
-- Seed: Comprehensive Multi-Tenant Development & Testing Data
-- Fixed UUIDs for deterministic testing and reproducible scenarios
-- ============================================================

-- ─── 1. Primary Organization ─────────────────────────────────────────────────
insert into public.organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sunbeam Solar Solutions Ltd',
  'sunbeam-solar'
) on conflict (id) do update set name = excluded.name;

-- ─── 2. Secondary Organization (For Cross-Tenant Isolation Testing) ──────────
insert into public.organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000002',
  'Apex Renewable Energy Corp',
  'apex-energy'
) on conflict (id) do update set name = excluded.name;

-- ─── 3. Company Settings ─────────────────────────────────────────────────────
insert into public.company_settings (
  id, organization_id, company_name, legal_name, gst_number, pan_number,
  email, phone, website, currency, timezone, tax_rate, terms_and_conditions
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Sunbeam Solar Solutions',
  'Sunbeam Solar Solutions Private Limited',
  '27AAACS1234F1Z5',
  'AAACS1234F',
  'contact@sunbeamsolar.example',
  '+91 98765 43210',
  'https://sunbeamsolar.example',
  'INR',
  'Asia/Kolkata',
  13.80,
  'Standard warranty: 25 years on panels, 5 years on inverter. Net metering subject to DISCOM approval.'
) on conflict (organization_id) do nothing;

-- ─── 4. Company Offices ──────────────────────────────────────────────────────
insert into public.company_offices (
  id, organization_id, office_name, address, city, state, pincode, phone, email, is_headquarters
) values
(
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Corporate Headquarters',
  'Level 5, Solar Tech Park, Baner Road',
  'Pune',
  'Maharashtra',
  '411045',
  '+91 20 2567 8900',
  'pune@sunbeamsolar.example',
  true
),
(
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Regional Operations Office',
  'Unit 302, SG Highway Green Plaza',
  'Ahmedabad',
  'Gujarat',
  '380054',
  '+91 79 2689 1234',
  'ahmedabad@sunbeamsolar.example',
  false
) on conflict (id) do nothing;

-- ─── 5. Company Bank Accounts ────────────────────────────────────────────────
insert into public.company_bank_accounts (
  id, organization_id, bank_name, account_holder_name, account_number, ifsc_code, branch_name, upi_id, is_primary
) values (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'HDFC Bank Ltd',
  'Sunbeam Solar Solutions Private Limited',
  '50200012345678',
  'HDFC0001234',
  'Baner Pune Branch',
  'sunbeamsolar@okhdfcbank',
  true
) on conflict (id) do nothing;

-- ─── 6. Default Quote Components Library ─────────────────────────────────────
insert into public.default_quote_components (
  id, organization_id, name, component_type, default_unit, default_unit_price, description, is_active
) values
(
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Mono PERC Bifacial Solar Modules 545W (Tier 1)',
  'solar_panel',
  'kW',
  24500.00,
  'High-efficiency monocrystalline bifacial panels with 25-year performance warranty',
  true
),
(
  '40000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'String On-Grid Inverter 5kW 3-Phase',
  'inverter',
  'unit',
  42000.00,
  'IP65 rated high-efficiency solar string inverter with dual MPPT and WiFi monitoring',
  true
),
(
  '40000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Hot-Dip Galvanized Rooftop Mounting Structure',
  'structure',
  'kW',
  4500.00,
  'Elevated HDG structure engineered for wind speed resistance up to 150 km/h',
  true
),
(
  '40000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Balance of System (AC/DC Cables, Earthing, SPD)',
  'bos',
  'kW',
  3800.00,
  'Copper earthing kit, solar DC cables, ACDB and DCDB with surge protection devices',
  true
),
(
  '40000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Turnkey Installation, Testing & Net Metering Liaison',
  'installation',
  'kW',
  5200.00,
  'Professional electrical commissioning, safety audits, and DISCOM net meter processing',
  true
) on conflict (id) do nothing;


-- ==============================================================================
-- ADMIN ACCOUNT SETUP & PROFILE ASSIGNMENT
-- Email: tarunsaikolaa@gmail.com | Role: admin | Organization: Sunbeam Solar
-- ==============================================================================


DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Check for existing auth.users record
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tarunsaikolaa@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := '46d89047-be95-4df1-a4b7-5d8a094f3802'::uuid;
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'tarunsaikolaa@gmail.com',
      crypt('12345', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tarun Sai Kola","role":"admin"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );
  ELSE
    -- Set password to '12345' and ensure email is confirmed
    UPDATE auth.users
    SET
      encrypted_password = crypt('12345', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Tarun Sai Kola","role":"admin"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 2. Upsert profile in public.profiles with role = 'admin'
  INSERT INTO public.profiles (
    id,
    organization_id,
    company_id,
    full_name,
    email,
    role,
    account_status,
    is_active
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Tarun Sai Kola',
    'tarunsaikolaa@gmail.com',
    'admin',
    'active',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    account_status = 'active',
    is_active = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    company_id = '00000000-0000-0000-0000-000000000001',
    updated_at = now();

  RAISE NOTICE 'Admin user tarunsaikolaa@gmail.com (ID: %) successfully configured as active admin.', v_user_id;
END $$;
