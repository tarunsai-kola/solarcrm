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
