# Solar CRM — Architecture

## Overview

Solar CRM is a multi-user, role-based CRM system for solar installation businesses. It uses a monorepo structure with a React frontend, Express API, Supabase PostgreSQL database, and a shared types/schemas package.

```
solar-crm/
├── apps/
│   ├── web/          # Vite + React + TypeScript frontend (port 5173)
│   └── api/          # Express + TypeScript REST API (port 3001)
├── packages/
│   └── shared/       # Shared Zod schemas, TypeScript types, constants
├── supabase/
│   ├── migrations/   # PostgreSQL migrations (run in order)
│   └── seed/         # Local development seed data
└── docs/             # Architecture, setup, API documentation
```

## Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Monorepo | pnpm workspaces | Zero-config, fast installs, workspace:* protocol |
| Frontend | React 18 + Vite | Fast HMR, excellent TypeScript support |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix primitives) | Accessible, unstyled primitives + utility CSS |
| State | TanStack Query | Server state caching, background refetching |
| Forms | React Hook Form + Zod | Performant forms with type-safe validation |
| Routing | React Router v6 | Industry standard, excellent TS support |
| API | Express.js | Lightweight, composable, well-understood |
| Validation | Zod | Single source of truth for types + runtime validation |
| Database | Supabase PostgreSQL | RLS security model, realtime, managed auth |
| Auth | Supabase Auth | JWT-based, PKCE, social auth ready |
| Logger | Pino | Fastest Node.js JSON logger |
| Testing | Vitest + Playwright | Fast unit tests, reliable E2E |

## Security Architecture

### Authentication Flow
1. User submits credentials to Supabase Auth directly from browser
2. Supabase returns a signed JWT (access_token + refresh_token)
3. Browser stores session in localStorage (auto-managed by Supabase client)
4. Every API request attaches the JWT via `Authorization: Bearer <token>`
5. API verifies JWT with `supabase.auth.getUser(token)` — no secret shared with client
6. API fetches role + company_id from `profiles` table for authorization

### Key Security Rules
- **Never** put `SUPABASE_SERVICE_ROLE_KEY` in frontend environment variables
- **Never** put `SUPABASE_JWT_SECRET` in frontend environment variables
- Only `VITE_SUPABASE_ANON_KEY` goes to the browser — RLS policies protect all data
- Every database table has Row-Level Security (RLS) enabled
- All inter-company data isolation is enforced at the database level via RLS

### Role-Based Access Control
```
admin          → all features + user management + audit logs + company settings
inbound_sales  → dashboard, leads, follow-ups, calendar, quotations, customers, reports
field_agent    → dashboard, leads, follow-ups, calendar, quotations
```

## Database Schema

### Core Tables
- `companies` — tenant root (multi-tenant per company)
- `profiles` — extends `auth.users`, one per user, holds role + company_id
- `leads` — potential customers in the pipeline
- `customers` — converted leads with installation records
- `follow_ups` — scheduled activities against leads
- `quotations` — priced proposals for leads/customers
- `notifications` — per-user notification feed
- `audit_logs` — immutable audit trail (admin read-only)

### Row-Level Security Strategy
Every table uses RLS policies that:
1. Scope reads to `company_id = current_company_id()`
2. Restrict writes by `current_role()` where required
3. Make audit_logs immutable (no UPDATE/DELETE policies)

## API Design

Base path: `/api/v1`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | /leads | List with filters + pagination | All |
| POST | /leads | Create lead | admin, inbound_sales |
| GET | /leads/:id | Get lead + follow-ups | All |
| PATCH | /leads/:id | Update lead | All |
| DELETE | /leads/:id | Delete lead | admin |
| GET | /users | List company users | All |
| GET | /users/me | Current user profile | All |
| PATCH | /users/:id | Update user | admin, self |
| GET | /settings | Company settings | All |
| PATCH | /settings | Update settings | admin |
| GET | /audit | Audit log list | admin |

⚠️ **Unfinished integrations** (to be added in subsequent prompts):
- `/follow-ups` CRUD
- `/customers` CRUD
- `/quotations` CRUD
- `/notifications` endpoints
- `/reports/summary` KPI aggregate endpoint
- `/calendar` availability endpoints

## Data Flow

```
Browser
  │  (VITE_SUPABASE_ANON_KEY)
  ├─→ Supabase Auth → JWT
  │
  └─→ API (Bearer JWT)
        ├─→ requireAuth middleware → supabase.auth.getUser()
        ├─→ profiles table → role + company_id
        └─→ Supabase DB (service_role, RLS bypassed in trusted code)
```

## Folder Conventions

### Web (`apps/web/src`)
```
contexts/         # React contexts (Auth, etc.)
components/
  ui/             # Base design-system components
  layout/         # AppLayout, AuthLayout, Sidebar, Header
  auth/           # RoleGuard, etc.
features/
  auth/           # Login, ForgotPassword
    pages/
    hooks/
    components/
  dashboard/
  leads/
  customers/
  quotations/
  follow-ups/
  reports/
  notifications/
  user-management/
hooks/            # Shared hooks (use-toast, etc.)
lib/              # supabase.ts, api-client.ts, utils.ts
```

### API (`apps/api/src`)
```
config/     # env.ts
lib/        # supabase.ts (admin), logger.ts
middleware/ # auth.ts, validate.ts, errorHandler.ts
routes/     # leads.ts, users.ts, audit.ts, ...
services/   # Business logic (to be added)
```
