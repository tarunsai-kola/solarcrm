-- ==============================================================================
-- Production Reference Seed: Approved Catalogue & Root Admin Setup
-- Excludes all development mock data, test leads, dummy call logs, or test users
-- ==============================================================================

-- ─── 1. Primary Organization ─────────────────────────────────────────────────
insert into public.organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sunbeam Solar Solutions Ltd',
  'sunbeam-solar'
) on conflict (id) do update set name = excluded.name;

-- ─── 2. Production Company Settings ──────────────────────────────────────────
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
  'contact@sunbeamsolar.in',
  '+91 20 2567 8900',
  'https://sunbeamsolar.in',
  'INR',
  'Asia/Kolkata',
  13.80,
  '1. Warranty: 25 years linear performance warranty on solar PV modules; 5 years on solar inverter.
2. Net Metering: Sanction and bi-directional meter installation are subject to state electricity board (DISCOM) inspection and approval timelines.
3. Payment Terms: 10% advance with work order, 70% upon delivery of materials at site, 20% on testing and grid synchronization.
4. Structure: Mounting structure designed to withstand wind speeds up to 150 km/h.'
) on conflict (organization_id) do nothing;

-- ─── 3. Headquarters Office ──────────────────────────────────────────────────
insert into public.company_offices (
  id, organization_id, office_name, address, city, state, pincode, phone, email, is_headquarters
) values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Corporate Headquarters',
  'Level 5, Solar Tech Park, Baner Road',
  'Pune',
  'Maharashtra',
  '411045',
  '+91 20 2567 8900',
  'contact@sunbeamsolar.in',
  true
) on conflict (id) do nothing;

-- ─── 4. Default Bill of Materials (BOM) Catalogue ─────────────────────────────
insert into public.default_quote_components (
  id, organization_id, component_name, component_type, description,
  specifications, default_quantity, unit, default_unit_price, is_optional, sort_order, is_active
) values
(
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Mono PERC Solar PV Modules (545Wp)',
  'panel',
  'High-efficiency Tier-1 Monocrystalline half-cut solar photovoltaic modules',
  '545Wp, 144 half-cells, IP68 junction box, 21.2% module efficiency',
  10,
  'nos',
  9500.00,
  false,
  1,
  true
),
(
  '40000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'On-Grid Solar Inverter with Dual MPPT',
  'inverter',
  'Grid-tied string inverter with built-in Wi-Fi monitoring and high efficiency',
  '5kW Three Phase / Single Phase, 98.4% max efficiency, IP65 rated',
  1,
  'nos',
  42000.00,
  false,
  2,
  true
),
(
  '40000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Module Mounting Structure (HDG / Aluminum)',
  'structure',
  'Heavy duty hot-dip galvanized and anodized aluminum rooftop mounting structure',
  'Designed for 150 km/h wind speed, South facing 15-20 deg tilt angle',
  1,
  'set',
  18500.00,
  false,
  3,
  true
),
(
  '40000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Balance of System (BOS) & Protection Gear',
  'bos',
  'ACDB, DCDB with Type-2 SPDs, MCBs, 4 sq mm solar DC cables and UV conduits',
  'IP65 Polycarbonate enclosure, copper busbars, MC4 connectors',
  1,
  'set',
  14000.00,
  false,
  4,
  true
),
(
  '40000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Chemical Earthing & Lightning Protection System',
  'bos',
  'Copper bonded earthing electrodes with ground enhancement material and Franklin lightning rod',
  '3 Earth pits (AC, DC, LA) with chamber covers and testing links',
  1,
  'set',
  11500.00,
  false,
  5,
  true
),
(
  '40000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'Installation, Testing & Grid Synchronization',
  'installation',
  'Turnkey civil, mechanical, and electrical installation by certified solar engineers',
  'Includes structure erection, module clamping, inverter termination, and DISCOM liaisoning',
  1,
  'job',
  25000.00,
  false,
  6,
  true
) on conflict (id) do nothing;

-- ─── 5. CRM Lead Sources Reference Data ───────────────────────────────────────
insert into public.crm_lead_sources (organization_id, name, is_active, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Meta Ads', true, 1),
  ('00000000-0000-0000-0000-000000000001', 'Google Search / SEO', true, 2),
  ('00000000-0000-0000-0000-000000000001', 'Customer Referral', true, 3),
  ('00000000-0000-0000-0000-000000000001', 'Direct Website Inquiry', true, 4),
  ('00000000-0000-0000-0000-000000000001', 'Walk-in Customer', true, 5),
  ('00000000-0000-0000-0000-000000000001', 'Solar Expo / Exhibition', true, 6)
on conflict do nothing;

-- ─── 6. CRM Loss Reasons Reference Data ───────────────────────────────────────
insert into public.crm_loss_reasons (organization_id, reason, is_active, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Competitor Pricing', true, 1),
  ('00000000-0000-0000-0000-000000000001', 'Bank / Solar Financing Rejected', true, 2),
  ('00000000-0000-0000-0000-000000000001', 'Roof Infeasible / High Shading', true, 3),
  ('00000000-0000-0000-0000-000000000001', 'DISCOM Sanction / Net Metering Delay', true, 4),
  ('00000000-0000-0000-0000-000000000001', 'Customer Postponed Project', true, 5),
  ('00000000-0000-0000-0000-000000000001', 'Lead Non-Responsive / Wrong Number', true, 6)
on conflict do nothing;

-- ─── 7. Initial Admin Account Instruction Note ────────────────────────────────
-- Create initial Administrator in Supabase Auth Dashboard or via Supabase CLI:
--
-- Email: admin@sunbeamsolar.in
-- Password: <SecurePasswordProvidedInDeployment>
--
-- Once user is created in auth.users, associate the profile:
-- insert into public.profiles (
--   id, organization_id, company_id, email, full_name, role, is_active, account_status
-- ) values (
--   '<AUTH_USER_UUID>',
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000001',
--   'admin@sunbeamsolar.in',
--   'System Administrator',
--   'admin',
--   true,
--   'active'
-- ) on conflict (id) do update set role = 'admin', is_active = true;
