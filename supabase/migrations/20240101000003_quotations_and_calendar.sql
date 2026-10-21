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

create trigger quotations_sync_compat
  before insert or update on public.quotations
  for each row execute function public.sync_quotation_compat_fields();

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

create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

create index if not exists calendar_events_org_idx on public.calendar_events(organization_id);
create index if not exists calendar_events_user_idx on public.calendar_events(user_id, start_time);
create index if not exists calendar_events_lead_idx on public.calendar_events(lead_id);
create index if not exists calendar_events_visit_idx on public.calendar_events(site_visit_id);

-- ─── Row-Level Security: default_quote_components ────────────────────────────
alter table public.default_quote_components enable row level security;

create policy "quote_components_select_org"
  on public.default_quote_components for select
  using (organization_id = public.current_organization_id());

create policy "quote_components_admin_all"
  on public.default_quote_components for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- ─── Row-Level Security: quotations ──────────────────────────────────────────
alter table public.quotations enable row level security;

-- Admin: full access to organization quotations
create policy "quotations_admin_all"
  on public.quotations for all
  using (organization_id = public.current_organization_id() and public.is_admin())
  with check (organization_id = public.current_organization_id() and public.is_admin());

-- Inbound Sales: select all quotations in organization
create policy "quotations_sales_select"
  on public.quotations for select
  using (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: create quotations
create policy "quotations_sales_insert"
  on public.quotations for insert
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Inbound Sales: update quotations
create policy "quotations_sales_update"
  on public.quotations for update
  using (organization_id = public.current_organization_id() and public.is_inbound_sales())
  with check (organization_id = public.current_organization_id() and public.is_inbound_sales());

-- Field Agent: select quotations for assigned leads only
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
create policy "quotation_items_select"
  on public.quotation_items for select
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
    )
  );

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

create policy "calendar_integrations_own_select"
  on public.calendar_integrations for select
  using (
    (user_id = auth.uid() and organization_id = public.current_organization_id())
    or (organization_id = public.current_organization_id() and public.is_admin())
  );

create policy "calendar_integrations_own_insert"
  on public.calendar_integrations for insert
  with check (user_id = auth.uid() and organization_id = public.current_organization_id());

create policy "calendar_integrations_own_update"
  on public.calendar_integrations for update
  using (user_id = auth.uid() and organization_id = public.current_organization_id())
  with check (user_id = auth.uid() and organization_id = public.current_organization_id());

create policy "calendar_integrations_own_delete"
  on public.calendar_integrations for delete
  using (
    (user_id = auth.uid() and organization_id = public.current_organization_id())
    or (organization_id = public.current_organization_id() and public.is_admin())
  );

-- ─── Row-Level Security: calendar_events ─────────────────────────────────────
alter table public.calendar_events enable row level security;

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

create policy "calendar_events_insert"
  on public.calendar_events for insert
  with check (
    organization_id = public.current_organization_id()
    and user_id = auth.uid()
  );

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

create policy "calendar_events_delete"
  on public.calendar_events for delete
  using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_admin())
  );
