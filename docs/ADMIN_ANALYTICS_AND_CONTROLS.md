# Admin Reporting, Advanced Analytics & CRM Controls Specification

## 1. Overview
The **Solar CRM Admin Reporting & Management Module** provides comprehensive executive intelligence, user-level performance tracking, interactive pipeline analytics, granular CRM workflow configuration, and tamper-resistant audit log inspection.

Every KPI formula is mathematically defined, fully reproducible, and based strictly on authorized database records.

---

## 2. Mathematical KPI Formulas & Calculation Methodology

### 2.1 Inbound Sales User-Level Metrics

| Metric | Mathematical Formula | Handling Edge Cases |
| :--- | :--- | :--- |
| **Total Leads Managed** | $\sum \mathbb{I}(\text{inbound\_sales\_id} = \text{user\_id})$ | Scoped to active organization and selected date range. |
| **Fresh Leads Awaiting Contact** | $\sum \mathbb{I}(\text{status} = \text{'new'})$ | Identifies uncontacted leads requiring immediate outreach. |
| **Activities & Calls Logged** | $\sum \mathbb{I}(\text{created\_by} = \text{user\_id} \lor \text{user\_id} = \text{user\_id})$ | Broken down into calls (outgoing/incoming) vs general activities. |
| **Conversion Rate (%)** | $\left( \frac{\text{Won Leads}}{\text{Total Leads Managed}} \right) \times 100$ | If total leads = 0, returns `0.0%` (safe against division by zero). |
| **Won Revenue (INR)** | $\sum \text{grand\_total}_{\text{accepted quotations}}$ | Accurately deduplicated per lead using accepted quotation revisions. |
| **Average Time to First Contact (Hours)** | $\frac{1}{N_{\text{contacted}}} \sum_{i=1}^{N_{\text{contacted}}} \left( \frac{\min(t_{\text{activity}, i}) - t_{\text{created}, i}}{3,600,000} \right)$ | Difference between lead creation timestamp and earliest activity timestamp. Returns `null` if no leads have been contacted yet. |
| **Lead Ageing Distribution** | Bucketed by $(t_{\text{now}} - t_{\text{created}})$: `0–3d`, `4–7d`, `8–14d`, `14+d` | Highlights stalled deals needing management re-engagement. |
| **Inactivity Count** | Leads with status $\notin \{\text{'won'}, \text{'lost'}, \text{'disqualified'}, \text{'not\_interested'}\}$ where $(t_{\text{now}} - \max(t_{\text{activity}})) > 7 \text{ days}$ | Triggers supervisor alerts for neglected opportunities. |

---

### 2.2 Field Agent User-Level Metrics

| Metric | Mathematical Formula | Description & Purpose |
| :--- | :--- | :--- |
| **Assigned Leads** | $\sum \mathbb{I}(\text{assigned\_field\_agent\_id} = \text{agent\_id})$ | Active territories and leads assigned to this field engineer. |
| **Visit Completion Rate (%)** | $\left( \frac{\text{Completed Site Visits}}{\text{Scheduled Site Visits}} \right) \times 100$ | Evaluates site survey feasibility fulfillment rate. |
| **Leads Awaiting Field Action** | Leads where assigned agent has no completed visit or submitted report | Tracks backlog awaiting rooftop inspection. |
| **Site Reports Submitted** | $\sum \mathbb{I}(\text{visit\_status} = \text{'completed'} \land (\text{roof\_suitability} \neq \text{null} \lor \text{notes} \neq \text{null}))$ | Measures completion of rooftop structural and electrical measurements. |
| **Post-Visit Deal Outcomes** | Categorized into: Won, Lost, Quotation Sent, Disqualified, In Progress | Tracks final conversion efficacy following physical site visits. |
| **Workload & Overdue Tasks** | Active unclosed leads + overdue scheduled visits + overdue follow-ups | Enforces workload caps to prevent engineer burnout. |

---

### 2.3 Follow-up SLA Compliance Formula
Follow-up deadlines are critical for maintaining customer trust and closing solar contracts:
$$\text{Follow-up SLA Compliance Rate (\%)} = \left( \frac{\text{Completed on or before due\_at}}{\text{Total Completed Follow-ups}} \right) \times 100$$
- If no completed follow-ups exist in the filtered period, default SLA compliance is `100.0%`.
- **Average Overdue Delay (Hours)**:
$$\text{Average Delay} = \frac{1}{N_{\text{overdue}}} \sum_{j=1}^{N_{\text{overdue}}} \max\left(0, \frac{t_{\text{now}} - t_{\text{due}, j}}{3,600,000}\right)$$

---

## 3. Company-Wide Analytics & Funnel Architecture

