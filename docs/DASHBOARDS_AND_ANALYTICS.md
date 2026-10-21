# Solar CRM — Dashboards & Analytics Documentation

## 1. Executive Summary

Solar CRM provides role-optimized, data-driven dashboards for all three core personas:
1. **Executive Administrator Dashboard**: Multi-dimensional telemetry across the entire sales and technical pipeline with 11 KPIs, 7 rich Recharts visualizations, date range filters, team member comparison, and full record drill-downs.
2. **Inbound Sales Dashboard**: Personalized workspace for sales representatives featuring individual pipeline KPIs, urgent follow-up action cards with one-click dialer, priority hot leads, and personal conversion funnel.
3. **Field Technical Agent Dashboard**: Geographically and technically focused schedule featuring assigned territory leads, today's on-site rooftop audit schedule with Google Maps directions, upcoming visits, and pending technical feasibility reports.

---

## 2. Metric Definitions & Calculation Formulas

| Metric Name | Applicable Roles | Exact Calculation / SQL Formula | Business Rationale |
|---|---|---|---|
| **Total Leads** | Admin, Inbound Sales | `COUNT(leads.id)` filtered by `organization_id` (and date range / rep) | Baseline volume of customer demand entering the CRM |
| **Fresh Leads** | Admin, Inbound Sales | `COUNT(leads.id) WHERE status = 'new'` | Newly arrived leads requiring initial sales outreach |
| **Contacted Leads** | Admin, Inbound Sales | `COUNT(leads.id) WHERE status = 'contacted'` | Leads where outreach has been initiated but not yet qualified |
| **Hot & Warm Leads** | Admin, Inbound Sales | `COUNT(leads.id) WHERE temperature IN ('hot', 'warm')` | High purchase intent leads prioritized for expedited follow-up |
| **Follow-ups Due Today** | Admin, Inbound Sales | `COUNT(follow_ups.id) WHERE completion_status = 'pending' AND due_at >= startOfToday AND due_at <= endOfToday` | Scheduled phone calls / meetings requiring action today |
| **Overdue Follow-ups** | Admin, Inbound Sales | `COUNT(follow_ups.id) WHERE completion_status IN ('pending', 'overdue') AND due_at < startOfToday` | Missed customer touchpoints requiring immediate triage |
| **Site Visits Scheduled** | Admin, Inbound Sales, Field Agent | `COUNT(site_visits.id) WHERE visit_status = 'scheduled'` | On-site roof inspections booked on technical agent calendars |
| **Quotations Sent** | Admin, Inbound Sales | `COUNT(quotations.id) WHERE status IN ('sent', 'viewed', 'accepted')` | Commercial pricing proposals presented to customers |
| **Won Leads** | Admin, Inbound Sales | `COUNT(leads.id) WHERE status = 'won'` | Customers who signed contracts for solar installation |
| **Lost & Disqualified Leads** | Admin, Inbound Sales | `COUNT(leads.id) WHERE status IN ('lost', 'disqualified')` | Leads determined unfeasible or lost to competition |
| **Lead Conversion Rate** | Admin, Inbound Sales | `total_leads > 0 ? (won_leads / total_leads) * 100 : 0` | Primary top-of-funnel conversion efficiency percentage |
| **Closed Deal Win-Loss Rate** | Admin | `(won + lost) > 0 ? (won / (won + lost)) * 100 : 0` | Win rate among fully evaluated and closed leads |
| **Won Revenue** | Admin, Inbound Sales | `SUM(deduplicated accepted quotation total_amount)` for won leads | Confirmed gross contract value from closed deals (see deduplication rules below) |
| **Average Deal Size** | Admin | `won_leads > 0 ? Math.round(won_revenue / won_leads) : 0` | Average contract value per closed solar installation |
| **Completed Visits** | Admin, Field Agent | `COUNT(site_visits.id) WHERE visit_status = 'completed'` | Completed rooftop feasibility inspections |
| **Pending Site Reports** | Admin, Field Agent | `COUNT(site_visits.id) WHERE visit_status IN ('completed', 'in_progress') AND (roof_suitability IS NULL OR recommended_system_capacity_kw IS NULL)` | Visits where on-site inspection was done but technical assessment has not been entered |

