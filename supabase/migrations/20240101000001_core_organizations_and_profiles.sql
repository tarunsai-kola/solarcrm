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

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create index if not exists organizations_slug_idx on public.organizations(slug);

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

create trigger profiles_sync_compat
  before insert or update on public.profiles
  for each row execute function public.sync_profile_compat_fields();

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

create trigger profiles_role_security_trigger
  before update on public.profiles
  for each row execute function public.enforce_profile_role_security();

-- ─── Row-Level Security: organizations ──────────────────────────────────────
alter table public.organizations enable row level security;

create policy "org_select_member"
  on public.organizations for select
  using (id = public.current_organization_id());

create policy "org_update_admin"
  on public.organizations for update
  using (id = public.current_organization_id() and public.is_admin())
  with check (id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: companies (backward compat) ────────────────────────
alter table public.companies enable row level security;

create policy "companies_select_member"
  on public.companies for select
  using (organization_id = public.current_organization_id());

create policy "companies_update_admin"
  on public.companies for update
  using (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: profiles ───────────────────────────────────────────
alter table public.profiles enable row level security;

-- Members can see all profiles in their organization
create policy "profiles_select_same_org"
  on public.profiles for select
  using (organization_id = public.current_organization_id());

-- Users can update their own non-privileged profile fields
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid() and organization_id = public.current_organization_id())
  with check (id = auth.uid() and organization_id = public.current_organization_id());

-- Admins can update any profile within their organization
create policy "profiles_update_admin"
  on public.profiles for update
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Only admins can insert new profiles into their organization
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Only admins can delete profiles from their organization (except themselves)
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (
    organization_id = public.current_organization_id()
    and public.is_admin()
    and id <> auth.uid()
  );

-- ─── Row-Level Security: field_agent_profiles ───────────────────────────────
alter table public.field_agent_profiles enable row level security;

create policy "field_agent_profiles_select_org"
  on public.field_agent_profiles for select
  using (organization_id = public.current_organization_id());

create policy "field_agent_profiles_insert"
  on public.field_agent_profiles for insert
  with check (
    organization_id = public.current_organization_id()
    and (public.is_admin() or user_id = auth.uid())
  );

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

create policy "field_agent_profiles_delete_admin"
  on public.field_agent_profiles for delete
  using (organization_id = public.current_organization_id() and public.is_admin());
