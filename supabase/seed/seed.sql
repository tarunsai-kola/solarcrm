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