### 3.1 6-Stage Conversion Funnel
1. **Fresh Inquiries**: All inbound leads created in scope ($N_1$).
2. **Contacted Leads**: Initial customer touchpoint established ($\text{status} \neq \text{'new'}$, $N_2$).
3. **Qualified Leads**: Rooftop dimensions and DISCOM electricity bill confirmed ($N_3$).
4. **Site Visit Completed**: Field engineer has conducted physical orientation & shadow analysis ($N_4$).
5. **Quotation Sent**: Formal Bill of Materials (BOM) proposal delivered ($N_5$).
6. **Won Deals**: Deal closed, contract executed or advance deposit received ($N_6$).

**Funnel Indicators**:
- Drop-off Percentage: $\left(\frac{N_{k-1} - N_k}{N_{k-1}}\right) \times 100$
- Conversion from Start: $\left(\frac{N_k}{N_1}\right) \times 100$

### 3.2 Lead Source & Campaign Performance
Tracks inbound channels (Meta Ads, Tata Solar, JustDial, Website, Referrals, Cold Calls) with:
- Total Leads Volume
- Won Leads Count
- Win Rate Percentage ($\%$)
- Realized Won Revenue (₹ INR)
- Average Deal Size ($\text{Won Revenue} / \text{Won Deals}$)

### 3.3 Pincode & Regional Performance
Aggregates lead volume, feasibility surveys completed, won deals, and revenue by postal district (`pincode`), assisting regional operations in allocating field engineers and targeting regional marketing campaigns.

---

## 4. Administrative CRM Controls

Accessible to administrators under `/reports` (Export & Controls tab) and `/company-settings`:

1. **Lead Statuses & Pipeline Stages**:
   - Enable/disable pipeline stages.
   - Configure custom display labels and display sorting order.
2. **Enquiry Classifications**:
   - Residential Rooftop, Commercial & Institutional, Industrial Solar, Agricultural Solar Pump, Housing Society, Other.
   - Add new custom enquiry categories.
3. **Lead Sources & Campaign Tags**:
   - Manage acquisition sources.
   - Tag paid digital advertising channels (`is_campaign`) for focused ROI reporting.
4. **Automated Lead Assignment Rules**:
   - Strategy modes: `pincode_match` (preferred service area routing), `round_robin` (balanced load distribution), or `manual` triage.
   - Automated routing toggle on lead creation.
   - Fallback to round-robin if no active agent covers the lead's pincode.
   - Maximum active workload cap per field agent (default: 15 active leads).
   - Uncontacted lead reassignment threshold (e.g. 24 hours).
5. **Follow-up SLA & Reminder Preferences**:
   - Configurable alert lead times (e.g. 15 minutes, 1 hour, 24 hours before deadline).
   - Daily morning summary digest time (e.g. 09:00 AM).
   - Notification channel controls: In-App notification center, Direct Email, and WhatsApp reminders.
   - Supervisor escalation threshold for overdue tasks (default: 24 hours).

---

## 5. Security, CSV Exporting & Tamper-Resistant Audit Logs

### 5.1 Permitted CSV Exporter
- Supported export datasets:
  1. `leads`: Inbound customer records, contact info, statuses, and assigned agents.
  2. `sales_performance`: Sales representative leaderboard and conversion benchmarks.
  3. `agent_performance`: Field agent feasibility metrics, completion rates, and outcomes.
  4. `quotations`: Official proposals, system capacities (kW), totals, and statuses.
  5. `audit_logs`: Complete chronological audit trail.
- **Access Control Enforcement**:
  - `admin`: Authorized to export all 5 report types.
  - `inbound_sales`: Authorized to export `leads` (restricted to their assigned records) and personal `sales_performance`.
  - `field_agent`: Denied access to batch CSV export (returns `403 Forbidden`).
- **CSV Formula Injection Mitigation (RFC 4180)**:
  - Any spreadsheet cell starting with `=, +, -, @, \t, \r` is automatically prepended with a single quote (`'`), preventing malicious code execution in Microsoft Excel or Google Sheets.

### 5.2 Tamper-Resistant PostgreSQL Audit Trail
Recorded via PostgreSQL triggers and SECURITY DEFINER function `log_audit_event`:
- **Immutability Guarantee**: Any `UPDATE` or `DELETE` statement against `public.audit_logs` is rejected at the database engine level via `deny_audit_log_modification()` trigger.
- **Actor Attribution**: Captures user ID, full name, role, email, timestamp, IP address, user agent, action (`create`, `update`, `delete`, `export`, `assign`, `status_change`), and target entity.
- **Cryptographic Secret Redaction**:
  - All password hashes, JWTs, OAuth access/refresh tokens, API keys, and sensitive credentials in `old_values` and `new_values` are redacted to `[REDACTED]`.
  - Bank account numbers are masked showing only the last 4 digits (e.g. `••••••••1122`).
- **Audit Inspect Modal**: Interactive side-by-side JSON diff viewer for examining before/after records.

---

## 6. Monorepo Verification & Test Coverage
- Total Automated Tests: **176 Passing** (131 API + 45 Web).
- Monorepo Type Check: `tsc --noEmit` passes with 0 errors across `@solar-crm/shared`, `@solar-crm/api`, and `@solar-crm/web`.
- Production Bundles: Vite build and Node API build complete with 0 errors.
