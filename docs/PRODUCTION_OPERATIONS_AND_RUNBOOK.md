# Production Operations, Security & Reliability Runbook

This document details the production architecture, security controls, disaster recovery procedures, database backup/restore runbooks, migration rollbacks, and indexing strategies for the Solar CRM.

---

## 1. Security Architecture & Audit

### 1.1 Authentication & Multi-Tenant Scoping
- **Token Verification**: Every non-public API endpoint enforces `requireAuth` ([`auth.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/middleware/auth.ts)). The Supabase JWT is verified server-side, resolving the caller's active user ID, email, verified role, and tenant `organization_id`.
- **Tenant Isolation**: All database queries parameterize `eq('organization_id', req.auth.organizationId)`. No tenant can query, update, or delete data belonging to another organization.
- **Role-Based Access Control (RBAC)**: Endpoint-level guards (`requireRole(['admin'])`, `requireRole(['admin', 'inbound_sales'])`) prevent privilege escalation.

### 1.2 Defense Against Common Vulnerabilities
| Risk Area | Mitigation Implementation |
|---|---|
| **SQL Injection** | Supabase PostgREST client with parameterized statements only. Zero string-concatenated queries. |
| **Mass Assignment** | Zod input schemas explicitly `.omit({ id: true, organization_id: true, created_at: true })`. Unrecognized keys are stripped. |
| **Duplicate Submissions & Race Conditions** | Scoped `idempotencyMiddleware` ([`idempotency.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/middleware/idempotency.ts)) caches mutating results by key (`${orgId}:${userId}:${method}:${path}:${key}`). Concurrent requests return `409 CONCURRENT_REQUEST`. |
| **Brute Force & DoS** | `express-rate-limit` enforces rate limiting (100 req/min per IP by default). `helmet` sets secure HTTP headers (CSP, HSTS, X-Content-Type-Options, Frameguard). |
| **CORS Policy** | Restrictive CORS configuration allows only configured frontend origin (`CORS_ORIGIN`). Exposed headers strictly defined. |
| **Secret Management** | All credentials (database keys, JWT secrets, OAuth client credentials, encryption keys) are loaded strictly via environment variables validated on startup by Zod in [`env.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/config/env.ts). |

---

## 2. Reliability & Resilience Architecture

### 2.1 Centralized Error Handling & Structured Correlation
- **Request Correlation ID**: An `X-Request-ID` is assigned or extracted at the gateway and attached to both request and response headers ([`app.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/app.ts)).
- **Structured JSON Logging**: Pino logs every request, error, and background task execution with `requestId`, `userId`, and `tenantId`.
- **API Error Hierarchy**: All errors inherit from `AppError` ([`errorHandler.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/middleware/errorHandler.ts)) ensuring consistent `{ success: false, error: { code, message, details } }` payloads with zero leaked stack traces in production.

### 2.2 Transient Error Retries
- External integrations (Google Calendar API, SMTP mailers, WhatsApp webhooks) utilize `withRetry` ([`retry.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/lib/retry.ts)) featuring:
  - Exponential backoff with configurable factor.
  - Jitter (+/- 20%) to avoid synchronized stampedes.
  - Retry filter recognizing HTTP 429, 500, 502, 503, 504, `ECONNRESET`, and `ETIMEDOUT`.

### 2.3 OAuth Token Revocation Handling
- If Google returns `invalid_grant` or 401 during token refresh:
  1. Integration `sync_status` is marked as `'error'`.
  2. The failure is logged in `last_sync_error`.
  3. A high-priority in-app notification is automatically dispatched to the user prompting reconnection.
  4. Calendar operations fail gracefully without crashing the server.

### 2.4 Health Probes
| Endpoint | Method | Purpose | Response |
|---|---|---|---|
| `/health` | `GET` | Shallow load balancer ping | `200 { status: 'ok' }` |
| `/health/live` | `GET` | Container liveness check | `200 { status: 'alive', uptime: 123.4 }` |
| `/health/ready` | `GET` | Kubernetes readiness probe (tests DB connectivity) | `200 { status: 'ready', database: 'connected' }` or `503 { status: 'unready', database: 'disconnected' }` |

---

## 3. In-App Notifications Engine

