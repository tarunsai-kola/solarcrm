# Solar CRM — Authentication & Role-Based Access Control Architecture

## 1. Overview & Core Security Principles

Solar CRM enforces an end-to-end trusted authentication and authorization architecture combining:
1. **Supabase Auth** as the trusted identity provider (issuing cryptographically signed JWTs).
2. **Authoritative PostgreSQL Profiles**: The database (`public.profiles`) is the single source of truth for user roles, organization boundaries, and account status.
3. **Role-Specific Login Portals**: Custom branded entry routes for each role that validate credentials, confirm account active status, verify that the portal matches the database role, and deny mismatched access.
4. **Zero-Trust Backend**: The frontend entry route **never** determines or grants roles. All role checks and privilege boundaries are enforced by PostgreSQL RLS triggers and Node.js Express middleware.
5. **Admin User Management**: Admin-only user creation executed entirely server-side via Supabase Admin API (`service_role` key never exposed to client).

---

## 2. Branded Login Portals & Route Protection

### Entry Routes
| Portal Route | Allowed Role | Title | Description |
|---|---|---|---|
| `/admin-login` | `admin` | Executive Admin Portal | Organization settings, user access control, audit trail |
| `/inbound-sales-login` | `inbound_sales` | Inbound Sales Portal | Lead qualification, assignment, follow-up tracking |
| `/field-agent-login` | `field_agent` | Field Agent Portal | On-site inspections, feasibility measurements, customer visits |
| `/login` | Hub | Portal Selector | Central hub routing users to their assigned portal |

### Authentication & Authorization Flow
```
Client submits credentials at /<role>-login
                   │
                   ▼
  Supabase Auth authenticate (signInWithPassword)
                   │
                   ├─ Invalid credentials ──► Error displayed, rate limited
                   │
                   ▼
  Query public.profiles (by auth.uid())
                   │
                   ├─ Profile not found ──► signOut() & 403 error
                   │
                   ▼
  Verify account_status == 'active' && is_active == true
                   │
                   ├─ Inactive/Suspended ──► signOut() & throw AccountInactiveError
                   │
                   ▼
  Compare profile.role === portalRole
                   │
                   ├─ MISMATCH ───────────► signOut(), throw PortalMismatchError,
                   │                        show rejection banner with 1-click
                   │                        redirect to correct portal
                   ▼
  Match confirmed ──► Set active session, navigate to /dashboard
```

---

## 3. Admin User Management

Only users with `role: 'admin'` and `account_status: 'active'` can create, edit, deactivate, or reset accounts.

### Inbound Sales Creation (`POST /api/v1/users/inbound-sales`)
- **Required Fields**: `full_name`, `email`, `phone`
- **Optional**: `password` (auto-generates strong password if omitted), `send_invite` (generates Supabase recovery/setup link)
- **Role Assignment**: Server forcefully sets `role: 'inbound_sales'`. Client-supplied role overrides are rejected.
- **Audit**: Logged automatically via `log_audit_event`.

### Field Agent Creation (`POST /api/v1/users/field-agent`)
- **Required Fields**: `full_name`, `email`, `phone`, `address`, `pincode`
- **Field Agent Details**:
  - `service_areas`: Array of serviced geographic areas / neighborhoods
  - `service_pincodes`: Array of 6-digit postal codes
  - `max_active_leads`: Active lead quota limit (default: 15)
  - `availability`: Availability status (`available`, `busy`, `on_leave`)
  - `experience_years`: Relevant solar experience in years
- **Role Assignment**: Server forcefully sets `role: 'field_agent'`. Creates records in both `profiles` and `field_agent_profiles`.
- **Audit**: Logged automatically via `log_audit_event`.

### User Activation & Deactivation (`POST /api/v1/users/:id/status`)
- **Self-Deactivation Protection**: An administrator cannot deactivate their own account (`400 CANNOT_DEACTIVATE_SELF`).
- **Immediate Session Invalidation**: When an account is set to `suspended` or `inactive`, the backend calls `supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' })`, instantly revoking existing JWT access across all devices.

### Secure Password Reset / Setup Links (`POST /api/v1/users/:id/reset-password`)
- Admin generates a cryptographic password setup/recovery link via Supabase Admin API without exposing secrets.
- UI provides a copy-to-clipboard modal for secure handoff.

---

## 4. API Security & Rate Limiting

1. **User Creation Rate Limiter**: 50 account creations per 15-minute window per IP.
2. **Login Rate Limiting**: Client displays cooldown timer on repeated failures.
3. **Data Sanitization & Validation**: Every request is parsed and coerced through Zod schemas before reaching business logic.
4. **Sensitive Data Redaction**: Passwords, tokens, and authorization headers are scrubbed from all server logs (`pino-http`).

---

## 5. Automated Test Coverage

The system includes 54 automated integration and unit tests:

1. **`apps/api/tests/auth-integration.test.ts` (15 tests)**:
   - Unauthenticated access blocked (401)
   - Non-admin user creation attempts blocked (403)
   - Inactive/suspended user API requests rejected (403 `ACCOUNT_INACTIVE`)
   - Zod validation for Inbound Sales & Field Agent creation (422)
   - Admin authorized Inbound Sales creation with invite link
   - Admin authorized Field Agent creation with service areas and capacity
   - Admin self-deactivation prevention (`CANNOT_DEACTIVATE_SELF`)
   - Session invalidation on user suspension (`ban_duration`)
   - Secure recovery link generation restricted to Admin

2. **`apps/web/tests/unit/auth-portal.test.ts` (10 tests)**:
   - Role authentication at `/admin-login`, `/inbound-sales-login`, `/field-agent-login`
   - Rejection and session termination on portal mismatch
   - Rejection and session termination for inactive/suspended accounts
   - Verification that portal route cannot elevate user role
