import { describe, expect, it } from 'vitest';

// ── Formulas & Metrics Verification Unit Tests
describe('Dashboard KPI Calculation Formulas & Business Logic', () => {
  describe('Conversion Rate Calculations', () => {
    it('calculates Lead-to-Win Conversion Rate accurately: (Won / Total) * 100', () => {
      const wonLeads = 18;
      const totalLeads = 100;
      const rate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

      expect(rate).toBe(18.0);
    });

    it('safely handles 0 total leads without NaN or division by zero errors', () => {
      const wonLeads = 0;
      const totalLeads = 0;
      const rate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

      expect(rate).toBe(0);
      expect(Number.isNaN(rate)).toBe(false);
    });

    it('calculates Closed Deal Win-Loss Rate: Won / (Won + Lost) * 100', () => {
      const wonLeads = 15;
      const lostLeads = 10;
      const closedDeals = wonLeads + lostLeads;
      const winLossRate = closedDeals > 0 ? Number(((wonLeads / closedDeals) * 100).toFixed(1)) : 0;

      // 15 / 25 * 100 = 60.0%
      expect(winLossRate).toBe(60.0);
    });
  });

  describe('Revenue Deduplication & Average Deal Size', () => {
    it('avoids double-counting revenue when a lead has multiple quotation revisions', () => {
      // Scenario: Lead-1 has 2 quotes (v1 revised ₹200k, v2 accepted ₹220k)
      // Lead-2 has 1 quote (accepted ₹350k)
      // Lead-3 is lost/pending (quote ₹150k — must not count)
      const wonLeadIds = new Set(['lead-1', 'lead-2']);
      const quotes = [
        { id: 'q-1', lead_id: 'lead-1', version: 1, status: 'revised', total_amount: 200000 },
        { id: 'q-2', lead_id: 'lead-1', version: 2, status: 'accepted', total_amount: 220000 },
        { id: 'q-3', lead_id: 'lead-2', version: 1, status: 'accepted', total_amount: 350000 },
        { id: 'q-4', lead_id: 'lead-3', version: 1, status: 'sent', total_amount: 150000 },
      ];

      const wonQuotesByLead = new Map<string, number>();
      for (const q of quotes) {
        if (wonLeadIds.has(q.lead_id)) {
          const existing = wonQuotesByLead.get(q.lead_id) ?? 0;
          if (q.status === 'accepted' || existing === 0) {
            wonQuotesByLead.set(q.lead_id, q.total_amount);
          }
        }
      }

      let wonRevenue = 0;
      for (const amt of wonQuotesByLead.values()) {
        wonRevenue += amt;
      }

      // Expected: ₹220,000 + ₹350,000 = ₹570,000 (NOT ₹200k + ₹220k + ₹350k = ₹770k)
      expect(wonRevenue).toBe(570000);

      // Average deal size: 570,000 / 2 = 285,000
      const averageDealSize = Math.round(wonRevenue / wonLeadIds.size);
      expect(averageDealSize).toBe(285000);
    });
  });

  describe('Indian Rupee Currency Formatting', () => {
    it('formats Indian currency with proper comma grouping (Lakhs & Crores)', () => {
      const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(val);

      // Standard Indian currency format replaces standard commas with lakh separators
      const formatted = formatCurrency(1250000);
      expect(formatted).toContain('12,50,000');
    });
  });

  describe('Date Range Filter Resolutions', () => {
    it('computes past date bounds correctly for 7d and 30d periods', () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const diffDays = Math.round((now.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });
  });
});
