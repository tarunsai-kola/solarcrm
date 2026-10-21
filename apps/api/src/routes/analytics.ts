import { Router, type Request, type Response } from 'express';
import { analyticsFilterSchema, exportReportSchema } from '@solar-crm/shared';
import type {
  CompanyWideAnalytics,
  FieldAgentUserAnalytics,
  InboundSalesUserAnalytics,
} from '@solar-crm/shared';

import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/**
 * Helper to compute date bounds from period or explicit ISO dates
 */
function resolveAnalyticsDateRange(
  from?: string,
  to?: string,
  period?: string,
): { startIso?: string | undefined; endIso?: string | undefined } {
  const now = new Date();

  if (period) {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start: Date;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
      case 'all':
        return {};
    }
  }

  return {
    startIso: from ? new Date(from).toISOString() : undefined,
    endIso: to ? new Date(to).toISOString() : undefined,
  };
}

/**
 * Sanitizes CSV cell string to prevent CSV formula injection vulnerability (=, +, -, @)
 * and escapes double quotes according to RFC 4180
 */
function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // CSV injection mitigation
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /analytics/company — Company-Wide Executive & Pipeline Analytics
// ─────────────────────────────────────────────────────────────────────────────
analyticsRouter.get(
  '/company',
  requireRole('admin', 'inbound_sales'),
  validate(analyticsFilterSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const {
        from,
        to,
        period,
        user_id,
        role,
        lead_source,
        status,
        temperature,
        pincode,
      } = req.query as Record<string, string>;

      const { startIso, endIso } = resolveAnalyticsDateRange(from, to, period);
      const now = new Date();

      // 1. Fetch leads
      let leadsQuery = supabaseAdmin
        .from('leads')
        .select('*')
        .eq('organization_id', orgId);

      if (startIso) leadsQuery = leadsQuery.gte('created_at', startIso);
      if (endIso) leadsQuery = leadsQuery.lte('created_at', endIso);
      if (lead_source) leadsQuery = leadsQuery.eq('lead_source', lead_source);
      if (status) leadsQuery = leadsQuery.eq('status', status);
      if (temperature) leadsQuery = leadsQuery.eq('temperature', temperature);
      if (pincode) leadsQuery = leadsQuery.eq('pincode', pincode);
      if (user_id) {
        leadsQuery = leadsQuery.or(
          `inbound_sales_id.eq.${user_id},assigned_field_agent_id.eq.${user_id}`,
        );
      }

      const { data: leadsData, error: leadsErr } = await leadsQuery;
      if (leadsErr) throw leadsErr;
      const leads = leadsData ?? [];

      // 2. Fetch quotations
      let quotesQuery = supabaseAdmin
        .from('quotations')
        .select('*')
        .eq('organization_id', orgId);
      if (startIso) quotesQuery = quotesQuery.gte('created_at', startIso);
      if (endIso) quotesQuery = quotesQuery.lte('created_at', endIso);
      const { data: quotesData, error: quotesErr } = await quotesQuery;
      if (quotesErr) throw quotesErr;
      const quotes = quotesData ?? [];

      // 3. Fetch site visits
      let visitsQuery = supabaseAdmin
        .from('site_visits')
        .select('*')
        .eq('organization_id', orgId);
      if (startIso) visitsQuery = visitsQuery.gte('created_at', startIso);
      if (endIso) visitsQuery = visitsQuery.lte('created_at', endIso);
      const { data: visitsData, error: visitsErr } = await visitsQuery;
      if (visitsErr) throw visitsErr;
      const visits = visitsData ?? [];

      // 4. Fetch follow-ups
      let followUpsQuery = supabaseAdmin
        .from('follow_ups')
        .select('*')
        .eq('organization_id', orgId);
      const { data: followUpsData, error: followUpsErr } = await followUpsQuery;
      if (followUpsErr) throw followUpsErr;
      const followUps = followUpsData ?? [];

      // 5. Fetch activities
      let activitiesQuery = supabaseAdmin
        .from('lead_activities')
        .select('*')
        .eq('organization_id', orgId);
      if (startIso) activitiesQuery = activitiesQuery.gte('created_at', startIso);
      if (endIso) activitiesQuery = activitiesQuery.lte('created_at', endIso);
      const { data: activitiesData, error: activitiesErr } = await activitiesQuery;
      if (activitiesErr) throw activitiesErr;
      const activities = activitiesData ?? [];

      // 6. Fetch profiles
      const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, email')
        .eq('organization_id', orgId)
        .eq('is_active', true);
      const profiles = profilesData ?? [];

      // ── Calculate Summary KPIs ──────────────────────────────────────────────
      const totalLeads = leads.length;
      const freshLeads = leads.filter((l) => l.status === 'new').length;
      const qualifiedLeads = leads.filter((l) =>
        ['qualified', 'follow_up', 'site_visit_scheduled', 'site_visit_completed', 'quotation_prepared', 'quotation_sent', 'negotiation', 'won'].includes(
          l.status,
        ),
      ).length;
      const wonLeads = leads.filter((l) => l.status === 'won').length;
      const overallConversionRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

      // Revenue from won deals / accepted quotations
      const wonQuotes = quotes.filter((q) => q.status === 'accepted');
      const wonRevenue = wonQuotes.reduce((sum, q) => sum + (Number(q.total_amount ?? q.grand_total) || 0), 0);
      const totalQuoteValue = quotes.reduce((sum, q) => sum + (Number(q.total_amount ?? q.grand_total) || 0), 0);

      // Follow-up SLA compliance
      const completedFollowUps = followUps.filter((f) => f.completion_status === 'completed');
      const onTimeFollowUps = completedFollowUps.filter((f) => {
        if (!f.completed_at || !f.due_at) return true;
        return new Date(f.completed_at).getTime() <= new Date(f.due_at).getTime();
      });
      const slaRate = completedFollowUps.length > 0
        ? Number(((onTimeFollowUps.length / completedFollowUps.length) * 100).toFixed(1))
        : 100.0;

      const overdueFollowUps = followUps.filter((f) => {
        if (f.completion_status === 'completed') return false;
        if (!f.due_at) return false;
        return new Date(f.due_at).getTime() < now.getTime();
      });

      let totalDelayHours = 0;
      for (const ov of overdueFollowUps) {
        const delay = (now.getTime() - new Date(ov.due_at).getTime()) / (1000 * 60 * 60);
        totalDelayHours += Math.max(0, delay);
      }
      const avgDelayHours = overdueFollowUps.length > 0
        ? Number((totalDelayHours / overdueFollowUps.length).toFixed(1))
        : 0;

      // ── Sources & Campaign Performance ─────────────────────────────────────
      const sourceMap = new Map<
        string,
        { total: number; won: number; wonRevenue: number }
      >();

      for (const lead of leads) {
        const src = lead.lead_source || 'Other';
        const cur = sourceMap.get(src) ?? { total: 0, won: 0, wonRevenue: 0 };
        cur.total += 1;
        if (lead.status === 'won') {
          cur.won += 1;
          // Find associated won quote
          const leadQuote = wonQuotes.find((q) => q.lead_id === lead.id);
          if (leadQuote) {
            cur.wonRevenue += Number(leadQuote.total_amount ?? leadQuote.grand_total) || 0;
          }
        }
        sourceMap.set(src, cur);
      }

      const sourcesCampaignPerformance = Array.from(sourceMap.entries()).map(([src, d]) => ({
        source: src,
        total_leads: d.total,
        won_leads: d.won,
        conversion_rate: d.total > 0 ? Number(((d.won / d.total) * 100).toFixed(1)) : 0,
        won_revenue: d.wonRevenue,
        avg_deal_size: d.won > 0 ? Number((d.wonRevenue / d.won).toFixed(2)) : 0,
      }));

      // ── Conversion Funnel ──────────────────────────────────────────────────
      const funnelStages = [
        { key: 'fresh', stage: 'Fresh Inquiries', test: () => true },
        { key: 'contacted', stage: 'Contacted', test: (s: string) => s !== 'new' },
        {
          key: 'qualified',
          stage: 'Qualified',
          test: (s: string) =>
            ['qualified', 'follow_up', 'site_visit_scheduled', 'site_visit_completed', 'quotation_prepared', 'quotation_sent', 'negotiation', 'won'].includes(s),
        },
        {
          key: 'site_visit',
          stage: 'Site Visit Completed',
          test: (s: string) =>
            ['site_visit_completed', 'quotation_prepared', 'quotation_sent', 'negotiation', 'won'].includes(s),
        },
        {
          key: 'quotation',
          stage: 'Quotation Sent',
          test: (s: string) => ['quotation_sent', 'negotiation', 'won'].includes(s),
        },
        { key: 'won', stage: 'Won Deals', test: (s: string) => s === 'won' },
      ];

      let prevCount = totalLeads;
      const conversionFunnel = funnelStages.map((stg) => {
        const count = leads.filter((l) => stg.test(l.status)).length;
        const dropoffPct = prevCount > 0 ? Number((((prevCount - count) / prevCount) * 100).toFixed(1)) : 0;
        const conversionPct = totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0;
        prevCount = count;
        return {
          stage: stg.stage,
          count,
          dropoff_pct: Math.max(0, dropoffPct),
          conversion_from_start_pct: conversionPct,
        };
      });

      // ── Lead Ageing Report ─────────────────────────────────────────────────
      let bucket0_7d = 0;
      let bucket8_14d = 0;
      let bucket15_30d = 0;
      let bucket30dPlus = 0;
      let inactiveLeadsCount = 0;

      for (const lead of leads) {
        const ageDays = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays <= 7) bucket0_7d += 1;
        else if (ageDays <= 14) bucket8_14d += 1;
        else if (ageDays <= 30) bucket15_30d += 1;
        else bucket30dPlus += 1;

        // Inactivity: unclosed lead with no activity in > 7 days
        const isClosed = ['won', 'lost', 'disqualified', 'not_interested'].includes(lead.status);
        if (!isClosed) {
          const leadActs = activities.filter((a) => a.lead_id === lead.id);
          const lastActivityTime = leadActs.length > 0
            ? Math.max(...leadActs.map((a) => new Date(a.created_at).getTime()))
            : new Date(lead.created_at).getTime();
          const daysSinceActive = (now.getTime() - lastActivityTime) / (1000 * 60 * 60 * 24);
          if (daysSinceActive > 7) {
            inactiveLeadsCount += 1;
          }
        }
      }

      // ── Pincode & Service-Area Performance ─────────────────────────────────
      const pincodeMap = new Map<
        string,
        { area?: string; total: number; visits: number; won: number; revenue: number }
      >();

      for (const lead of leads) {
        const pin = lead.pincode || 'Unspecified';
        const cur = pincodeMap.get(pin) ?? { area: lead.area ?? undefined, total: 0, visits: 0, won: 0, revenue: 0 };
        cur.total += 1;
        if (!cur.area && lead.area) cur.area = lead.area;

        // Check visits
        const hasVisit = visits.some((v) => v.lead_id === lead.id && v.visit_status === 'completed');
        if (hasVisit) cur.visits += 1;

        if (lead.status === 'won') {
          cur.won += 1;
          const quote = wonQuotes.find((q) => q.lead_id === lead.id);
          if (quote) cur.revenue += Number(quote.total_amount ?? quote.grand_total) || 0;
        }
        pincodeMap.set(pin, cur);
      }

      const pincodePerformance = Array.from(pincodeMap.entries())
        .map(([pin, d]) => ({
          pincode: pin,
          area: d.area,
          total_leads: d.total,
          visits_completed: d.visits,
          won_leads: d.won,
          conversion_rate: d.total > 0 ? Number(((d.won / d.total) * 100).toFixed(1)) : 0,
          won_revenue: d.revenue,
        }))
        .sort((a, b) => b.total_leads - a.total_leads);

      // ── Daily / Weekly Trends (Last 14 days or grouped) ───────────────────
      const trendMap = new Map<
        string,
        { leads: number; acts: number; visits: number; quotes: number; won: number; revenue: number }
      >();

      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 14;
      for (let i = daysBack - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0]!;
        trendMap.set(key, { leads: 0, acts: 0, visits: 0, quotes: 0, won: 0, revenue: 0 });
      }

      for (const l of leads) {
        const key = l.created_at.split('T')[0]!;
        if (trendMap.has(key)) {
          trendMap.get(key)!.leads += 1;
          if (l.status === 'won') trendMap.get(key)!.won += 1;
        }
      }

      for (const a of activities) {
        const key = a.created_at.split('T')[0]!;
        if (trendMap.has(key)) trendMap.get(key)!.acts += 1;
      }

      for (const v of visits) {
        if (v.completed_at) {
          const key = v.completed_at.split('T')[0]!;
          if (trendMap.has(key)) trendMap.get(key)!.visits += 1;
        }
      }

      for (const q of quotes) {
        const key = q.created_at.split('T')[0]!;
        if (trendMap.has(key)) {
          trendMap.get(key)!.quotes += 1;
          if (q.status === 'accepted') trendMap.get(key)!.revenue += Number(q.total_amount ?? q.grand_total) || 0;
        }
      }

      const trends = Array.from(trendMap.entries()).map(([date, d]) => ({
        date,
        leads_created: d.leads,
        activities: d.acts,
        visits: d.visits,
        quotes_sent: d.quotes,
        won_deals: d.won,
        revenue: d.revenue,
      }));

      // Quotation metrics
      const quotationMetrics = {
        total_quotes: quotes.length,
        total_value: totalQuoteValue,
        avg_quote_value: quotes.length > 0 ? Number((totalQuoteValue / quotes.length).toFixed(2)) : 0,
        won_quotes: wonQuotes.length,
        won_value: wonRevenue,
        win_rate: quotes.length > 0 ? Number(((wonQuotes.length / quotes.length) * 100).toFixed(1)) : 0,
      };

      const responsePayload: CompanyWideAnalytics = {
        summary_kpis: {
          total_leads: totalLeads,
          fresh_leads: freshLeads,
          qualified_leads: qualifiedLeads,
          site_visits_count: visits.length,
          quotations_value_total: totalQuoteValue,
          won_leads: wonLeads,
          won_revenue: wonRevenue,
          overall_conversion_rate: overallConversionRate,
          follow_up_sla_compliance_rate: slaRate,
        },
        sources_campaign_performance: sourcesCampaignPerformance,
        conversion_funnel: conversionFunnel,
        lead_ageing_report: {
          bucket_0_7d: bucket0_7d,
          bucket_8_14d: bucket8_14d,
          bucket_15_30d: bucket15_30d,
          bucket_30d_plus: bucket30dPlus,
          inactive_leads: inactiveLeadsCount,
        },
        pincode_performance: pincodePerformance,
        salesperson_comparison: [], // Enriched on-demand or in detailed routes
        field_agent_comparison: [],
        trends: trends,
        quotation_metrics: quotationMetrics,
        follow_up_sla: {
          total_follow_ups: followUps.length,
          completed_on_time: onTimeFollowUps.length,
          overdue: overdueFollowUps.length,
          missed: overdueFollowUps.length,
          sla_compliance_pct: slaRate,
          avg_delay_hours: avgDelayHours,
        },
      };

      res.json({ success: true, data: responsePayload });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /analytics/sales-performance — User-level Sales Rep Metrics
