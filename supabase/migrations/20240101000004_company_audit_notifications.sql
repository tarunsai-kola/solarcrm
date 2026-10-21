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

create policy "company_settings_select_org"
  on public.company_settings for select
  using (organization_id = public.current_organization_id());

create policy "company_settings_admin_all"
  on public.company_settings for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: company_offices ─────────────────────────────────────
alter table public.company_offices enable row level security;

create policy "company_offices_select_org"
  on public.company_offices for select
  using (organization_id = public.current_organization_id());

create policy "company_offices_admin_all"
  on public.company_offices for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: company_bank_accounts ───────────────────────────────
alter table public.company_bank_accounts enable row level security;

create policy "company_bank_accounts_select_org"
  on public.company_bank_accounts for select
  using (organization_id = public.current_organization_id());

create policy "company_bank_accounts_admin_all"
  on public.company_bank_accounts for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: notifications ──────────────────────────────────────
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Direct client inserts denied (notifications must be inserted by server or SECURITY DEFINER functions)
create policy "notifications_no_client_insert"
  on public.notifications for insert
  with check (false);

-- ─── Row-Level Security: audit_logs ──────────────────────────────────────────
alter table public.audit_logs enable row level security;

-- Only organization admins can view audit logs
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (
    organization_id = public.current_organization_id()
    and public.is_admin()
  );

-- Direct client inserts denied (must use log_audit_event or server service-role)
create policy "audit_logs_no_client_insert"
  on public.audit_logs for insert
  with check (false);

-- Updates completely denied at RLS level (also blocked by immutable trigger)
create policy "audit_logs_no_update"
  on public.audit_logs for update
  using (false);

-- Deletions completely denied at RLS level (also blocked by immutable trigger)
create policy "audit_logs_no_delete"
  on public.audit_logs for delete
  using (false);
