# Solar CRM — Comprehensive Security Model & Permission Matrix

## 1. Executive Summary & Security Philosophy

The Solar CRM implements a **defense-in-depth architecture** where the database itself serves as the uncompromisable security boundary. Frontend route guards and UI state controls provide user-friendly navigation, but are **never trusted** as security controls.

### Core Security Tenets
1. **Database as the Ultimate Security Boundary**: Every table containing application data enforces PostgreSQL **Row Level Security (RLS)**. No direct query or hijacked API call can bypass tenant or role boundaries.
2. **Never Trust Client-Provided Identities**: Roles, user IDs, and organization IDs supplied in request bodies, headers, or query parameters are stripped and overwritten with cryptographically validated JWT session values.
3. **Multi-Tenant Isolation by Default**: Every query and policy is scoped to `organization_id`. Cross-organization reads and writes are prevented at the database kernel level.
4. **Zero-Privilege Role Escalation**: Self-role changes, privilege escalations, and cross-organization user migrations are blocked by PostgreSQL `SECURITY DEFINER` triggers that execute regardless of how the database is accessed.
5. **Immutable Audit Trail**: Application audit logs are append-only. Updates and deletions are rejected by database triggers and RLS policies alike. Ordinary users cannot insert forged audit records.

---

## 2. Role Definitions

| Role | Scope | Primary Responsibilities |
|---|---|---|
| **Admin** | Entire Organization | Full administrative control over company settings, bank accounts, offices, user management, audit logs, pricing components, and all leads/quotations in the organization. |
| **Inbound Sales** | Organization-wide Sales Pool | Lead ingestion (Meta Ads, Tata Solar, JustDial, etc.), qualification, assigning field agents, creating quotations, scheduling site visits, and managing customer follow-ups. |
| **Field Agent** | Assigned Work Only | Conducting technical site surveys, uploading roof photos, assessing electrical consumption, updating assigned lead notes, and viewing quotations for assigned leads. |
| **Anonymous / Public** | None | No access to protected tables. Only allowed unauthenticated health checks and password reset flows. |

---

## 3. Comprehensive Permission Matrix

The following matrix details permitted (✅) and denied (❌) operations across all 16 required tables.

| # | Table | Admin (SELECT / INSERT / UPDATE / DELETE) | Inbound Sales (SELECT / INSERT / UPDATE / DELETE) | Field Agent (SELECT / INSERT / UPDATE / DELETE) | Anonymous | Scope & Constraints |
|---|---|---|---|---|---|---|
| 1 | **organizations** | ✅ / ❌ / ✅ / ❌ | ✅ / ❌ / ❌ / ❌ | ✅ / ❌ / ❌ / ❌ | ❌ | Scoped to own `id = current_organization_id()`. Only Admin can update org metadata. |
| 2 | **profiles** | ✅ / ✅ / ✅ / ✅ | ✅ / ❌ / ✅* / ❌ | ✅ / ❌ / ✅* / ❌ | ❌ | Read all profiles in own org. Non-admins can only update own profile (`id = auth.uid()`). Role change blocked by trigger. |
| 3 | **field_agent_profiles** | ✅ / ✅ / ✅ / ✅ | ✅ / ❌ / ❌ / ❌ | ✅ / ✅* / ✅* / ❌ | ❌ | Read all agent profiles in org. Field agents can only insert/update their own profile. |
| 4 | **leads** | ✅ / ✅ / ✅ / ✅ | ✅ / ✅ / ✅ / ❌ | ✅* / ❌ / ✅* / ❌ | ❌ | Inbound sales has full org-wide sales access. Field agent has access **ONLY to assigned leads** (`assigned_field_agent_id = auth.uid()`). Only Admin can delete. |
| 5 | **lead_activities** | ✅ / ✅ / ❌ / ❌ | ✅ / ✅* / ❌ / ❌ | ✅* / ✅* / ❌ / ❌ | ❌ | Activities are append-only for sales & agents. Agent can only view/add activities for assigned leads. |
| 6 | **follow_ups** | ✅ / ✅ / ✅ / ✅ | ✅ / ✅ / ✅ / ❌ | ✅* / ✅* / ✅* / ❌ | ❌ | Agent can only see and update follow-ups where `assigned_to = auth.uid()`. Deletions reserved for Admin. |
| 7 | **site_visits** | ✅ / ✅ / ✅ / ✅ | ✅ / ✅ / ✅ / ❌ | ✅* / ✅* / ✅* / ❌ | ❌ | Inbound sales schedules visits for any agent. Field agent reads and updates only visits where `field_agent_id = auth.uid()`. |
| 8 | **notifications** | ✅* / ❌ / ✅* / ✅* | ✅* / ❌ / ✅* / ✅* | ✅* / ❌ / ✅* / ✅* | ❌ | Strictly scoped to `user_id = auth.uid()`. Direct user inserts blocked (inserted by server / triggers only). |
| 9 | **calendar_integrations**| ✅ / ✅* / ✅* / ✅* | ✅* / ✅* / ✅* / ✅* | ✅* / ✅* / ✅* / ✅* | ❌ | Scoped to `user_id = auth.uid()`. Admin has supervisory read/delete in emergency. |
| 10 | **calendar_events** | ✅ / ✅ / ✅ / ✅ | ✅ / ✅* / ✅* / ✅* | ✅* / ✅* / ✅* / ✅* | ❌ | Inbound sales and admin can view org schedule. Agents view own calendar events. |
| 11 | **quotations** | ✅ / ✅ / ✅ / ✅ | ✅ / ✅ / ✅ / ❌ | ✅* / ❌ / ❌ / ❌ | ❌ | Inbound sales can create/edit quotations. Field agents can view quotations only for their assigned leads. |
| 12 | **quotation_items** | ✅ / ✅ / ✅ / ✅ | ✅ / ✅ / ✅ / ❌ | ✅* / ❌ / ❌ / ❌ | ❌ | Inherits access rules from parent quotation. |
| 13 | **company_settings** | ✅ / ❌ / ✅ / ❌ | ✅ / ❌ / ❌ / ❌ | ✅ / ❌ / ❌ / ❌ | ❌ | All org members can read company name/logo. Only Admin can update legal, GST, PAN, tax rate. |
| 14 | **company_offices** | ✅ / ✅ / ✅ / ✅ | ✅ / ❌ / ❌ / ❌ | ✅ / ❌ / ❌ / ❌ | ❌ | Read-only for sales and field agents. Write/delete restricted to Admin. |
| 15 | **company_bank_accounts** | ✅ / ✅ / ✅ / ✅ | ✅ / ❌ / ❌ / ❌ | ✅ / ❌ / ❌ / ❌ | ❌ | Read-only for sales and field agents (for quotes). Bank account creation/editing restricted to Admin. |
| 16 | **default_quote_components**| ✅ / ✅ / ✅ / ✅ | ✅ / ❌ / ❌ / ❌ | ✅ / ❌ / ❌ / ❌ | ❌ | Standard component price library. Read-only for sales/agents. Editing reserved for Admin. |
| 17 | **audit_logs** | ✅ / ❌ / ❌ / ❌ | ❌ / ❌ / ❌ / ❌ | ❌ / ❌ / ❌ / ❌ | ❌ | Read-only for Admin. Non-admins cannot read. Direct user inserts/updates/deletes are strictly forbidden. |