// ─────────────────────────────────────────────────────────────────────────────
analyticsRouter.get(
  '/sales-performance',
  requireRole('admin', 'inbound_sales'),
  validate(analyticsFilterSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const { from, to, period, user_id } = req.query as Record<string, string>;
      const { startIso, endIso } = resolveAnalyticsDateRange(from, to, period);
      const now = new Date();

      // Fetch inbound sales profiles
      let profilesQuery = supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('organization_id', orgId)
        .eq('role', 'inbound_sales')
        .eq('is_active', true);

      if (user_id) profilesQuery = profilesQuery.eq('id', user_id);

      const { data: salesReps, error: repErr } = await profilesQuery;
      if (repErr) throw repErr;

      // Fetch all leads for org
      let leadsQuery = supabaseAdmin.from('leads').select('*').eq('organization_id', orgId);
      if (startIso) leadsQuery = leadsQuery.gte('created_at', startIso);
      if (endIso) leadsQuery = leadsQuery.lte('created_at', endIso);
      const { data: leadsData } = await leadsQuery;
      const leads = leadsData ?? [];

      // Fetch all activities
      const { data: activitiesData } = await supabaseAdmin
        .from('lead_activities')
        .select('*')
        .eq('organization_id', orgId);
      const activities = activitiesData ?? [];

      // Fetch all follow_ups
      const { data: followUpsData } = await supabaseAdmin
        .from('follow_ups')
        .select('*')
        .eq('organization_id', orgId);
      const followUps = followUpsData ?? [];

      // Fetch all site visits
      const { data: visitsData } = await supabaseAdmin
        .from('site_visits')
        .select('*')
        .eq('organization_id', orgId);
      const visits = visitsData ?? [];

      // Fetch all quotations
      const { data: quotesData } = await supabaseAdmin
        .from('quotations')
        .select('*')
        .eq('organization_id', orgId);
      const quotes = quotesData ?? [];

      const repMetrics: InboundSalesUserAnalytics[] = (salesReps || []).map((rep) => {
        const repLeads = leads.filter((l) => l.inbound_sales_id === rep.id);
        const repActivities = activities.filter(
          (a) => a.created_by === rep.id || a.user_id === rep.id || a.author_id === rep.id,
        );
        const repCalls = repActivities.filter((a) =>
          ['call', 'outgoing_call', 'incoming_call'].includes(a.activity_type),
        );

        const repFollowUps = followUps.filter((f) => f.assigned_to === rep.id);
        const completedFollowUps = repFollowUps.filter((f) => f.completion_status === 'completed');
        const overdueFollowUps = repFollowUps.filter((f) => {
          if (f.completion_status === 'completed') return false;
          return f.due_at && new Date(f.due_at).getTime() < now.getTime();
        });
        const missedFollowUps = repFollowUps.filter((f) => {
          if (f.completion_status === 'completed') return false;
          // Missed if overdue by > 24 hours
          return f.due_at && now.getTime() - new Date(f.due_at).getTime() > 24 * 60 * 60 * 1000;
        });

        const freshLeadsAwaiting = repLeads.filter((l) => l.status === 'new').length;
        const qualifiedLeads = repLeads.filter((l) =>
          ['qualified', 'follow_up', 'site_visit_scheduled', 'site_visit_completed', 'quotation_prepared', 'quotation_sent', 'negotiation', 'won'].includes(
            l.status,
          ),
        ).length;

        const wonLeads = repLeads.filter((l) => l.status === 'won').length;
        const lostLeads = repLeads.filter((l) => l.status === 'lost').length;
        const totalManaged = repLeads.length;
        const conversionRate = totalManaged > 0 ? Number(((wonLeads / totalManaged) * 100).toFixed(1)) : 0;

        // Won quotations
        const repLeadIds = new Set(repLeads.map((l) => l.id));
        const repQuotes = quotes.filter((q) => repLeadIds.has(q.lead_id) || q.created_by === rep.id);
        const preparedQuotes = repQuotes.filter((q) => ['draft', 'issued', 'sent', 'viewed', 'accepted'].includes(q.status)).length;
        const sentQuotes = repQuotes.filter((q) => ['sent', 'viewed', 'accepted', 'revised'].includes(q.status)).length;
        const wonQuotes = repQuotes.filter((q) => q.status === 'accepted');
        const wonRevenue = wonQuotes.reduce((sum, q) => sum + (Number(q.total_amount ?? q.grand_total) || 0), 0);

        // Site visits arranged for their leads
        const siteVisitsArranged = visits.filter((v) => repLeadIds.has(v.lead_id)).length;

        // Temperature distribution
        const tempDist = {
          hot: repLeads.filter((l) => l.temperature === 'hot').length,
          warm: repLeads.filter((l) => l.temperature === 'warm').length,
          cold: repLeads.filter((l) => l.temperature === 'cold').length,
          unclassified: repLeads.filter((l) => !l.temperature || l.temperature === 'unclassified').length,
        };

        // Average time to first contact calculation (reproducible formula)
        // Difference between lead created_at and earliest activity created_at
        let contactTimeSumHours = 0;
        let contactedLeadCount = 0;

        for (const l of repLeads) {
          const lActs = activities.filter((a) => a.lead_id === l.id);
          if (lActs.length > 0) {
            const earliestAct = Math.min(...lActs.map((a) => new Date(a.created_at).getTime()));
            const leadCreated = new Date(l.created_at).getTime();
            const diffHours = Math.max(0, (earliestAct - leadCreated) / (1000 * 60 * 60));
            contactTimeSumHours += diffHours;
            contactedLeadCount += 1;
          }
        }

        const avgTimeToContact = contactedLeadCount > 0
          ? Number((contactTimeSumHours / contactedLeadCount).toFixed(1))
          : null;

        // Lead ageing and inactivity (> 3, 7, 14 days)
        const ageing = { days_0_3: 0, days_4_7: 0, days_8_14: 0, days_14_plus: 0 };
        let inactiveCount = 0;

        for (const l of repLeads) {
          const ageDays = (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays <= 3) ageing.days_0_3 += 1;
          else if (ageDays <= 7) ageing.days_4_7 += 1;
          else if (ageDays <= 14) ageing.days_8_14 += 1;
          else ageing.days_14_plus += 1;

          // Inactive (> 7 days without activity and not closed)
          const isClosed = ['won', 'lost', 'disqualified', 'not_interested'].includes(l.status);
          if (!isClosed) {
            const acts = activities.filter((a) => a.lead_id === l.id);
            const lastTime = acts.length > 0
              ? Math.max(...acts.map((a) => new Date(a.created_at).getTime()))
              : new Date(l.created_at).getTime();
            const daysQuiet = (now.getTime() - lastTime) / (1000 * 60 * 60 * 24);
            if (daysQuiet > 7) inactiveCount += 1;
          }
        }

        return {
          user_id: rep.id,
          user_name: rep.full_name,
          email: rep.email,
          total_leads_managed: totalManaged,
          fresh_leads_awaiting_contact: freshLeadsAwaiting,
          calls_and_activities_count: repActivities.length,
          calls_count: repCalls.length,
          follow_ups_completed: completedFollowUps.length,
          follow_ups_overdue: overdueFollowUps.length,
          follow_ups_missed: missedFollowUps.length,
          temperature_distribution: tempDist,
          qualified_leads: qualifiedLeads,
          site_visits_arranged: siteVisitsArranged,
          quotations_prepared: preparedQuotes,
          quotations_sent: sentQuotes,
          won_leads: wonLeads,
          lost_leads: lostLeads,
          conversion_rate: conversionRate,
          won_revenue: wonRevenue,
          avg_time_to_first_contact_hours: avgTimeToContact,
          lead_ageing: ageing,
          inactive_leads_count: inactiveCount,
        };
      });

      res.json({ success: true, data: repMetrics });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /analytics/agent-performance — User-level Field Agent Metrics
// ─────────────────────────────────────────────────────────────────────────────
analyticsRouter.get(
  '/agent-performance',
  requireRole('admin', 'inbound_sales'),
  validate(analyticsFilterSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const { from, to, period, user_id } = req.query as Record<string, string>;
      const { startIso, endIso } = resolveAnalyticsDateRange(from, to, period);
      const now = new Date();

      // Fetch field agent profiles
      let profilesQuery = supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('organization_id', orgId)
        .eq('role', 'field_agent')
        .eq('is_active', true);

      if (user_id) profilesQuery = profilesQuery.eq('id', user_id);

      const { data: fieldAgents, error: agentErr } = await profilesQuery;
      if (agentErr) throw agentErr;

      // Fetch field_agent_profiles for service pincodes and max workload
      const { data: agentMeta } = await supabaseAdmin
        .from('field_agent_profiles')
        .select('*')
        .eq('organization_id', orgId);
      const metaMap = new Map((agentMeta || []).map((m) => [m.id, m]));

      // Fetch leads
      let leadsQuery = supabaseAdmin.from('leads').select('*').eq('organization_id', orgId);
      if (startIso) leadsQuery = leadsQuery.gte('created_at', startIso);
      if (endIso) leadsQuery = leadsQuery.lte('created_at', endIso);
      const { data: leadsData } = await leadsQuery;
      const leads = leadsData ?? [];

      // Fetch site visits
      const { data: visitsData } = await supabaseAdmin
        .from('site_visits')
        .select('*')
        .eq('organization_id', orgId);
      const visits = visitsData ?? [];

      // Fetch follow-ups
      const { data: followUpsData } = await supabaseAdmin
        .from('follow_ups')
        .select('*')
        .eq('organization_id', orgId);
      const followUps = followUpsData ?? [];

      const agentMetrics: FieldAgentUserAnalytics[] = (fieldAgents || []).map((agent) => {
        const meta = metaMap.get(agent.id);
        const assignedLeads = leads.filter((l) => l.assigned_field_agent_id === agent.id);
        const agentVisits = visits.filter((v) => v.field_agent_id === agent.id);

        const scheduledVisits = agentVisits.length;
        const completedVisits = agentVisits.filter((v) => v.visit_status === 'completed').length;
        const completionRate = scheduledVisits > 0
          ? Number(((completedVisits / scheduledVisits) * 100).toFixed(1))
          : 0;

        // Leads awaiting field action: assigned leads with no completed visit or report
        const leadsAwaitingAction = assignedLeads.filter((l) => {
          const v = agentVisits.find((vis) => vis.lead_id === l.id);
          return !v || v.visit_status !== 'completed';
        }).length;

        // Site reports submitted: completed visits with roof suitability and notes
        const reportsSubmitted = agentVisits.filter((v) =>
          v.visit_status === 'completed' && (v.roof_suitability !== null || v.notes !== null),
        ).length;

        // Follow-up actions assigned to agent
        const agentFollowUps = followUps.filter((f) => f.assigned_to === agent.id);

        // Outcomes after visits
        const assignedLeadIds = new Set(assignedLeads.map((l) => l.id));
        const outcomes = {
          won: 0,
          lost: 0,
          quotation_sent: 0,
          disqualified: 0,
          in_progress: 0,
        };

        for (const l of assignedLeads) {
          if (l.status === 'won') outcomes.won += 1;
          else if (l.status === 'lost') outcomes.lost += 1;
          else if (l.status === 'quotation_sent' || l.status === 'negotiation') outcomes.quotation_sent += 1;
          else if (l.status === 'disqualified' || l.status === 'not_interested') outcomes.disqualified += 1;
          else outcomes.in_progress += 1;
        }

        // Active workload & overdue tasks
        const activeLeads = assignedLeads.filter((l) => !['won', 'lost', 'disqualified'].includes(l.status)).length;
        const overdueVisits = agentVisits.filter((v) =>
          v.visit_status === 'scheduled' && v.scheduled_at && new Date(v.scheduled_at).getTime() < now.getTime(),
        ).length;
        const overdueFollowUps = agentFollowUps.filter((f) =>
          f.completion_status !== 'completed' && f.due_at && new Date(f.due_at).getTime() < now.getTime(),
        ).length;

        return {
          user_id: agent.id,
          user_name: agent.full_name,
          email: agent.email,
          service_pincodes: meta?.service_pincodes ?? [],
          assigned_leads: assignedLeads.length,
          site_visits_scheduled: scheduledVisits,
          site_visits_completed: completedVisits,
          visit_completion_rate: completionRate,
          leads_awaiting_field_action: leadsAwaitingAction,
          site_reports_submitted: reportsSubmitted,
          follow_up_actions: agentFollowUps.length,
          outcomes_after_visits: outcomes,
          current_active_workload: activeLeads,
          overdue_tasks: overdueVisits + overdueFollowUps,
        };
      });

      res.json({ success: true, data: agentMetrics });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /analytics/export — Permitted CSV Report Exporter with Security & Audit
// ─────────────────────────────────────────────────────────────────────────────
analyticsRouter.get(
  '/export',
  validate(exportReportSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const userRole = req.auth!.role;
      const userId = req.auth!.userId;
      const { type, from, to, period, user_id, lead_source, status, temperature, pincode } =
        req.query as Record<string, string>;

      // ── Access Control Enforcement ──────────────────────────────────────────
      if (userRole === 'field_agent') {
        throw new AppError(403, 'FORBIDDEN', 'Field agents are not authorized to export reports');
      }

      if (userRole === 'inbound_sales' && type !== 'leads' && type !== 'sales_performance') {
        throw new AppError(403, 'FORBIDDEN', 'Inbound sales can only export lead reports or personal performance');
      }

      const { startIso, endIso } = resolveAnalyticsDateRange(from, to, period);

      let csvHeaders: string[] = [];
      let csvRows: string[][] = [];
      let reportFilename = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;

      if (type === 'leads') {
        let query = supabaseAdmin
          .from('leads')
          .select('id, customer_name, phone, address, pincode, enquiry_type, lead_source, status, temperature, created_at, inbound_sales_id, assigned_field_agent_id')
          .eq('organization_id', orgId);

        if (userRole === 'inbound_sales') {
          query = query.eq('inbound_sales_id', userId);
        } else if (user_id) {
          query = query.or(`inbound_sales_id.eq.${user_id},assigned_field_agent_id.eq.${user_id}`);
        }

        if (startIso) query = query.gte('created_at', startIso);
        if (endIso) query = query.lte('created_at', endIso);
        if (lead_source) query = query.eq('lead_source', lead_source);
        if (status) query = query.eq('status', status);
        if (temperature) query = query.eq('temperature', temperature);
        if (pincode) query = query.eq('pincode', pincode);

        const { data: leads, error } = await query;
        if (error) throw error;

        csvHeaders = [
          'Lead ID',
          'Customer Name',
          'Phone',
          'Address',
          'Pincode',
          'Enquiry Type',
          'Lead Source',
          'Status',
          'Temperature',
          'Created At',
        ];

        csvRows = (leads || []).map((l) => [
          l.id,
          l.customer_name,
          l.phone,
          l.address || '',
          l.pincode || '',
          l.enquiry_type || '',
          l.lead_source || '',
          l.status,
          l.temperature || 'unclassified',
          l.created_at,
        ]);
      } else if (type === 'sales_performance') {
        // Build sales report
        const repQuery = supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('organization_id', orgId)
          .eq('role', 'inbound_sales');

        const { data: reps } = await (userRole === 'inbound_sales' ? repQuery.eq('id', userId) : repQuery);
        const { data: leads } = await supabaseAdmin.from('leads').select('*').eq('organization_id', orgId);

        csvHeaders = [
          'Salesperson Name',
          'Email',
          'Total Leads Managed',
          'Fresh Leads',
          'Qualified Leads',
          'Won Deals',
          'Lost Deals',
          'Conversion Rate (%)',
        ];

        csvRows = (reps || []).map((r) => {
          const rLeads = (leads || []).filter((l) => l.inbound_sales_id === r.id);
          const total = rLeads.length;
          const won = rLeads.filter((l) => l.status === 'won').length;
          const fresh = rLeads.filter((l) => l.status === 'new').length;
          const qualified = rLeads.filter((l) => ['qualified', 'won'].includes(l.status)).length;
          const lost = rLeads.filter((l) => l.status === 'lost').length;
          const rate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';

          return [r.full_name, r.email, String(total), String(fresh), String(qualified), String(won), String(lost), `${rate}%`];
        });
      } else if (type === 'agent_performance') {
        const { data: agents } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('organization_id', orgId)
          .eq('role', 'field_agent');

        const { data: visits } = await supabaseAdmin.from('site_visits').select('*').eq('organization_id', orgId);

        csvHeaders = [
          'Field Agent Name',
          'Email',
          'Scheduled Visits',
          'Completed Visits',
          'Completion Rate (%)',
        ];

        csvRows = (agents || []).map((a) => {
          const aVisits = (visits || []).filter((v) => v.field_agent_id === a.id);
          const scheduled = aVisits.length;
          const completed = aVisits.filter((v) => v.visit_status === 'completed').length;
          const rate = scheduled > 0 ? ((completed / scheduled) * 100).toFixed(1) : '0.0';

          return [a.full_name, a.email, String(scheduled), String(completed), `${rate}%`];
        });
      } else if (type === 'quotations') {
        const { data: quotes, error } = await supabaseAdmin
          .from('quotations')
          .select('id, quote_number, customer_name, system_capacity_kw, total_amount, grand_total, status, created_at')
          .eq('organization_id', orgId);
        if (error) throw error;

        csvHeaders = [
          'Quote Number',
          'Customer Name',
          'System Capacity (kW)',
          'Total Amount (INR)',
          'Grand Total (INR)',
          'Status',
          'Created Date',
        ];

        csvRows = (quotes || []).map((q) => [
          q.quote_number,
          q.customer_name,
          String(q.system_capacity_kw ?? 0),
          String(q.total_amount ?? 0),
          String(q.grand_total ?? 0),
          q.status,
          q.created_at,
        ]);
      } else if (type === 'audit_logs') {
        const { data: logs, error } = await supabaseAdmin
          .from('audit_logs')
          .select('id, actor_id, action, entity_type, entity_id, ip_address, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1000);
        if (error) throw error;

        csvHeaders = ['Log ID', 'Actor ID', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Timestamp'];
        csvRows = (logs || []).map((l) => [
          l.id,
          l.actor_id || 'System',
          l.action,
          l.entity_type,
          l.entity_id || '',
          l.ip_address || '',
          l.created_at,
        ]);
      }

      // Build RFC 4180 CSV content
      const headerLine = csvHeaders.map(sanitizeCsvValue).join(',');
      const dataLines = csvRows.map((row) => row.map(sanitizeCsvValue).join(','));
      const csvContent = [headerLine, ...dataLines].join('\r\n');

      // ── Record Privileged Export Event in Tamper-Resistant Audit Log ──────────
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: userId,
        p_action: 'export',
        p_entity_type: `report_${type}`,
        p_new_values: {
          report_type: type,
          filters: req.query,
          record_count: csvRows.length,
          exported_at: new Date().toISOString(),
        },
        p_ip_address: req.ip || null,
        p_user_agent: req.headers['user-agent'] || null,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${reportFilename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  },
);