---

## 3. Revenue Deduplication & Double-Counting Prevention

Solar installations often undergo quote revisions as system sizes or components change (e.g., Revision 1 @ ₹2,50,000 revised to Revision 2 @ ₹2,40,000).

To prevent double-counting:
1. Won revenue identifies unique `won` leads.
2. For each won lead, only the **accepted** quotation (or the latest revision) is counted toward `won_revenue`.
3. Draft, revised, rejected, and expired quotations are excluded from revenue aggregation.
4. If a lead has multiple revised quotations, only one accepted quotation is summed per lead.

---

## 4. Role Authorization & Strict Privacy Guarantees

1. **Organization Isolation**:
   Every database query filters by `organization_id = req.auth.organizationId`. Cross-tenant data leakage is impossible.
2. **Field Agent Privacy Guard**:
   - Field agents can **only** view site visits and leads assigned to them.
   - If a field agent attempts to pass another agent's ID via query parameters (`?agent_id=...` or `?team_member_id=...`), the API immediately responds with **`403 Forbidden`** (`Access denied: Field agents cannot view other agents' private performance data`).
3. **Inbound Sales Scoping**:
   - Sales reps view aggregate figures for leads assigned to them (`inbound_sales_id = req.auth.userId`) or created by them.
4. **Admin Executive Authority**:
   - Administrators can view organization-wide aggregates or drill down into any individual rep's performance.

---

## 5. Visualizations & Chart Specifications (Recharts)

1. **Leads Created Over Time**: Responsive AreaChart with gradients depicting daily lead generation vs won deals.
2. **Leads by Status**: Horizontal BarChart with custom theme color palettes (`#3b82f6` for new, `#10b981` for won, etc.).
3. **Leads by Source**: Donut/PieChart displaying customer acquisition channels (Meta Ads, Tata Solar, JustDial, Website, Referral).
4. **Salesperson Performance**: Interactive comparison table showing leads handled, contacted %, won deals, and revenue per sales rep.
5. **Field Agent Performance**: Comparison table tracking assigned territory leads, completed site visits, and won deals per technician.
6. **Conversion Funnel**: 5-stage pipeline drop-off visualization:
   `Total Leads (100%)` → `Contacted` → `Site Visit` → `Quotation Sent` → `Won Deals`.
7. **Follow-Up Completion Health**: Three-way status cards (Completed, Pending, Overdue) and overall completion percentage.
8. **Won Revenue Over Time**: LineChart tracking cumulative and periodic contract value generation.

---

## 6. Record Drill-Downs

Clicking any KPI card (e.g., "Fresh Leads", "Overdue Follow-ups", "Hot Leads", "Site Visits Scheduled") opens the `<DrillDownModal />` dialog:
- Fetches the exact underlying database records from `/api/v1/dashboard/drill-down`.
- Displays customer contact information, phone, location/area, status badge, notes, and scheduled date.
- Supports server-side pagination with previous/next controls.

---

## 7. Verification & Automated Test Coverage

The test suite contains 72 automated integration and unit tests passing with 100% success:

1. **`apps/api/tests/dashboard.test.ts` (12 tests)**:
   - Validates all 11 admin KPI formulas against deterministic sample data.
   - Verifies won revenue deduplication across multiple quotation revisions.
   - Tests Inbound Sales dashboard scoping and urgent task sorting.
   - Tests Field Agent dashboard today's visits, upcoming audits, and pending reports.
   - Enforces field agent privacy (rejects unauthorized agent access with 403).
   - Validates drill-down endpoint pagination and metric filters.
2. **`apps/web/tests/unit/dashboard.test.ts` (6 tests)**:
   - Tests conversion rate formula `(won / total) * 100`.
   - Tests safe handling of 0 total leads (prevents NaN / division by zero).
   - Tests closed deal win/loss rate.
   - Verifies quotation deduplication algorithm.
   - Tests Indian Rupee (INR ₹) currency formatting with Lakh/Crore grouping.