*\* Note: Subject to specific ownership or assignment predicates detailed below.*

---

## 4. Key Security Controls & Implementation Details

### 4.1 Role Escalation Protection Trigger
To guarantee that a compromised client token or modified request body cannot escalate a non-admin account to an `admin`, PostgreSQL executes `enforce_profile_role_security()` on `BEFORE UPDATE ON public.profiles`:
```sql
create or replace function public.enforce_profile_role_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.role is distinct from new.role) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only administrators can modify user roles.';
    end if;

    if (auth.uid() = old.id and new.role <> 'admin') then
      raise exception 'Unauthorized: Administrators cannot change their own role.';
    end if;
  end if;

  if (old.organization_id is distinct from new.organization_id) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only administrators can modify organization membership.';
    end if;
  end if;

  return new;
end;
$$;
```

### 4.2 Multi-Tenant Data Isolation
Every table containing organization data includes `organization_id uuid not null references public.organizations(id)`.
All RLS policies evaluate `organization_id = public.current_organization_id()`. The helper function `current_organization_id()` resolves the organization solely from the authenticated `auth.uid()` record in `public.profiles`:
```sql
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;
```

### 4.3 Immutable Audit Logging
Audit logs have three layers of security:
1. **RLS Policies**:
   - `SELECT`: Only users where `public.is_admin()` is true in the same organization.
   - `INSERT`: `WITH CHECK (false)` — ordinary client tokens cannot insert arbitrary audit records.
   - `UPDATE`: `USING (false)` — updates completely disabled.
   - `DELETE`: `USING (false)` — deletes completely disabled.
2. **Database Trigger**:
   - `BEFORE UPDATE OR DELETE ON public.audit_logs`: Calls `deny_audit_log_modification()` which raises a database error.
3. **Execution Path**:
   - Audit records can only be created via the trusted `public.log_audit_event(...)` `SECURITY DEFINER` function or the server's backend service-role key.

### 4.4 Field Agent Data Partitioning
Field agents only see leads, visits, activities, and follow-ups explicitly assigned to their `user_id`:
```sql
-- Field Agent lead access
create policy "leads_agent_select"
  on public.leads for select
  using (
    organization_id = public.current_organization_id()
    and public.is_field_agent()
    and assigned_field_agent_id = auth.uid()
  );
```
Unassigned leads or leads assigned to other field agents return empty result sets with zero data leakage.

---

## 5. Threat Model & Mitigations

| Threat Vector | Potential Impact | Implemented Mitigation |
|---|---|---|
| **Client Role Spoofing** | Attacker sends `{ role: 'admin' }` in profile update payload | Database trigger rejects role change if actor is not an admin, and rejects self-elevation. |
| **Cross-Tenant ID Tampering** | Attacker in Org A passes `organization_id` of Org B | RLS rejects read/write because `organization_id` does not match `current_organization_id()`. |
| **Field Agent snooping on unassigned leads** | Agent crawls `/api/v1/leads/:id` to discover unassigned leads | RLS query returns 0 rows; API converts to 404 Not Found. |
| **Audit Log Tampering** | Malicious actor tries to cover tracks by deleting audit logs | RLS and PostgreSQL trigger prevent any `UPDATE` or `DELETE` on `audit_logs`. |
| **Service Role Credential Exposure** | Leaked Supabase service_role key allows arbitrary bypass | Kept strictly on the backend Node server in environment variables; excluded from frontend bundles. |
