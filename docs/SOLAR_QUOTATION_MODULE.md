# Complete Solar Quotation Module (Prompt 9)

A production-grade, authoritative solar quotation builder with decimal-safe calculations, configurable company branding, immutable version history, and professional A4 PDF generation.

---

## 1. Architectural Overview & Workflow

```
[Lead / Customer]
       │
       ▼
[Quotation Builder] ──► Preload 12 Seeded BOM Components (Panels, Inverter, Structure, Cables...)
       │            ──► Client-side Decimal Preview (Subtotal, Discount, GST 13.8%, KSEB, Total)
       ▼
[API Server Validation] ──► Pure Decimal-Safe Math (Number.EPSILON, prevents IEEE-754 drift)
       │                ──► Enforce RBAC (Admin & Sales only; Field Agent blocked with 403)
       │                ──► Freeze Company Snapshot (Branding, Offices, Bank Details)
       ▼
[Database Persistence] ──► quotations + quotation_items (Unique Ref: SUN-YYYYMM-XXXX)
       │
       ├──► [Status Transitions]: draft ──► issued (locked) ──► sent ──► accepted / rejected
       │                                         │
       │                                         ▼
       │                                  [Create Revision]
       │                                         │
       │                                         ├──► v1 marked 'revised' (is_latest = false)
       │                                         └──► v2 created (version = 2, is_latest = true)
       ▼
[PDFKit Engine] ──► Generates A4 PDF (Branding, Customer Box, BOM Table, Totals, Warranties,
                     Authorized Bank Card, Terms & Conditions, Configured Offices Footer)
```

---

## 2. A. Company & Quotation Branding

Admin-configurable branding settings persisted in PostgreSQL `company_settings`:
- **Company Display Name**: Brand name rendered prominently in header and legal clauses.
- **Tagline & Credential Line**: Tagline (e.g. *Powering a Greener Tomorrow*) and empanelment badge (*MNRE Empanelled Solar Partner • ISO 9001:2015 Certified*).
- **Contact Details**: Phone, official email, website, and GSTIN.
- **Office Locations (Min 1, Max 6)**:
  - Office label (e.g. *Headquarters & Experience Center*, *Regional Operations Office*).
  - Address, City, State, and Pincode.
  - Dedicated phone number.
  - **Rendered in PDF footer across all pages.**
  - Enforced business rules: deletion blocked when `<= 1` office remains; addition blocked when `>= 6` offices exist.
- **Bank Account Details**:
  - Bank Name, Account Holder Name, Account Number, IFSC Code, Branch, UPI ID.
  - Primary quotation account flag.
  - **Security Guarantee**: Bank account endpoints require Admin privileges. Bank details are strictly shielded from public/unauthenticated endpoints and only rendered inside authorized quotation viewing and PDF generation workflows.
- **Warranties**:
  - Solar PV Modules: 25 years (linear performance guarantee).
  - Solar Inverter: 5–10 years.
  - System Workmanship / BOS: 10 years.
  - Battery Bank: 5 years (for hybrid systems).
- **Statutory Taxes & Charges**:
  - Editable composite GST rate (default 13.80%, split into CGST 6.90% + SGST 6.90%).
  - Configurable KSEB / DISCOM statutory application and metering fees (e.g. ₹2,500).
  - Standard terms and conditions.

---

## 3. B. Default Bill of Materials (BOM) Library

12 pre-seeded, fully configurable default components in `default_quote_components`:

| # | Component Name | Category | Default Unit | Default Rate (₹) | Specifications |
|---|---|---|---|---|---|
| 1 | Solar PV Modules — Tier-1 Mono PERC/TOPCon Half-Cut | `solar_panel` | Nos | 24,000 | Tier-1 high efficiency solar photovoltaic modules with 25-year linear performance warranty |
| 2 | Solar Inverter — Grid-Tied/Hybrid Inverter | `inverter` | Set | 45,000 | High efficiency solar grid-tied/hybrid string inverter with WiFi monitoring and dual MPPT |
| 3 | Module Mounting Structure — Hot-Dip Galvanized/Anodized Aluminium | `structure` | Set | 8,500 | Corrosion-resistant HDG/Aluminium structure engineered for 150 km/h wind loads |
| 4 | AC Distribution Box — SPD, MCB and IP65 enclosure | `bos` | Set | 3,500 | IP65 outdoor enclosure with Type-2 surge protection device and calibrated MCB |
| 5 | DC Distribution Box — Fuse, SPD and isolator | `bos` | Set | 4,000 | 1000V DC surge protection device, high-voltage gPV fuses, and rotary DC isolator |
| 6 | DC Solar Cables — UV-resistant 4/6 sq.mm copper cable | `bos` | Mtr | 65 | Electron-beam crosslinked halogen-free UV and weather-resistant copper cables |
| 7 | AC Cables — 4-core armoured copper/aluminium cable | `bos` | Mtr | 120 | Heavy duty XLPE insulated multi-strand armoured cable |
| 8 | Earthing System — Chemical earthing rods | `bos` | Sets | 2,800 | Maintenance-free chemical copper bonded electrode with low-resistivity compound |
| 9 | Lightning Arrester — Conventional/ESE with mast | `bos` | Set | 4,200 | Early Streamer Emission (ESE) lightning protection terminal with 2m mounting mast |
| 10 | Net Metering & Disconnect Kit — Metering box, CTs and isolator | `net_metering` | Set | 6,500 | Utility approved bi-directional meter enclosure, current transformers, and isolator |
| 11 | Civil & Hardware Fasteners — SS304 anchors, clamps and hardware | `structure` | Set | 3,200 | Stainless Steel 304 chemical anchor fasteners, mid-clamps, end-clamps |
| 12 | Installation & Commissioning — Installation, testing and liaisoning | `installation` | Job | 15,000 | Complete rooftop mounting, electrical wiring, testing, and DISCOM liaisoning |