### 3.1 Event Triggers
Real-time, persistent in-app notifications ([`notification-service.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/services/notification-service.ts)) are dispatched for:
- **Lead Assignment & Reassignment**: Sent immediately to the newly assigned field agent and previous agent.
- **Follow-up Reminders**: Sent when a follow-up is due, due today, or overdue.
- **Site Visit Changes**: Sent when a visit is scheduled, rescheduled, completed, or cancelled.
- **Shared Timeline Activities**: When an inbound sales rep or field agent logs a call, note, or WhatsApp message on a multi-assigned lead, the other assigned user is notified.
- **Quotation Status Changes**: Dispatched when a quotation is issued, sent, accepted, or rejected.

### 3.2 Scheduled Worker Status Integrity
- The CRM truthfully reports reminder worker state via `GET /api/v1/integrations/reminders/status` ([`reminder-scheduler.ts`](file:///c:/Users/tarun/OneDrive/Desktop/SAM/solar-crm/apps/api/src/services/reminder-scheduler.ts)).
- If no background daemon is active, it returns `worker_status: 'inactive'` and `mode: 'manual_only'`, preventing misleading claims.

---

## 4. Database Backup, Restore Testing & DR

### 4.1 Backup Strategy
1. **Automated Point-in-Time Recovery (PITR)**: Continuous Write-Ahead Log (WAL) archiving allows restoring to any second within the retention window (7-30 days).
2. **Scheduled Logical Dumps**: Nightly logical backups executed via `pg_dump`:
   ```bash
   pg_dump --clean --if-exists --no-owner --no-privileges \
     --format=custom --file="solar_crm_backup_$(date +%Y%m%d_%H%M%S).dump" \
     "$DATABASE_URL"
   ```
3. **Encrypted Storage**: Backup artifacts are stored in an off-site, immutable S3 bucket with Object Lock and AES-256 server-side encryption.

### 4.2 Quarterly Restore Verification Runbook
To verify disaster recovery readiness without impacting production:
1. Spin up an isolated staging database container:
   ```bash
   docker run --name pg-restore-test -e POSTGRES_PASSWORD=test_secret -p 5439:5432 -d postgres:15
   ```
2. Restore the latest backup dump:
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges \
     -h localhost -p 5439 -U postgres -d postgres solar_crm_backup_latest.dump
   ```
3. Run automated data integrity checks:
   ```sql
   -- Verify tenant row count parity
   SELECT count(*) FROM public.organizations;
   SELECT count(*) FROM public.leads;
   SELECT count(*) FROM public.quotations;
   SELECT count(*) FROM public.site_visits;
   -- Check foreign key referential integrity
   SELECT count(*) FROM public.leads WHERE organization_id NOT IN (SELECT id FROM public.organizations);
   ```
4. Verify application boots successfully against the restored test instance.
5. Record restore test metrics: Target RTO <= 60 minutes, RPO <= 15 minutes.

---

## 5. Database Migrations & Rollback Procedures

### 5.1 Migration Execution Guidelines
- Migrations must follow the **Expand-Contract Pattern**:
  - Never drop or rename columns in use by the running API version.
  - Phase 1: Add new nullable columns or tables.
  - Phase 2: Deploy code writing to new structures.
  - Phase 3: Backfill historical data.
  - Phase 4: Deprecate and remove old structures in a subsequent migration.

### 5.2 Rollback Runbook Matrix

| Migration | Forward Action | Rollback SQL Script |
|---|---|---|
| `20240101000001` | Core tables & profiles | `DROP TABLE IF EXISTS public.profiles, public.organizations CASCADE;` |
| `20240101000002` | Leads, activities, site visits | `DROP TABLE IF EXISTS public.site_visits, public.follow_ups, public.lead_activities, public.leads CASCADE;` |
| `20240101000003` | Quotations & Calendar events | `DROP TABLE IF EXISTS public.calendar_events, public.calendar_integrations, public.quotation_items, public.quotations CASCADE;` |
| `20240101000004` | Company settings & Notifications | `DROP TABLE IF EXISTS public.notifications, public.audit_logs, public.company_bank_accounts, public.company_offices, public.company_settings CASCADE;` |
| `20240101000005` | Expand lead statuses | `ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;` (restore prior constraint) |
| `20240101000006` | Call logs & amendments | `ALTER TABLE public.lead_activities DROP COLUMN IF EXISTS amends_activity_id, DROP COLUMN IF EXISTS duration_seconds;` |
| `20240101000007` | Meet link & email logs | `ALTER TABLE public.calendar_events DROP COLUMN IF EXISTS meet_link;` |
| `20240101000008` | Quotation versioning & defaults | `DROP TABLE IF EXISTS public.default_quote_components; ALTER TABLE public.quotations DROP COLUMN IF EXISTS company_snapshot;` |
| `20240101000009` | CRM lead source & loss reasons | `DROP TABLE IF EXISTS public.crm_loss_reasons, public.crm_lead_sources;` |

---

## 6. Indexing Strategy & Safe Pagination

### 6.1 Performance Indexes
The database schema includes dedicated indexes for all high-frequency filter, join, and sort predicates:
- `leads_org_idx`: `(organization_id, status)` for fast pipeline filtering.
- `leads_pincode_idx`: `(pincode)` for instant field-agent proximity queries.
- `leads_assigned_agent_idx`: `(assigned_field_agent_id)` for agent workload reporting.
- `site_visits_agent_idx`: `(field_agent_id, scheduled_at)` for agent calendar views.
- `notifications_user_idx`: `(user_id, organization_id, is_read)` for instant badge count lookups.
- `quotations_lead_idx`: `(lead_id, version)` for instant version history retrieval.

### 6.2 Safe Pagination Contract
All collection endpoints (`/leads`, `/quotations`, `/notifications`, `/audit`) enforce:
- Maximum `pageSize` of 100 items (defaulting to 15-20).
- Explicit `range(offset, offset + size - 1)` avoiding `OFFSET` performance traps.
- Ordered by indexed timestamp (`created_at DESC`) to ensure deterministic page stability.

---

## 7. Operational Risk Assessment

| Risk | Likelihood | Impact | Built-in Mitigation |
|---|---|---|---|
| **Google API Outage** | Low | Medium | Circuit breaker via `withRetry`; local calendar event remains confirmed; error logged with correlation ID. |
| **Worker Process Crash** | Low | Low | API checks state dynamically; `GET /integrations/reminders/status` accurately reports inactivity. |
| **High Concurrency Edit Collision** | Medium | Medium | `Idempotency-Key` prevents double-creation; version increments on revisions preserve audit trail. |
| **Cross-Tenant Data Exposure** | Rare | High | Strict RLS policies + application-level query scoping by `organization_id` on every query. Verified by automated tests. |
