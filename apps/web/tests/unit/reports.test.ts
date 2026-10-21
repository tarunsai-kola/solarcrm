import { describe, expect, it } from 'vitest';

// ── KPI Formulas & Data Logic Verification for Admin Analytics & Controls
describe('Admin Analytics, KPI Formulas & Security Logic', () => {
  describe('Average Time to First Contact Calculation', () => {
    it('accurately computes average hours from lead creation to earliest activity', () => {
      const now = new Date('2026-10-20T12:00:00Z').getTime();

      const leads = [
        { id: 'l1', created_at: new Date(now - 10 * 3600 * 1000).toISOString() }, // 10h ago
        { id: 'l2', created_at: new Date(now - 6 * 3600 * 1000).toISOString() },  // 6h ago
        { id: 'l3', created_at: new Date(now - 2 * 3600 * 1000).toISOString() },  // 2h ago (not contacted)
      ];

      const activities = [
        // For l1, first activity was 8h ago (diff = 2h)
        { lead_id: 'l1', created_at: new Date(now - 8 * 3600 * 1000).toISOString() },
        { lead_id: 'l1', created_at: new Date(now - 4 * 3600 * 1000).toISOString() },
        // For l2, first activity was 3h ago (diff = 3h)
        { lead_id: 'l2', created_at: new Date(now - 3 * 3600 * 1000).toISOString() },
      ];

      let totalDiffHours = 0;
      let contactedCount = 0;

      for (const lead of leads) {
        const leadActs = activities.filter((a) => a.lead_id === lead.id);
        if (leadActs.length > 0) {
          const earliestActTime = Math.min(
            ...leadActs.map((a) => new Date(a.created_at).getTime()),
          );
          const leadCreated = new Date(lead.created_at).getTime();
          const diffHours = (earliestActTime - leadCreated) / (1000 * 60 * 60);
          totalDiffHours += Math.max(0, diffHours);
          contactedCount += 1;
        }
      }

      const avgHours = contactedCount > 0 ? Number((totalDiffHours / contactedCount).toFixed(1)) : null;

      // l1 diff = 2.0h, l2 diff = 3.0h => avg = 2.5h
      expect(contactedCount).toBe(2);
      expect(avgHours).toBe(2.5);
    });

    it('returns null when no leads have been contacted yet', () => {
      const leads = [
        { id: 'l1', created_at: new Date().toISOString() },
      ];
      const activities: any[] = [];

      let totalDiffHours = 0;
      let contactedCount = 0;
      for (const lead of leads) {
        const leadActs = activities.filter((a) => a.lead_id === lead.id);
        if (leadActs.length > 0) {
          contactedCount += 1;
        }
      }
      const avg = contactedCount > 0 ? totalDiffHours / contactedCount : null;
      expect(avg).toBeNull();
    });
  });

  describe('Follow-up SLA Compliance Formula', () => {
    it('calculates on-time SLA compliance rate correctly', () => {
      const now = new Date('2026-10-20T10:00:00Z').getTime();

      const followUps = [
        // Completed on time (completed 1h before deadline)
        {
          id: 'f1',
          due_at: new Date(now).toISOString(),
          completed_at: new Date(now - 3600 * 1000).toISOString(),
          completion_status: 'completed',
        },
        // Completed on time (completed exactly on deadline)
        {
          id: 'f2',
          due_at: new Date(now).toISOString(),
          completed_at: new Date(now).toISOString(),
          completion_status: 'completed',
        },
        // Completed late (completed 2h after deadline)
        {
          id: 'f3',
          due_at: new Date(now).toISOString(),
          completed_at: new Date(now + 2 * 3600 * 1000).toISOString(),
          completion_status: 'completed',
        },
      ];

      const completed = followUps.filter((f) => f.completion_status === 'completed');
      const onTime = completed.filter(
        (f) => new Date(f.completed_at).getTime() <= new Date(f.due_at).getTime(),
      );

      const slaRate = completed.length > 0 ? Number(((onTime.length / completed.length) * 100).toFixed(1)) : 100;

      // 2 on-time out of 3 = 66.7%
      expect(slaRate).toBe(66.7);
    });

    it('computes average delay for overdue unfinished tasks', () => {
      const now = new Date('2026-10-20T12:00:00Z').getTime();

      const overdueTasks = [
        // Overdue by 4 hours
        { due_at: new Date(now - 4 * 3600 * 1000).toISOString(), completion_status: 'pending' },
        // Overdue by 6 hours
        { due_at: new Date(now - 6 * 3600 * 1000).toISOString(), completion_status: 'pending' },
      ];

      let sumDelay = 0;
      for (const t of overdueTasks) {
        const delay = (now - new Date(t.due_at).getTime()) / (1000 * 3600);
        sumDelay += delay;
      }
      const avgDelay = overdueTasks.length > 0 ? Number((sumDelay / overdueTasks.length).toFixed(1)) : 0;

      // (4 + 6) / 2 = 5.0 hours
      expect(avgDelay).toBe(5.0);
    });
  });

  describe('Lead Ageing and Inactivity Flags', () => {
    it('buckets leads into 0-7d, 8-14d, 15-30d, and 30d+ correctly', () => {
      const now = new Date('2026-10-20T00:00:00Z').getTime();
      const day = 24 * 3600 * 1000;

      const leads = [
        { id: '1', created_at: new Date(now - 2 * day).toISOString() },  // 0-7d
        { id: '2', created_at: new Date(now - 6 * day).toISOString() },  // 0-7d
        { id: '3', created_at: new Date(now - 10 * day).toISOString() }, // 8-14d
        { id: '4', created_at: new Date(now - 20 * day).toISOString() }, // 15-30d
        { id: '5', created_at: new Date(now - 45 * day).toISOString() }, // 30d+
      ];

      let b0_7 = 0;
      let b8_14 = 0;
      let b15_30 = 0;
      let b30_plus = 0;

      for (const l of leads) {
        const ageDays = (now - new Date(l.created_at).getTime()) / day;
        if (ageDays <= 7) b0_7 += 1;
        else if (ageDays <= 14) b8_14 += 1;
        else if (ageDays <= 30) b15_30 += 1;
        else b30_plus += 1;
      }

      expect(b0_7).toBe(2);
      expect(b8_14).toBe(1);
      expect(b15_30).toBe(1);
      expect(b30_plus).toBe(1);
    });

    it('identifies unclosed stagnant leads with no activity in > 7 days', () => {
      const now = new Date('2026-10-20T00:00:00Z').getTime();
      const day = 24 * 3600 * 1000;

      const leads = [
        { id: 'l1', status: 'new', created_at: new Date(now - 12 * day).toISOString() }, // Stagnant!
        { id: 'l2', status: 'won', created_at: new Date(now - 20 * day).toISOString() }, // Won (closed, ignored)
        { id: 'l3', status: 'qualified', created_at: new Date(now - 15 * day).toISOString() }, // Had activity 2d ago => active
      ];

      const activities = [
        { lead_id: 'l3', created_at: new Date(now - 2 * day).toISOString() },
      ];

      let inactiveCount = 0;
      for (const l of leads) {
        if (!['won', 'lost', 'disqualified', 'not_interested'].includes(l.status)) {
          const lActs = activities.filter((a) => a.lead_id === l.id);
          const lastTime = lActs.length > 0
            ? Math.max(...lActs.map((a) => new Date(a.created_at).getTime()))
            : new Date(l.created_at).getTime();

          const daysInactive = (now - lastTime) / day;
          if (daysInactive > 7) inactiveCount += 1;
        }
      }

      expect(inactiveCount).toBe(1); // Only l1
    });
  });

  describe('CSV Injection Mitigation & RFC 4180 Sanitization', () => {
    function sanitizeCsv(val: unknown): string {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    }

    it('neutralizes malicious spreadsheet command payloads', () => {
      // Common spreadsheet injection attempts:
      expect(sanitizeCsv('=CMD|"/C calc"!A0')).toBe(`"'=CMD|""/C calc""!A0"`);
      expect(sanitizeCsv('+12345')).toBe(`"'+12345"`);
      expect(sanitizeCsv('-12345')).toBe(`"'-12345"`);
      expect(sanitizeCsv('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
    });

    it('correctly escapes standard text with quotes and commas', () => {
      expect(sanitizeCsv('Sunbeam Solar, Pune')).toBe('"Sunbeam Solar, Pune"');
      expect(sanitizeCsv('Tier 1 "Mono PERC" 545W')).toBe('"Tier 1 ""Mono PERC"" 545W"');
    });
  });

  describe('Audit Log Secret Redaction', () => {
    function redact(obj: any): any {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(redact);
      const sensitivePattern = /password|secret|token|api_key|hash|private_key/i;
      const res: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (sensitivePattern.test(k)) {
          res[k] = '[REDACTED]';
        } else if (k.toLowerCase().includes('account_number') && typeof v === 'string' && v.length > 4) {
          res[k] = `••••••••${v.slice(-4)}`;
        } else if (typeof v === 'object' && v !== null) {
          res[k] = redact(v);
        } else {
          res[k] = v;
        }
      }
      return res;
    }

    it('redacts tokens and password hashes while masking bank account numbers', () => {
      const payload = {
        user_name: 'Rohit Joshi',
        password_hash: '$2b$12$e8Y6bF1fG7...',
        auth_token: 'eyJh...',
        account_number: '50200088991122',
        company_name: 'Sunbeam Solar',
      };

      const sanitized = redact(payload);
      expect(sanitized.user_name).toBe('Rohit Joshi');
      expect(sanitized.company_name).toBe('Sunbeam Solar');
      expect(sanitized.password_hash).toBe('[REDACTED]');
      expect(sanitized.auth_token).toBe('[REDACTED]');
      expect(sanitized.account_number).toBe('••••••••1122');
    });
  });
});
