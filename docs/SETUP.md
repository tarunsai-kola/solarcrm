# Solar CRM — Setup Guide

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 20.0.0 | https://nodejs.org |
| pnpm | 9.0.0 | `npm i -g pnpm` |
| Supabase CLI | 1.190.0 | `npm i -g supabase` |
| Docker Desktop | 24+ | https://docker.com (required for local Supabase) |
| Git | 2.40+ | https://git-scm.com |

## 1. Clone & Install

```bash
git clone <repo-url> solar-crm
cd solar-crm
pnpm install
```

## 2. Configure Environment Variables

```bash
# Copy both .env.example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

> ⚠️ **Never commit `.env` or `.env.local`** — they are in `.gitignore`.

## 3. Start Local Supabase

```bash
# Starts PostgreSQL, Auth, Studio, Storage in Docker
pnpm db:start
```

The CLI will print the local API URL and keys. Copy them to your `.env` files:

| Key | Where | Example value |
|---|---|---|
| `SUPABASE_URL` | `apps/api/.env` | `http://localhost:54321` |
| `SUPABASE_SERVICE_ROLE_KEY` | `apps/api/.env` | `eyJhbGci...` (service_role JWT) |
| `SUPABASE_JWT_SECRET` | `apps/api/.env` | the `JWT_SECRET` from `supabase status` |
| `VITE_SUPABASE_URL` | `apps/web/.env.local` | `http://localhost:54321` |
| `VITE_SUPABASE_ANON_KEY` | `apps/web/.env.local` | `eyJhbGci...` (anon JWT) |

## 4. Run Migrations & Seed

```bash
pnpm db:reset     # Applies all migrations + seed
```

> This runs `supabase/migrations/*.sql` in order, then `supabase/seed/seed.sql`.

## 5. Create Demo Users

After the database is ready, open Supabase Studio at http://localhost:54323:

1. Go to **Authentication → Users → Add User**
2. Create the following users:

| Email | Password | Role |
|---|---|---|
| `admin@solardemo.local` | `Admin1234!` | admin |
| `sales@solardemo.local` | `Sales1234!` | inbound_sales |
| `agent@solardemo.local` | `Agent1234!` | field_agent |

3. For each user, go to **Table Editor → profiles** and set `company_id = 00000000-0000-0000-0000-000000000001`.

## 6. Run Development Servers

```bash
# Run both API and Web concurrently
pnpm dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:3001 |
| Supabase Studio | http://localhost:54323 |
| API Health | http://localhost:3001/health |

## 7. Verify the Setup

```bash
# Type-check all packages
pnpm type-check

# Run linting
pnpm lint

# Run unit tests
pnpm test

# Run E2E tests (web dev server must be running)
pnpm test:e2e
```

## Project Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start API + Web in parallel |
| `pnpm build` | Build all packages for production |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm lint:fix` | Auto-fix ESLint issues |
| `pnpm type-check` | TypeScript check (no emit) |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm format` | Format all files with Prettier |
| `pnpm db:start` | Start local Supabase |
| `pnpm db:stop` | Stop local Supabase |
| `pnpm db:reset` | Reset DB + re-run migrations + seed |

## Production Deployment

> ⚠️ Production deployment is not configured in this phase.

For production, you will need:
1. A hosted Supabase project (https://supabase.com)
2. A Node.js hosting provider for the API (Railway, Render, Fly.io, etc.)
3. A static hosting provider for the web app (Vercel, Netlify, etc.)
4. Update all environment variables to production values

## Troubleshooting

**`supabase start` fails** — Ensure Docker Desktop is running.

**`pnpm install` fails** — Ensure you are using pnpm 9+ and Node 20+.

**API returns 401** — Check that your JWT matches between web `.env.local` and API `.env`.

**Profiles not loading** — Make sure you set `company_id` in the profiles table for each demo user.
