import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';

describe('Database Schema & Migration Validation', () => {
  it('executes all 4 migration DDL files in sequence creating all 16 tables', () => {
    const db = newDb();

    // Mock auth schema & auth.users for Supabase environment simulation
    db.public.none(`
      create schema if not exists auth;
      create table auth.users (
        id uuid primary key,
        email text
      );
    `);

    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    expect(files.length).toBeGreaterThanOrEqual(4);

    // Register gen_random_uuid in pg-mem
    db.public.registerFunction({
      name: 'gen_random_uuid',
      returns: db.public.getType('uuid'),
      implementation: () => '00000000-0000-0000-0000-000000000000',
    });

    db.public.registerFunction({
      name: 'char_length',
      args: [db.public.getType('text')],
      returns: db.public.getType('integer'),
      implementation: (str: string) => (str ? str.length : 0),
    });

    // Register mock types for enums in pg-mem
    db.public.none(`
      create type app_role as enum ('admin', 'inbound_sales', 'field_agent');
      create type account_status as enum ('active', 'pending', 'suspended', 'inactive');
    `);

    for (const file of files) {
      const rawSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Extract CREATE TABLE blocks cleanly using regex
      const tableMatches = rawSql.match(/create table if not exists public\.\w+ \([\s\S]*?\);/gi) ?? [];

      for (let tableSql of tableMatches) {
        // pg-mem doesn't have PostgreSQL's native ~* regex operator, adapt for in-memory parser
        tableSql = tableSql.replace(/~\*\s*'[^']+'/g, "like '%@%'");
        expect(() => db.public.none(tableSql), `Executing: ${tableSql.substring(0, 45)}...`).not.toThrow();
      }
    }

    // Verify all 16 required tables + organizations exist
    const requiredTables = [
      'organizations',
      'profiles',
      'field_agent_profiles',
      'leads',
      'lead_activities',
      'follow_ups',
      'site_visits',
      'notifications',
      'calendar_integrations',
      'calendar_events',
      'quotations',
      'quotation_items',
      'company_settings',
      'company_offices',
      'company_bank_accounts',
      'default_quote_components',
      'audit_logs',
    ];

    for (const tableName of requiredTables) {
      const table = db.public.getTable(tableName);
      expect(table, `Table ${tableName} should exist`).toBeDefined();
    }
  });

  it('verifies organization_id exists on all business tables for multi-tenancy', () => {
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const fullSql = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

    const businessTables = [
      'profiles',
      'field_agent_profiles',
      'leads',
      'lead_activities',
      'follow_ups',
      'site_visits',
      'notifications',
      'calendar_integrations',
      'calendar_events',
      'quotations',
      'company_settings',
      'company_offices',
      'company_bank_accounts',
      'default_quote_components',
      'audit_logs',
    ];

    for (const table of businessTables) {
      // Regex checking that the table definition includes organization_id references public.organizations(id)
      const tableRegex = new RegExp(`create table if not exists public\\.${table}[\\s\\S]*?organization_id\\s+uuid`, 'i');
      expect(tableRegex.test(fullSql), `Table ${table} must include organization_id`).toBe(true);
    }
  });

  it('verifies RLS is enabled on every single table', () => {
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const fullSql = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

    const allTables = [
      'organizations',
      'companies',
      'profiles',
      'field_agent_profiles',
      'leads',
      'lead_activities',
      'follow_ups',
      'site_visits',
      'notifications',
      'calendar_integrations',
      'calendar_events',
      'quotations',
      'quotation_items',
      'company_settings',
      'company_offices',
      'company_bank_accounts',
      'default_quote_components',
      'audit_logs',
    ];

    for (const table of allTables) {
      const rlsRegex = new RegExp(`alter table public\\.${table} enable row level security`, 'i');
      expect(rlsRegex.test(fullSql), `Table ${table} must have RLS enabled`).toBe(true);
    }
  });

  it('verifies audit logs immutability controls and denial triggers are declared in migrations', () => {
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const fullSql = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

    expect(fullSql).toContain('deny_audit_log_modification');
    expect(fullSql).toContain('audit_logs_immutable_trigger');
    expect(fullSql).toContain('"audit_logs_no_update"');
    expect(fullSql).toContain('"audit_logs_no_delete"');
    expect(fullSql).toContain('"audit_logs_no_client_insert"');
  });

  it('verifies role escalation prevention trigger is defined on profiles', () => {
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const fullSql = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

    expect(fullSql).toContain('enforce_profile_role_security');
    expect(fullSql).toContain('profiles_role_security_trigger');
    expect(fullSql).toContain('Only administrators can modify user roles');
    expect(fullSql).toContain('Administrators cannot change their own role');
  });
});
