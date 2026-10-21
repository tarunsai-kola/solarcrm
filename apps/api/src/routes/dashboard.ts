import { Router } from 'express';
import type { Request, Response } from 'express';

import { dashboardDrillDownSchema, dashboardFilterSchema } from '@solar-crm/shared';
import type {
  AdminDashboardData,
  FieldAgentDashboardData,
  InboundSalesDashboardData,
} from '@solar-crm/shared';

import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/**
 * Helper to compute date bounds from period or explicit ISO dates
 */
function resolveDateRange(from?: string, to?: string, period?: string): { startIso?: string | undefined; endIso?: string | undefined } {
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /dashboard/admin — Comprehensive Executive & Operational Overview
// ─────────────────────────────────────────────────────────────────────────────
dashboardRouter.get(
  '/admin',
  requireRole('admin'),
  validate(dashboardFilterSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const { from, to, period, team_member_id } = req.query as Record<string, string>;
      const { startIso, endIso } = resolveDateRange(from, to, period);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      // ── 1. Fetch Leads Query ─────────────────────────────────────────────
      let leadsQuery = supabaseAdmin
        .from('leads')
        .select('id, customer_name, status, temperature, lead_source, created_at, inbound_sales_id, assigned_field_agent_id')
        .eq('organization_id', orgId);

      if (startIso) leadsQuery = leadsQuery.gte('created_at', startIso);
      if (endIso) leadsQuery = leadsQuery.lte('created_at', endIso);
      if (team_member_id) {
        leadsQuery = leadsQuery.or(
          `inbound_sales_id.eq.${team_member_id},assigned_field_agent_id.eq.${team_member_id}`,
        );
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;
      const leads = leadsData ?? [];

      // ── 2. Fetch Follow-Ups Query ────────────────────────────────────────
      let followUpsQuery = supabaseAdmin
        .from('follow_ups')
        .select('id, lead_id, assigned_to, due_at, completion_status')
        .eq('organization_id', orgId);

      if (team_member_id) followUpsQuery = followUpsQuery.eq('assigned_to', team_member_id);

      const { data: followUpsData, error: followUpsError } = await followUpsQuery;
      if (followUpsError) throw followUpsError;
      const followUps = followUpsData ?? [];

      // ── 3. Fetch Site Visits Query ───────────────────────────────────────
      let visitsQuery = supabaseAdmin
        .from('site_visits')
        .select('id, lead_id, field_agent_id, scheduled_at, completed_at, visit_status, roof_suitability, recommended_system_capacity_kw')
        .eq('organization_id', orgId);

      if (team_member_id) visitsQuery = visitsQuery.eq('field_agent_id', team_member_id);

      const { data: visitsData, error: visitsError } = await visitsQuery;
      if (visitsError) throw visitsError;
      const visits = visitsData ?? [];

      // ── 4. Fetch Quotations Query ────────────────────────────────────────
      let quotesQuery = supabaseAdmin
        .from('quotations')
        .select('id, lead_id, created_by, status, total_amount, created_at')
        .eq('organization_id', orgId);

      const { data: quotesData, error: quotesError } = await quotesQuery;
      if (quotesError) throw quotesError;
      const quotes = quotesData ?? [];

      // ── 5. Fetch Profiles (Team Members) ─────────────────────────────────
      const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, is_active')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      const profiles = profilesData ?? [];

      // ── 6. KPI Calculations ──────────────────────────────────────────────
      const total_leads = leads.length;
      const fresh_leads = leads.filter((l) => l.status === 'new').length;
      const contacted_leads = leads.filter((l) => l.status === 'contacted').length;
      const hot_leads = leads.filter((l) => l.temperature === 'hot').length;
      const warm_leads = leads.filter((l) => l.temperature === 'warm').length;
      const hot_and_warm_leads = hot_leads + warm_leads;

      // Follow-ups due today and overdue
      const follow_ups_due_today = followUps.filter(
        (f) =>
          f.completion_status === 'pending' &&
          f.due_at >= startOfToday &&
          f.due_at <= endOfToday,
      ).length;

      const overdue_follow_ups = followUps.filter(
        (f) =>
          (f.completion_status === 'pending' || f.completion_status === 'overdue') &&
          f.due_at < startOfToday,
      ).length;

      // Site visits scheduled
      const site_visits_scheduled = visits.filter((v) => v.visit_status === 'scheduled').length;

      // Quotations sent
      const quotations_sent = quotes.filter((q) =>
        ['sent', 'viewed', 'accepted'].includes(q.status),
      ).length;

      // Won & lost leads
      const won_leads = leads.filter((l) => l.status === 'won').length;
      const lost_leads = leads.filter((l) => ['lost', 'disqualified'].includes(l.status)).length;

      // Conversion rates
      // Explicit formula: (won_leads / total_leads) * 100
      const conversion_rate =
        total_leads > 0 ? Number(((won_leads / total_leads) * 100).toFixed(1)) : 0;

      // Win-Loss rate: won / (won + lost) * 100
      const closedDeals = won_leads + lost_leads;
      const win_loss_rate =
        closedDeals > 0 ? Number(((won_leads / closedDeals) * 100).toFixed(1)) : 0;

      // Revenue from won deals (Deduplicate per lead to avoid double-counting multiple quote revisions)
      const wonLeadIds = new Set(leads.filter((l) => l.status === 'won').map((l) => l.id));
      const wonQuotesByLead = new Map<string, number>();

      for (const q of quotes) {
        if (wonLeadIds.has(q.lead_id)) {
          // If quotation is accepted or it's the highest/latest total for this won lead
          const existing = wonQuotesByLead.get(q.lead_id) ?? 0;
          if (q.status === 'accepted' || existing === 0) {
            wonQuotesByLead.set(q.lead_id, Number(q.total_amount) || 0);
          }
        }
      }

      let won_revenue = 0;
      for (const amount of wonQuotesByLead.values()) {
        won_revenue += amount;
      }
      won_revenue = Math.round(won_revenue);

      const average_deal_size = won_leads > 0 ? Math.round(won_revenue / won_leads) : 0;

      // ── 7. Charts Aggregations ───────────────────────────────────────────
      // A. Leads created over time (bucketed by date)
      const dateMap = new Map<string, { count: number; won: number }>();
      for (const lead of leads) {
        const d = new Date(lead.created_at).toISOString().split('T')[0]!;
        const curr = dateMap.get(d) ?? { count: 0, won: 0 };
        curr.count += 1;
        if (lead.status === 'won') curr.won += 1;
        dateMap.set(d, curr);
      }

      const leads_over_time = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, val]) => ({ date, count: val.count, won: val.won }));

      // B. Leads by status
      const statusLabels: Record<string, string> = {
        new: 'Fresh / New',
        contacted: 'Contacted',
        qualified: 'Qualified',
        site_visit_scheduled: 'Site Visit Scheduled',
        site_visit_completed: 'Site Visit Completed',
        quotation_sent: 'Quotation Sent',
        negotiation: 'Negotiation',
        won: 'Won Deals',
        lost: 'Lost Deals',
        disqualified: 'Disqualified',
      };

      const statusMap = new Map<string, number>();
      for (const lead of leads) {
        statusMap.set(lead.status, (statusMap.get(lead.status) ?? 0) + 1);
      }
      const leads_by_status = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        label: statusLabels[status] ?? status,
        count,
      }));

      // C. Leads by source
      const sourceMap = new Map<string, number>();
      for (const lead of leads) {
        const src = lead.lead_source || 'Other';
        sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
      }
      const leads_by_source = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count,
      }));

      // D. Salesperson performance
      const salesReps = profiles.filter((p) => p.role === 'inbound_sales');
      const salesperson_performance = salesReps.map((rep) => {
        const repLeads = leads.filter((l) => l.inbound_sales_id === rep.id);
        const repContacted = repLeads.filter((l) => l.status !== 'new').length;
        const repWon = repLeads.filter((l) => l.status === 'won').length;
        const repConv = repLeads.length > 0 ? Number(((repWon / repLeads.length) * 100).toFixed(1)) : 0;

        let repRevenue = 0;
        for (const l of repLeads) {
          if (l.status === 'won' && wonQuotesByLead.has(l.id)) {
            repRevenue += wonQuotesByLead.get(l.id) ?? 0;
          }
        }

        return {
          id: rep.id,
          name: rep.full_name,
          email: rep.email,
          leads_handled: repLeads.length,
          contacted: repContacted,
          won: repWon,
          conversion_rate: repConv,
          won_revenue: Math.round(repRevenue),
        };
      });

      // E. Field agent performance
      const agents = profiles.filter((p) => p.role === 'field_agent');
      const field_agent_performance = agents.map((agent) => {
        const agentLeads = leads.filter((l) => l.assigned_field_agent_id === agent.id);
        const agentVisits = visits.filter((v) => v.field_agent_id === agent.id);
        const completedVisits = agentVisits.filter((v) => v.visit_status === 'completed').length;
        const scheduledVisits = agentVisits.filter((v) => v.visit_status === 'scheduled').length;
        const agentWon = agentLeads.filter((l) => l.status === 'won').length;

        return {
          id: agent.id,
          name: agent.full_name,
          email: agent.email,
          assigned_leads: agentLeads.length,
          visits_completed: completedVisits,
          visits_scheduled: scheduledVisits,
          won_leads: agentWon,
        };
      });

      // F. Conversion Funnel
      const funnelStages = [
        { stage: 'Total Leads', count: total_leads },
        { stage: 'Contacted', count: leads.filter((l) => l.status !== 'new').length },
        {
          stage: 'Site Visit',
          count: leads.filter((l) =>
            ['site_visit_scheduled', 'site_visit_completed', 'quotation_sent', 'negotiation', 'won'].includes(l.status),
          ).length,
        },
        {
          stage: 'Quotation Sent',
          count: leads.filter((l) => ['quotation_sent', 'negotiation', 'won'].includes(l.status)).length,
        },
        { stage: 'Won Deals', count: won_leads },
      ];

      const conversion_funnel = funnelStages.map((s) => ({
        stage: s.stage,
        count: s.count,
        percentage: total_leads > 0 ? Number(((s.count / total_leads) * 100).toFixed(1)) : 0,
      }));

      // G. Follow-up completion
      const completedFollowUps = followUps.filter((f) => f.completion_status === 'completed').length;
      const pendingFollowUps = followUps.filter((f) => f.completion_status === 'pending').length;
      const totalFollowUps = followUps.length;
      const completion_rate =
        totalFollowUps > 0 ? Number(((completedFollowUps / totalFollowUps) * 100).toFixed(1)) : 0;

      const follow_up_completion = {
        completed: completedFollowUps,
        pending: pendingFollowUps,
        overdue: overdue_follow_ups,
        completion_rate,
      };

      // H. Won revenue over time
      const revenueDateMap = new Map<string, number>();
      for (const q of quotes) {
        if (wonLeadIds.has(q.lead_id) && (q.status === 'accepted' || wonQuotesByLead.get(q.lead_id) === Number(q.total_amount))) {
          const d = new Date(q.created_at).toISOString().split('T')[0]!;
          revenueDateMap.set(d, (revenueDateMap.get(d) ?? 0) + (Number(q.total_amount) || 0));
        }
      }

      let runningCumulative = 0;
      const won_revenue_over_time = Array.from(revenueDateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => {
          runningCumulative += revenue;
          return {
            date,
            revenue: Math.round(revenue),
            cumulative: Math.round(runningCumulative),
          };
        });

      const responseData: AdminDashboardData = {
        kpis: {
          total_leads,
          fresh_leads,
          contacted_leads,
          hot_and_warm_leads,
          hot_leads,
          warm_leads,
          follow_ups_due_today,
          overdue_follow_ups,
          site_visits_scheduled,
          quotations_sent,
          won_leads,
          lost_leads,
          conversion_rate,
          win_loss_rate,
          won_revenue,
          average_deal_size,
        },
        charts: {
          leads_over_time,
          leads_by_status,
          leads_by_source,
          salesperson_performance,
          field_agent_performance,
          conversion_funnel,
          follow_up_completion,
          won_revenue_over_time,
        },
        team_members: {
          inbound_sales: salesReps.map((r) => ({ id: r.id, name: r.full_name, email: r.email })),
          field_agents: agents.map((a) => ({ id: a.id, name: a.full_name, email: a.email })),
        },
      };

      res.json({ success: true, data: responseData });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /dashboard/inbound-sales — Salesperson Assigned Pipeline & Tasks
