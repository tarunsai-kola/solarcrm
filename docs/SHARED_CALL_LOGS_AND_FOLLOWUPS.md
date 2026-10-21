# Shared Call Logs & Follow-up Management

## Overview
This document specifies the architecture, data models, business rules, auditable history system, and follow-up management lifecycle implemented for the Solar CRM.

---

## 1. Database Schema & Migration

Database Migration: [20240101000006_lead_activities_followups_enhancement.sql](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/supabase/migrations/20240101000006_lead_activities_followups_enhancement.sql)

### 1.1 `lead_activities` Enhancements
- **Activity Types**: `outgoing_call`, `incoming_call`, `call`, `whatsapp`, `email`, `site_visit`, `meeting`, `note`, `status_change`, `assignment`, `site_visit_scheduled`, `quotation_sent`, `amendment`, `other`.
- **Duration**: `duration_seconds INT NULL` (tracks interaction duration in seconds/minutes).
- **Attachments**: `attachment_url TEXT NULL`, `attachment_name VARCHAR(255) NULL`.
- **Relational Links**: `follow_up_id UUID REFERENCES follow_ups(id)`, `site_visit_id UUID`, `quotation_id UUID`.
- **Auditable Amendments**:
  - `is_amendment BOOLEAN DEFAULT false`
  - `amends_activity_id UUID REFERENCES lead_activities(id)`
  - `amendment_reason TEXT NULL`

### 1.2 `follow_ups` Enhancements
- `rescheduled_count INT NOT NULL DEFAULT 0`
- `last_rescheduled_at TIMESTAMPTZ NULL`
- `reschedule_reason TEXT NULL`
- `reminder_status`: `pending`, `sent`, `dismissed`, `failed`. Resets to `'pending'` on every reschedule to guarantee timely delivery and deduplicate past notifications.

---

## 2. Auditable History & Append-Only Architecture

To prevent silent record alterations or compliance violations between Inbound Sales and Field Agents:
1. **Append-Only Policy**: Normal CRM users cannot modify or delete past `lead_activities` records.
2. **Amendment Flow**: Mistakes or corrections (e.g., miscommunicated rooftop area or kW size) are handled through the `POST /leads/:id/activities/:activityId/amend` endpoint.
3. **Traceability**: An amendment row is inserted with `is_amendment: true`, linking directly to `amends_activity_id` and recording the mandatory `amendment_reason`. The original record remains unchanged.

---

## 3. Communication Form (Add Call Log)

The [AddCallLogModal.tsx](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/features/leads/components/AddCallLogModal.tsx) provides a rich communication form:
- **Activity Type**: Visual pills for Outgoing Call, Incoming Call, WhatsApp, Email, Site Visit, Meeting, Other.
- **Call Outcome**: Connected, No Answer, Busy, Call Back Requested, Interested, Not Interested, Wrong Number, Site Visit Required, Other.
- **Lead Temperature**: Hot, Warm, Cold (syncs with `leads.temperature`).
- **Duration & Attachments**: Optional minutes and document/rooftop photo URL.
- **Follow-up Sub-form**: Toggle for "Schedule Next Follow-up" with `datetime-local` picker and active assignee dropdown (restricted to active organization users).
- **Atomicity**: The API endpoint `POST /leads/:id/call-logs` updates the lead temperature, inserts the activity log, schedules the follow-up, synchronizes `leads.next_follow_up_at`, and records an audit log atomically.

---

## 4. Shared History Timeline

The [ActivityTimeline.tsx](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/features/leads/components/ActivityTimeline.tsx) provides a shared timeline accessible by Inbound Sales, Field Agents, and Admins:
- **Author & Role Badges**: Name with role pill (Admin, Inbound Sales, Field Agent).
- **Type & Outcome**: Styled badges using `CALL_OUTCOME_CONFIG` color palettes.
- **Timezone Standardization**: Persisted as UTC `timestamptz`, formatted using `formatDateTime(date, { timeZone: 'Asia/Kolkata' })`.
- **Duration**: Rendered as `Xm Ys` or `X min`.
- **Linked Context**: Clickable badges for scheduled follow-up deadlines, attachments, site visits, and quotations.
- **Amendment Callouts**: Prominent amber card highlighting corrections with the recorded reason.
- **Amend Action**: Dedicated button opening [AmendActivityModal.tsx](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/features/leads/components/AmendActivityModal.tsx).

---

## 5. Follow-ups Management Board

The [FollowUpsPage.tsx](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/features/followups/pages/FollowUpsPage.tsx) accessible at `/follow-ups`:
- **Categorized Tabs with Live Counts**:
  - `Overdue` (count badge in red)
  - `Due Today` (count badge in amber)
  - `Upcoming` (count badge in blue)
  - `Completed` (count badge in emerald)
  - `Cancelled` (count badge in slate)
- **Multi-parameter Filters**: Search by customer/phone/notes, filter by assigned owner, lead temperature (`hot`, `warm`, `cold`), and date ranges.
- **Quick Actions on Follow-up Cards**:
  - `Open Lead`: Launches `LeadDetailDrawer` for full customer context.
  - `Log Call`: Opens `AddCallLogModal` pre-populated for this lead.
  - `Reschedule`: Opens [RescheduleFollowUpModal.tsx](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/features/followups/components/RescheduleFollowUpModal.tsx).
  - `Complete`: Opens [CompleteFollowUpModal.tsx](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/features/followups/components/CompleteFollowUpModal.tsx).
  - `Cancel`: Interactive confirmation marking follow-up as cancelled and appending reason to lead history.

---

## 6. Timezone Policy
- **Database & API**: All database fields (`due_at`, `occurred_at`, `completed_at`, `next_follow_up_at`) are stored as UTC `timestamptz`.
- **Frontend Presentation**: Standardized through `formatDate` and `formatDateTime` in [utils.ts](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/web/src/lib/utils.ts) with configurable timezone defaulting to `Asia/Kolkata` (IST, UTC+05:30).

---

## 7. Testing & Verification

Integration test suite: [followups-integration.test.ts](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/tests/followups-integration.test.ts)
- Call log validation and atomicity: 4 tests
- Auditable amendment flow: 1 test
- Follow-up lifecycle (reschedule, complete, cancel, reminder deduplication): 3 tests
- Tab counts and role-scoped permissions for Field Agents vs Sales/Admin: 2 tests
- Total test count: 78 API unit & integration tests + 19 Web tests (97 total, 100% passing).