- **Customizability**: Admins can add, edit, reorder, or deactivate default items in `/company-settings`.
- **Quotation Overrides**: Each quotation can override quantities, specifications, units, and rates without altering the company library.

---

## 4. C. Authoritative Server-Side Calculation Engine

Implemented in `apps/api/src/services/quotation-calc.ts`.

### Financial Calculation Formulae:

1. **Decimal-Safe Rounding**:
   $$\text{round2}(x) = \frac{\text{round}((x + \varepsilon) \times 100)}{100}$$
   Prevents binary floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).

2. **Line Item Total**:
   $$\text{Total}_i = \text{round2}(\text{Quantity}_i \times \text{UnitPrice}_i)$$
   Optional add-on items (`is_optional = true`) are itemized in the proposal but excluded from subtotal.

3. **Subtotal**:
   $$\text{Subtotal} = \sum_{i \in \text{Required}} \text{Total}_i$$

4. **Discount Clamping**:
   $$\text{Discount} = \min(\text{Subtotal}, \max(0, \text{Discount}_{\text{input}}))$$
   Guarantees taxable value never drops below ₹0.

5. **Taxable Value**:
   $$\text{Taxable Value} = \text{round2}(\text{Subtotal} - \text{Discount})$$

6. **Composite GST & Equal Tax Split**:
   $$\text{Tax Amount} = \text{round2}\left(\frac{\text{Taxable Value} \times \text{GSTRate}}{100}\right)$$
   $$\text{CGST} = \text{round2}\left(\frac{\text{Tax Amount}}{2}\right), \quad \text{SGST} = \text{round2}(\text{Tax Amount} - \text{CGST})$$
   Ensures $\text{CGST} + \text{SGST} \equiv \text{Tax Amount}$ with zero 1-paise split drift.

7. **Grand Total**:
   $$\text{Grand Total} = \text{round2}(\text{Taxable Value} + \text{Tax Amount} + \text{KSEB Charges})$$

8. **Payment Milestones**:
   $$\text{Advance} = \text{round2}\left(\frac{\text{Grand Total} \times \text{AdvancePercentage}}{100}\right)$$
   $$\text{Balance} = \text{round2}(\text{Grand Total} - \text{Advance})$$

---

## 5. D. Lifecycle & Historical Versioning

| Status | Allowed Next Statuses | Action / Side Effect |
|---|---|---|
| `draft` | `issued`, `cancelled` | Editable in place; recalculates totals on save. |
| `issued` | `sent`, `cancelled`, `revised` | Snapshot frozen (`company_snapshot`). Editing locked. |
| `sent` | `viewed`, `accepted`, `rejected`, `cancelled`, `revised` | Automatically updates lead status to `quotation_sent`. |
| `accepted` | `revised` | Deal won / contract execution stage. |
| `revised` | — | Historical record (`is_latest = false`). Preserved for audit. |
| `cancelled` | — | Proposal terminated. |

### Revision Flow:
When an issued or sent quotation (e.g. `SUN-202610-0001` v1) is revised:
1. `v1` is marked `status = 'revised'`, `is_latest = false`.
2. `v2` is generated with `quotation_number = 'SUN-202610-0001'`, `version = 2`, `parent_quotation_id = v1.id`, `status = 'draft'`, `is_latest = true`.
3. Historical `v1` values and company branding are preserved 100% intact through `company_snapshot`.

---

## 6. E. Professional A4 PDF Generation (`pdfkit`)

Implemented in `apps/api/src/services/quotation-pdf.ts`:
- **Document Layout**: Standard ISO 216 A4 format (595.28 × 841.89 points).
- **Color Palette**: Solar Deep Navy (`#1E3A8A`), Solar Amber (`#F59E0B`), Charcoal (`#111827`), Subtle Borders (`#E5E7EB`).
- **Sections**:
  1. **Branding Header**: Company name, tagline, credential line, phone, email, website, and GSTIN.
  2. **Proposal Title Strip**: Reference number, version, status badge.
  3. **Two-Column Customer & Quotation Box**: Customer name, phone, site address, issue date, validity date, system capacity in kWp, phase, and type.
  4. **Bill of Materials Table**: Component name, technical specifications, category, quantity, unit, unit rate (₹), line total (₹).
  5. **Warranty Badges & Financial Breakdown**: 25-yr module guarantee, inverter warranty, workmanship, subtotal, discount, taxable value, GST rate breakdown, statutory fees, grand total banner, advance/balance split.
  6. **Official Bank Card**: Bank name, account holder, account number, IFSC code, branch, UPI ID.
  7. **Terms & Conditions + Authorized Signatory Block**.
  8. **Multi-Page Footers**: Dynamic pagination (`Page X of Y`) and configured office locations (up to 6) in columns.

---

## 7. Verification & Monorepo Test Results

- **API Tests**: 11 test suites passing, **119 unit & integration tests**.
  - `quotation-calc.test.ts`: Pure calculations, fractional meters, discount capping, optional items, 1-paise split accuracy.
  - `quotations-integration.test.ts`: DB operations, versioning, permissions guard (field agents blocked with 403), bank accounts security, PDF generation returning valid `%PDF-` buffer, office locations min/max enforcement.
- **Web Tests**: 6 test suites passing, **36 unit tests**.
  - `quotations.test.ts`: Client calculation engine, capacity scaling, discount clamping, advance split.
- **Grand Total**: **155 automated tests passing monorepo-wide**.
- **Type Checking**: Both `apps/api` and `apps/web` compile with 0 errors under strict TypeScript (`tsc --noEmit`).
- **Production Bundles**: `vite build` and `tsc -p tsconfig.build.json` clean.