// ─────────────────────────────────────────────────────────────────────────────
dashboardRouter.get(
  '/inbound-sales',
  requireRole('admin', 'inbound_sales'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Fetch leads assigned to or created by this salesperson
      const { data: leadsData, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .or(`inbound_sales_id.eq.${userId},created_by.eq.${userId}`);

      if (leadsError) throw leadsError;
      const leads = leadsData ?? [];

      const leadIds = leads.map((l) => l.id);

      // Fetch follow-ups assigned to salesperson
      const { data: followUpsData } = await supabaseAdmin
        .from('follow_ups')
        .select('*, leads(customer_name, phone)')
        .eq('organization_id', orgId)
        .eq('assigned_to', userId);

      const followUps = followUpsData ?? [];

      // Fetch site visits for salesperson's leads
      let siteVisitsCount = 0;
      if (leadIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('site_visits')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('lead_id', leadIds)
          .eq('visit_status', 'scheduled');
        siteVisitsCount = count ?? 0;
      }

      // Fetch quotations created by salesperson or for salesperson's leads
      const { data: quotesData } = await supabaseAdmin
        .from('quotations')
        .select('id, lead_id, total_amount, status')
        .eq('organization_id', orgId)
        .or(`created_by.eq.${userId}${leadIds.length > 0 ? `,lead_id.in.(${leadIds.join(',')})` : ''}`);

      const quotes = quotesData ?? [];

      // KPIs
      const my_total_leads = leads.length;
      const fresh_leads = leads.filter((l) => l.status === 'new').length;
      const assigned_follow_ups = followUps.filter((f) => f.completion_status === 'pending').length;
      const overdue_tasks = followUps.filter(
        (f) =>
          (f.completion_status === 'pending' || f.completion_status === 'overdue') &&
          f.due_at < startOfToday,
      ).length;
      const hot_leads = leads.filter((l) => l.temperature === 'hot').length;
      const quotations_sent = quotes.filter((q) => ['sent', 'viewed', 'accepted'].includes(q.status)).length;
      const won_deals = leads.filter((l) => l.status === 'won').length;
      const conversion_rate =
        my_total_leads > 0 ? Number(((won_deals / my_total_leads) * 100).toFixed(1)) : 0;

      // Won revenue
      const wonLeadIds = new Set(leads.filter((l) => l.status === 'won').map((l) => l.id));
      let won_revenue = 0;
      for (const q of quotes) {
        if (wonLeadIds.has(q.lead_id) && q.status === 'accepted') {
          won_revenue += Number(q.total_amount) || 0;
        }
      }

      // Urgent follow ups list
      const urgent_follow_ups = followUps
        .filter((f) => f.completion_status === 'pending')
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
        .slice(0, 8)
        .map((f: any) => ({
          id: f.id,
          lead_id: f.lead_id,
          customer_name: f.leads?.customer_name ?? 'Solar Customer',
          phone: f.leads?.phone ?? '',
          due_at: f.due_at,
          notes: f.notes,
          is_overdue: f.due_at < startOfToday,
        }));

      // Recent hot leads
      const recent_hot_leads = leads
        .filter((l) => l.temperature === 'hot')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
        .map((l) => ({
          id: l.id,
          customer_name: l.customer_name,
          phone: l.phone,
          status: l.status,
          temperature: l.temperature,
          enquiry_type: l.enquiry_type,
          created_at: l.created_at,
        }));

      // Sales Funnel
      const funnel = [
        {
          stage: 'My Leads',
          count: my_total_leads,
          percentage: 100,
        },
        {
          stage: 'Contacted',
          count: leads.filter((l) => l.status !== 'new').length,
          percentage: my_total_leads > 0 ? Number(((leads.filter((l) => l.status !== 'new').length / my_total_leads) * 100).toFixed(1)) : 0,
        },
        {
          stage: 'Site Visit',
          count: leads.filter((l) => ['site_visit_scheduled', 'site_visit_completed', 'quotation_sent', 'negotiation', 'won'].includes(l.status)).length,
          percentage: my_total_leads > 0 ? Number(((leads.filter((l) => ['site_visit_scheduled', 'site_visit_completed', 'quotation_sent', 'negotiation', 'won'].includes(l.status)).length / my_total_leads) * 100).toFixed(1)) : 0,
        },
        {
          stage: 'Quotation Sent',
          count: leads.filter((l) => ['quotation_sent', 'negotiation', 'won'].includes(l.status)).length,
          percentage: my_total_leads > 0 ? Number(((leads.filter((l) => ['quotation_sent', 'negotiation', 'won'].includes(l.status)).length / my_total_leads) * 100).toFixed(1)) : 0,
        },
        {
          stage: 'Won Deals',
          count: won_deals,
          percentage: conversion_rate,
        },
      ];

      // Status breakdown
      const statusMap = new Map<string, number>();
      for (const lead of leads) {
        statusMap.set(lead.status, (statusMap.get(lead.status) ?? 0) + 1);
      }
      const leads_by_status = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

      const responseData: InboundSalesDashboardData = {
        kpis: {
          my_total_leads,
          fresh_leads,
          assigned_follow_ups,
          overdue_tasks,
          hot_leads,
          site_visits_scheduled: siteVisitsCount,
          quotations_sent,
          won_deals,
          conversion_rate,
          won_revenue: Math.round(won_revenue),
        },
        urgent_follow_ups,
        recent_hot_leads,
        funnel,
        leads_by_status,
      };

      res.json({ success: true, data: responseData });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /dashboard/field-agent — Inspections, Visits & Technical Schedule
// ─────────────────────────────────────────────────────────────────────────────
dashboardRouter.get(
  '/field-agent',
  requireRole('admin', 'field_agent'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const callerRole = req.auth!.role;
      const callerId = req.auth!.userId;

      // Privacy Enforcement:
      // Field Agent can ONLY view their own data. They cannot view another agent's performance data.
      let agentId = callerId;
      if (req.query['agent_id']) {
        if (callerRole !== 'admin' && req.query['agent_id'] !== callerId) {
          throw new AppError(
            403,
            'FORBIDDEN',
            "Access denied: Field agents cannot view other agents' private performance data.",
          );
        }
        agentId = req.query['agent_id'] as string;
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      // 1. Assigned leads count
      const { data: leadsData, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('id, customer_name, phone, address, area, pincode')
        .eq('organization_id', orgId)
        .eq('assigned_field_agent_id', agentId);

      if (leadsError) throw leadsError;
      const assignedLeads = leadsData ?? [];

      // 2. Site visits for this agent
      const { data: visitsData, error: visitsError } = await supabaseAdmin
        .from('site_visits')
        .select('*, leads(customer_name, phone, address, area, pincode)')
        .eq('organization_id', orgId)
        .eq('field_agent_id', agentId);

      if (visitsError) throw visitsError;
      const visits = visitsData ?? [];

      // 3. Follow ups assigned to this field agent
      const { data: followUpsData } = await supabaseAdmin
        .from('follow_ups')
        .select('id, due_at, completion_status')
        .eq('organization_id', orgId)
        .eq('assigned_to', agentId);

      const agentFollowUps = followUpsData ?? [];

      // KPIs
      const assigned_leads = assignedLeads.length;

      const today_visits = visits.filter(
        (v) => v.scheduled_at >= startOfToday && v.scheduled_at <= endOfToday,
      ).length;

      const upcoming_visits = visits.filter(
        (v) => v.scheduled_at > endOfToday && ['scheduled', 'rescheduled'].includes(v.visit_status),
      ).length;

      const overdueVisits = visits.filter(
        (v) => v.scheduled_at < startOfToday && ['scheduled', 'in_progress'].includes(v.visit_status),
      ).length;

      const overdueFollowUps = agentFollowUps.filter(
        (f) => (f.completion_status === 'pending' || f.completion_status === 'overdue') && f.due_at < startOfToday,
      ).length;

      const overdue_actions = overdueVisits + overdueFollowUps;

      const completed_visits = visits.filter((v) => v.visit_status === 'completed').length;

      // Pending site reports: Completed or scheduled visits lacking technical suitability or capacity measurements
      const pending_site_reports = visits.filter(
        (v) =>
          (v.visit_status === 'completed' || v.visit_status === 'in_progress') &&
          (!v.roof_suitability || !v.recommended_system_capacity_kw),
      ).length;

      // Today's schedule cards
      const today_schedule = visits
        .filter((v) => v.scheduled_at >= startOfToday && v.scheduled_at <= endOfToday)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .map((v: any) => ({
          id: v.id,
          lead_id: v.lead_id,
          customer_name: v.leads?.customer_name ?? 'Solar Customer',
          phone: v.leads?.phone ?? '',
          address: v.leads?.address ?? v.leads?.area ?? null,
          scheduled_at: v.scheduled_at,
          visit_status: v.visit_status,
          roof_suitability: v.roof_suitability,
        }));

      // Upcoming schedule
      const upcoming_schedule = visits
        .filter((v) => v.scheduled_at > endOfToday && ['scheduled', 'rescheduled'].includes(v.visit_status))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 10)
        .map((v: any) => ({
          id: v.id,
          lead_id: v.lead_id,
          customer_name: v.leads?.customer_name ?? 'Solar Customer',
          phone: v.leads?.phone ?? '',
          address: v.leads?.address ?? v.leads?.area ?? null,
          scheduled_at: v.scheduled_at,
          visit_status: v.visit_status,
        }));

      // Pending reports list
      const pending_reports = visits
        .filter(
          (v) =>
            (v.visit_status === 'completed' || v.visit_status === 'in_progress') &&
            (!v.roof_suitability || !v.recommended_system_capacity_kw),
        )
        .slice(0, 10)
        .map((v: any) => ({
          id: v.id,
          lead_id: v.lead_id,
          customer_name: v.leads?.customer_name ?? 'Solar Customer',
          phone: v.leads?.phone ?? '',
          scheduled_at: v.scheduled_at,
          visit_status: v.visit_status,
        }));

      const responseData: FieldAgentDashboardData = {
        kpis: {
          assigned_leads,
          today_visits,
          upcoming_visits,
          overdue_actions,
          completed_visits,
          pending_site_reports,
        },
        today_schedule,
        upcoming_schedule,
        pending_reports,
      };

      res.json({ success: true, data: responseData });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /dashboard/drill-down — Underlying Records behind any KPI
// ─────────────────────────────────────────────────────────────────────────────
dashboardRouter.get(
  '/drill-down',
  validate(dashboardDrillDownSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const callerRole = req.auth!.role;
      const callerId = req.auth!.userId;

      const { metric, from, to, team_member_id, page, pageSize } = req.query as Record<string, string>;
      const pageNum = parseInt(page ?? '1', 10);
      const size = parseInt(pageSize ?? '20', 10);
      const { startIso, endIso } = resolveDateRange(from, to);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      // Enforce role-based access to drill-down records
      if (callerRole === 'field_agent') {
        // Field Agent can only see records assigned to them
        if (team_member_id && team_member_id !== callerId) {
          throw new AppError(403, 'FORBIDDEN', 'Access denied to other agent records');
        }
      }

      // Route drill-down based on metric category
      if (metric === 'follow_ups_due_today' || metric === 'overdue_follow_ups') {
        let query = supabaseAdmin
          .from('follow_ups')
          .select('*, leads(customer_name, phone, area, status)', { count: 'exact' })
          .eq('organization_id', orgId);

        if (callerRole === 'field_agent' || callerRole === 'inbound_sales') {
          query = query.eq('assigned_to', callerId);
        } else if (team_member_id) {
          query = query.eq('assigned_to', team_member_id);
        }

        if (metric === 'follow_ups_due_today') {
          query = query
            .eq('completion_status', 'pending')
            .gte('due_at', startOfToday)
            .lte('due_at', endOfToday);
        } else {
          query = query
            .or('completion_status.eq.pending,completion_status.eq.overdue')
            .lt('due_at', startOfToday);
        }

        query = query.order('due_at', { ascending: true }).range((pageNum - 1) * size, pageNum * size - 1);
        const { data, count, error } = await query;
        if (error) throw error;

        return res.json({
          success: true,
          data: {
            items: data ?? [],
            total: count ?? 0,
            page: pageNum,
            pageSize: size,
            totalPages: Math.ceil((count ?? 0) / size),
          },
        });
      }

      if (metric === 'site_visits_scheduled' || metric === 'site_visits_completed' || metric === 'pending_site_reports') {
        let query = supabaseAdmin
          .from('site_visits')
          .select('*, leads(customer_name, phone, area, status)', { count: 'exact' })
          .eq('organization_id', orgId);

        if (callerRole === 'field_agent') {
          query = query.eq('field_agent_id', callerId);
        } else if (team_member_id) {
          query = query.eq('field_agent_id', team_member_id);
        }

        if (metric === 'site_visits_scheduled') {
          query = query.eq('visit_status', 'scheduled');
        } else if (metric === 'site_visits_completed') {
          query = query.eq('visit_status', 'completed');
        } else if (metric === 'pending_site_reports') {
          query = query.in('visit_status', ['completed', 'in_progress']).is('roof_suitability', null);
        }

        query = query.order('scheduled_at', { ascending: false }).range((pageNum - 1) * size, pageNum * size - 1);
        const { data, count, error } = await query;
        if (error) throw error;

        return res.json({
          success: true,
          data: {
            items: data ?? [],
            total: count ?? 0,
            page: pageNum,
            pageSize: size,
            totalPages: Math.ceil((count ?? 0) / size),
          },
        });
      }

      // Default: Lead drill-downs (total_leads, fresh_leads, contacted_leads, hot_and_warm_leads, won_leads, lost_leads, etc.)
      let query = supabaseAdmin
        .from('leads')
        .select('*, profiles!inbound_sales_id(full_name), agent:profiles!assigned_field_agent_id(full_name)', { count: 'exact' })
        .eq('organization_id', orgId);

      if (startIso) query = query.gte('created_at', startIso);
      if (endIso) query = query.lte('created_at', endIso);

      if (callerRole === 'field_agent') {
        query = query.eq('assigned_field_agent_id', callerId);
      } else if (callerRole === 'inbound_sales') {
        query = query.or(`inbound_sales_id.eq.${callerId},created_by.eq.${callerId}`);
      } else if (team_member_id) {
        query = query.or(`inbound_sales_id.eq.${team_member_id},assigned_field_agent_id.eq.${team_member_id}`);
      }

      switch (metric) {
        case 'fresh_leads':
          query = query.eq('status', 'new');
          break;
        case 'contacted_leads':
          query = query.eq('status', 'contacted');
          break;
        case 'hot_and_warm_leads':
          query = query.in('temperature', ['hot', 'warm']);
          break;
        case 'hot_leads':
          query = query.eq('temperature', 'hot');
          break;
        case 'warm_leads':
          query = query.eq('temperature', 'warm');
          break;
        case 'won_leads':
          query = query.eq('status', 'won');
          break;
        case 'lost_leads':
          query = query.in('status', ['lost', 'disqualified']);
          break;
      }

      query = query.order('created_at', { ascending: false }).range((pageNum - 1) * size, pageNum * size - 1);
      const { data, count, error } = await query;
      if (error) throw error;

      res.json({
        success: true,
        data: {
          items: data ?? [],
          total: count ?? 0,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil((count ?? 0) / size),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
