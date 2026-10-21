import { Router } from 'express';
import type { Request, Response } from 'express';

import {
  AUDIT_ACTIONS,
  LEAD_STATUSES,
  LEAD_STATUS_CONFIG,
  amendLeadActivitySchema,
  assignFieldAgentSchema,
  bulkAssignLeadsSchema,
  bulkStatusUpdateSchema,
  checkDuplicateLeadSchema,
  createCallLogSchema,
  createFollowUpSchema,
  createLeadActivitySchema,
  createLeadSchema,
  createSiteVisitSchema,
  leadFilterSchema,
  updateLeadSchema,
  updateSiteVisitSchema,
  type EligibleAgentMatch,
  type EligibleAgentsResponse,
} from '@solar-crm/shared';

import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { notifySharedActivity, notifySiteVisitChange } from '../services/notification-service.js';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from '../services/google-calendar.js';

export const leadsRouter = Router();

// All lead routes require authenticated user
leadsRouter.use(requireAuth);

/**
 * Standardize phone numbers to canonical E.164 (+91 standard for Indian numbers)
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Terminal / closed statuses that trigger "Reopened" audit when transitioning to an active stage
 */
const CLOSED_STATUSES = new Set(['won', 'lost', 'not_interested', 'disqualified']);

// ─── 1. GET /leads/check-duplicate — Duplicate Lead Detection ─────────────────
leadsRouter.get(
  '/check-duplicate',
  validate(checkDuplicateLeadSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const { phone, email, exclude_id } = req.query as {
        phone?: string;
        email?: string;
        exclude_id?: string;
      };
      const orgId = req.auth!.organizationId;

      if (!phone && !email) {
        return res.json({ success: true, data: { hasDuplicate: false, matches: [] } });
      }

      let query = supabaseAdmin
        .from('leads')
        .select(
          'id, customer_name, phone, email, status, temperature, enquiry_type, created_at, inbound_sales:profiles!inbound_sales_id(id, full_name), assigned_field_agent:profiles!assigned_field_agent_id(id, full_name)',
        )
        .eq('organization_id', orgId);

      if (exclude_id) {
        query = query.neq('id', exclude_id);
      }

      const orConditions: string[] = [];
      if (phone) {
        const norm = normalizePhone(phone);
        const last10 = norm.replace(/\D/g, '').slice(-10);
        orConditions.push(`phone.ilike.%${last10}%`);
        if (norm) orConditions.push(`phone.eq.${norm}`);
      }
      if (email && email.trim()) {
        orConditions.push(`email.ilike.${email.trim()}`);
      }

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }

      const { data: matches, error } = await query.limit(5);
      if (error) throw error;

      res.json({
        success: true,
        data: {
          hasDuplicate: (matches?.length ?? 0) > 0,
          matches: matches ?? [],
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 2. GET /leads/export — Restricted CSV Export ─────────────────────────────
leadsRouter.get(
  '/export',
  requireRole('admin', 'inbound_sales'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const { status, temperature, lead_source, enquiry_type, search } = req.query as Record<
        string,
        string
      >;

      let query = supabaseAdmin
        .from('leads')
        .select(
          `id, customer_name, phone, email, status, temperature, enquiry_type, lead_source, area, pincode, address, created_at, next_follow_up_at,
           salesperson:profiles!inbound_sales_id(full_name),
           field_agent:profiles!assigned_field_agent_id(full_name)`,
        )
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (temperature) query = query.eq('temperature', temperature);
      if (lead_source) query = query.eq('lead_source', lead_source);
      if (enquiry_type) query = query.eq('enquiry_type', enquiry_type);
      if (search) {
        query = query.or(
          `customer_name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%,area.ilike.%${search}%,pincode.ilike.%${search}%`,
        );
      }

      const { data, error } = await query.limit(5000);
      if (error) throw error;

      // Log export action in audit logs
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: req.auth!.userId,
        action: AUDIT_ACTIONS[5], // 'export'
        entity_type: 'leads',
        notes: `Exported ${data?.length ?? 0} leads to CSV`,
        occurred_at: new Date().toISOString(),
      });

      // Generate CSV
      const headers = [
        'ID',
        'Customer Name',
        'Phone',
        'Email',
        'Status',
        'Temperature',
        'Enquiry Type',
        'Lead Source',
        'Area',
        'Pincode',
        'Address',
        'Salesperson',
        'Field Agent',
        'Next Follow-up',
        'Created At',
      ];

      const rows = (data ?? []).map((l: any) => [
        `"${l.id}"`,
        `"${(l.customer_name ?? '').replace(/"/g, '""')}"`,
        `"${l.phone ?? ''}"`,
        `"${l.email ?? ''}"`,
        `"${l.status ?? ''}"`,
        `"${l.temperature ?? ''}"`,
        `"${l.enquiry_type ?? ''}"`,
        `"${l.lead_source ?? ''}"`,
        `"${(l.area ?? '').replace(/"/g, '""')}"`,
        `"${l.pincode ?? ''}"`,
        `"${(l.address ?? '').replace(/"/g, '""')}"`,
        `"${(l.salesperson?.full_name ?? '').replace(/"/g, '""')}"`,
        `"${(l.field_agent?.full_name ?? '').replace(/"/g, '""')}"`,
        `"${l.next_follow_up_at ?? ''}"`,
        `"${l.created_at ?? ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  },
);

// ─── 3. GET /leads — List with Search, Filters, Sorting & Pagination ──────────
leadsRouter.get(
  '/',
  validate(leadFilterSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const {
        page = '1',
        pageSize = '25',
        status,
        temperature,
        lead_source,
        source,
        enquiry_type,
        pincode,
        assigned_field_agent_id,
        inbound_sales_id,
        search,
        quick_filter,
        sort_by = 'created_at',
        sort_order = 'desc',
        from,
        to,
      } = req.query as Record<string, string>;

      const orgId = req.auth!.organizationId;
      const userRole = req.auth!.role;
      const userId = req.auth!.userId;

      let query = supabaseAdmin
        .from('leads')
        .select(
          `*,
           inbound_sales:profiles!inbound_sales_id(id, full_name, email),
           assigned_field_agent:profiles!assigned_field_agent_id(id, full_name, email, phone),
           assigned_profile:profiles!assigned_to(id, full_name, email)`,
          { count: 'exact' },
        )
        .eq('organization_id', orgId);

      // Role Scoping: Field Agents only see their assigned leads
      if (userRole === 'field_agent') {
        query = query.or(`assigned_field_agent_id.eq.${userId},assigned_to.eq.${userId}`);
      }

      // Quick Filters
      const nowIso = new Date().toISOString();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (quick_filter === 'fresh') {
        query = query.eq('status', 'new');
      } else if (quick_filter === 'contacted') {
        query = query.eq('status', 'contacted');
      } else if (quick_filter === 'follow_up_due') {
        query = query
          .gte('next_follow_up_at', startOfToday.toISOString())
          .lte('next_follow_up_at', endOfToday.toISOString());
      } else if (quick_filter === 'overdue') {
        query = query
          .lt('next_follow_up_at', nowIso)
          .not('status', 'in', '("won","lost","not_interested","disqualified")');
      } else if (quick_filter === 'won') {
        query = query.eq('status', 'won');
      } else if (quick_filter === 'lost') {
        query = query.eq('status', 'lost');
      }

      // Explicit Filters
      if (status && !quick_filter) query = query.eq('status', status);
      if (temperature) query = query.eq('temperature', temperature);
      if (lead_source) query = query.eq('lead_source', lead_source);
      if (source) query = query.eq('lead_source', source);
      if (enquiry_type) query = query.eq('enquiry_type', enquiry_type);
      if (pincode) query = query.eq('pincode', pincode);
      if (assigned_field_agent_id)
        query = query.eq('assigned_field_agent_id', assigned_field_agent_id);
      if (inbound_sales_id) query = query.eq('inbound_sales_id', inbound_sales_id);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);

      // Search across customer_name, phone, email, address, area, pincode
      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
          `customer_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,address.ilike.%${s}%,area.ilike.%${s}%,pincode.ilike.%${s}%`,
        );
      }

      // Sorting
      const validSortCols: Record<string, string> = {
        created_at: 'created_at',
        customer_name: 'customer_name',
        next_follow_up_at: 'next_follow_up_at',
        status: 'status',
        temperature: 'temperature',
      };
      const sortCol = validSortCols[sort_by] ?? 'created_at';
      query = query.order(sortCol, { ascending: sort_order === 'asc' });

      // Pagination
      const pageNum = Math.max(1, parseInt(page, 10));
      const size = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
      query = query.range((pageNum - 1) * size, pageNum * size - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      // Enhance items with is_overdue flag
      const items = (data ?? []).map((lead: any) => ({
        ...lead,
        is_overdue:
          Boolean(lead.next_follow_up_at) &&
          new Date(lead.next_follow_up_at) < new Date() &&
          !CLOSED_STATUSES.has(lead.status),
      }));

      res.json({
        success: true,
        data: {
          items,
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

// ─── 4. POST /leads — Add Lead with Duplicate Warning & Inspection ────────────
leadsRouter.post(
  '/',
  requireRole('admin', 'inbound_sales'),
  validate(createLeadSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const companyId = req.auth!.companyId ?? orgId;
      const userId = req.auth!.userId;
      const userRole = req.auth!.role;
      const body = { ...req.body };

      // Normalize phone number
      body.phone = normalizePhone(body.phone);

      // Check duplicates unless explicit user override allow_duplicate is provided
      if (!body.allow_duplicate) {
        const last10 = body.phone.replace(/\D/g, '').slice(-10);
        const orConditions = [`phone.ilike.%${last10}%`];
        if (body.email && body.email.trim()) {
          orConditions.push(`email.ilike.${body.email.trim()}`);
        }

        const { data: duplicates } = await supabaseAdmin
          .from('leads')
          .select(
            'id, customer_name, phone, email, status, temperature, enquiry_type, created_at, inbound_sales:profiles!inbound_sales_id(id, full_name)',
          )
          .eq('organization_id', orgId)
          .or(orConditions.join(','))
          .limit(3);

        if (duplicates && duplicates.length > 0) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'DUPLICATE_LEAD_DETECTED',
              message:
                'A lead with this phone number or email already exists in your organization.',
              details: {
                matches: duplicates,
              },
            },
          });
        }
      }

      // Remove non-table field
      delete body.allow_duplicate;

      // Insert Lead
      const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .insert({
          ...body,
          organization_id: orgId,
          company_id: companyId,
          created_by: userId,
          inbound_sales_id: body.inbound_sales_id ?? (userRole === 'inbound_sales' ? userId : null),
          status: body.status ?? 'new',
          temperature: body.temperature ?? 'unclassified',
          enquiry_type: body.enquiry_type ?? 'residential',
          lead_source: body.lead_source ?? 'Other',
        })
        .select()
        .single();

      if (error) throw error;

      // Initial Status Activity
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: lead.id,
        author_id: userId,
        activity_type: 'status_change',
        outcome: 'Lead Created',
        notes: `Lead registered with status: ${LEAD_STATUS_CONFIG[lead.status as keyof typeof LEAD_STATUS_CONFIG]?.label ?? lead.status}`,
        occurred_at: new Date().toISOString(),
      });

      // Initial Note Activity (if provided)
      if (body.initial_note && body.initial_note.trim()) {
        await supabaseAdmin.from('lead_activities').insert({
          organization_id: orgId,
          lead_id: lead.id,
          author_id: userId,
          activity_type: 'note',
          notes: body.initial_note.trim(),
          occurred_at: new Date().toISOString(),
        });
      }

      // Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[0], // 'create'
        entity_type: 'leads',
        entity_id: lead.id,
        new_values: lead,
        occurred_at: new Date().toISOString(),
      });

      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 5. POST /leads/bulk-assign — Bulk Assign Leads (Admin / Inbound Sales) ──
leadsRouter.post(
  '/bulk-assign',
  requireRole('admin', 'inbound_sales'),
  validate(bulkAssignLeadsSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const { lead_ids, assigned_field_agent_id, inbound_sales_id } = req.body;

      const updateData: Record<string, any> = {};
      if (assigned_field_agent_id !== undefined) {
        updateData.assigned_field_agent_id = assigned_field_agent_id;
        updateData.assigned_to = assigned_field_agent_id;
      }
      if (inbound_sales_id !== undefined) {
        updateData.inbound_sales_id = inbound_sales_id;
      }

      const { data, error } = await supabaseAdmin
        .from('leads')
        .update(updateData)
        .in('id', lead_ids)
        .eq('organization_id', orgId)
        .select('id, customer_name');

      if (error) throw error;

      // Log assignment activity for each lead
      const activities = lead_ids.map((leadId: string) => ({
        organization_id: orgId,
        lead_id: leadId,
        author_id: userId,
        activity_type: 'assignment',
        outcome: 'Bulk Assignment',
        notes: `Lead re-assigned via bulk action`,
        occurred_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from('lead_activities').insert(activities);

      res.json({
        success: true,
        data: {
          updatedCount: data?.length ?? 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 6. POST /leads/bulk-status — Bulk Status Update ──────────────────────────
leadsRouter.post(
  '/bulk-status',
  requireRole('admin', 'inbound_sales'),
  validate(bulkStatusUpdateSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const { lead_ids, status, notes } = req.body;

      const { data, error } = await supabaseAdmin
        .from('leads')
        .update({ status })
        .in('id', lead_ids)
        .eq('organization_id', orgId)
        .select('id, status');

      if (error) throw error;

      const statusLabel =
        LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG]?.label ?? status;
      const activities = lead_ids.map((leadId: string) => ({
        organization_id: orgId,
        lead_id: leadId,
        author_id: userId,
        activity_type: 'status_change',
        outcome: 'Bulk Status Update',
        notes: `Bulk status update to: ${statusLabel}. ${notes ? `Note: ${notes}` : ''}`.trim(),
        occurred_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from('lead_activities').insert(activities);

      res.json({
        success: true,
        data: {
          updatedCount: data?.length ?? 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 7. GET /leads/:id — Comprehensive Lead Detail ────────────────────────────
leadsRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const leadId = req.params['id'];
    const orgId = req.auth!.organizationId;
    const userRole = req.auth!.role;
    const userId = req.auth!.userId;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select(
        `*,
         inbound_sales:profiles!inbound_sales_id(id, full_name, email, phone),
         assigned_field_agent:profiles!assigned_field_agent_id(id, full_name, email, phone),
         assigned_profile:profiles!assigned_to(id, full_name, email),
         creator:profiles!created_by(id, full_name, email),
         lead_activities(*, author:profiles!author_id(id, full_name, role)),
         follow_ups(*, assignee:profiles!assigned_to(id, full_name)),
         site_visits(*, field_agent:profiles!field_agent_id(id, full_name)),
         quotations(*)`,
      )
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .single();

    if (error || !lead) {
      throw new AppError(404, 'NOT_FOUND', 'Lead not found');
    }

    // Role Scoping: Field Agent can only view leads assigned to them
    if (
      userRole === 'field_agent' &&
      lead.assigned_field_agent_id !== userId &&
      lead.assigned_to !== userId
    ) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this lead.');
    }

    // Sort lead activities chronologically descending (newest first)
    if (lead.lead_activities && Array.isArray(lead.lead_activities)) {
      lead.lead_activities.sort(
        (a: any, b: any) =>
          new Date(b.occurred_at || b.created_at).getTime() -
          new Date(a.occurred_at || a.created_at).getTime(),
      );
    }

    // Sort follow-ups (next due first)
    if (lead.follow_ups && Array.isArray(lead.follow_ups)) {
      lead.follow_ups.sort(
        (a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
      );
    }

    // Generate Google Maps URL if address or pincode exists
    const fullAddress = [lead.address, lead.area, lead.pincode].filter(Boolean).join(', ');
    const mapUrl = fullAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
      : null;

    res.json({
      success: true,
      data: {
        ...lead,
        mapUrl,
        is_overdue:
          Boolean(lead.next_follow_up_at) &&
          new Date(lead.next_follow_up_at) < new Date() &&
          !CLOSED_STATUSES.has(lead.status),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 8. PATCH /leads/:id — Update Lead & Record Status Transitions ───────────
leadsRouter.patch(
  '/:id',
  validate(updateLeadSchema),
  async (req: Request, res: Response, next) => {
    try {
      const leadId = req.params['id'];
      const orgId = req.auth!.organizationId;
      const userRole = req.auth!.role;
      const userId = req.auth!.userId;
      const updates = { ...req.body };

      // Fetch existing lead to detect status changes and permission
      const { data: existingLead, error: fetchErr } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (fetchErr || !existingLead) {
        throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      }

      // Role check for Field Agent
      if (
        userRole === 'field_agent' &&
        existingLead.assigned_field_agent_id !== userId &&
        existingLead.assigned_to !== userId
      ) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this lead.');
      }

      if (updates.phone) {
        updates.phone = normalizePhone(updates.phone);
      }

      // Detect Status Change
      let statusActivityData: any = null;
      if (updates.status && updates.status !== existingLead.status) {
        const oldStatus = existingLead.status;
        const newStatus = updates.status;

        const isReopened = CLOSED_STATUSES.has(oldStatus) && !CLOSED_STATUSES.has(newStatus);
        const oldLabel =
          LEAD_STATUS_CONFIG[oldStatus as keyof typeof LEAD_STATUS_CONFIG]?.label ?? oldStatus;
        const newLabel =
          LEAD_STATUS_CONFIG[newStatus as keyof typeof LEAD_STATUS_CONFIG]?.label ?? newStatus;

        statusActivityData = {
          organization_id: orgId,
          lead_id: leadId,
          author_id: userId,
          activity_type: 'status_change',
          outcome: isReopened ? 'Reopened' : 'Status Changed',
          notes: isReopened
            ? `[Reopened Lead] Deal reopened from "${oldLabel}" to "${newLabel}"`
            : `Status changed from "${oldLabel}" to "${newLabel}"`,
          occurred_at: new Date().toISOString(),
        };
      }

      // Detect Assignment Change
      let assignmentActivityData: any = null;
      if (
        (updates.assigned_field_agent_id !== undefined &&
          updates.assigned_field_agent_id !== existingLead.assigned_field_agent_id) ||
        (updates.inbound_sales_id !== undefined &&
          updates.inbound_sales_id !== existingLead.inbound_sales_id)
      ) {
        assignmentActivityData = {
          organization_id: orgId,
          lead_id: leadId,
          author_id: userId,
          activity_type: 'assignment',
          outcome: 'Reassigned',
          notes: `Lead team assignment updated`,
          occurred_at: new Date().toISOString(),
        };
      }

      // Execute Update
      const { data: updatedLead, error: updateErr } = await supabaseAdmin
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Record Activity Records
      if (statusActivityData) {
        await supabaseAdmin.from('lead_activities').insert(statusActivityData);
      }
      if (assignmentActivityData) {
        await supabaseAdmin.from('lead_activities').insert(assignmentActivityData);
      }

      // Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[1], // 'update'
        entity_type: 'leads',
        entity_id: leadId,
        old_values: existingLead,
        new_values: updatedLead,
        occurred_at: new Date().toISOString(),
      });

      res.json({ success: true, data: updatedLead });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 9. POST /leads/:id/activities — Log Calls, Notes, WhatsApp, Emails ────────
leadsRouter.post(
  '/:id/activities',
  validate(createLeadActivitySchema.omit({ lead_id: true })),
  async (req: Request, res: Response, next) => {
    try {
      const leadId = req.params['id'] as string;
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;

      // Verify lead exists
      const { data: lead, error: leadErr } = await supabaseAdmin
        .from('leads')
        .select('id, organization_id, customer_name, inbound_sales_id, assigned_field_agent_id')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (leadErr || !lead) {
        throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      }

      const { data: activity, error } = await supabaseAdmin
        .from('lead_activities')
        .insert({
          organization_id: orgId,
          lead_id: leadId,
          author_id: userId,
          activity_type: req.body.activity_type,
          outcome: req.body.outcome ?? null,
          notes: req.body.notes,
          occurred_at: req.body.occurred_at ?? new Date().toISOString(),
        })
        .select('*, author:profiles!author_id(id, full_name, role)')
        .single();

      if (error) throw error;

      // Notify assigned team members of new shared activity
      try {
        const actorName = activity.author?.full_name || req.auth!.email;
        if (lead.inbound_sales_id && lead.inbound_sales_id !== userId) {
          await notifySharedActivity({
            organization_id: orgId,
            lead_id: leadId,
            customer_name: lead.customer_name || 'Customer',
            activity_type: req.body.activity_type,
            actor_id: userId,
            actor_name: actorName,
            target_user_id: lead.inbound_sales_id,
            notes_snippet: req.body.notes,
          });
        }
        if (lead.assigned_field_agent_id && lead.assigned_field_agent_id !== userId) {
          await notifySharedActivity({
            organization_id: orgId,
            lead_id: leadId,
            customer_name: lead.customer_name || 'Customer',
            activity_type: req.body.activity_type,
            actor_id: userId,
            actor_name: actorName,
            target_user_id: lead.assigned_field_agent_id,
            notes_snippet: req.body.notes,
          });
        }
      } catch {
        // non-blocking
      }

      res.status(201).json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 9b. POST /leads/:id/call-logs — Complete Call Log with Follow-up & Temp ───
leadsRouter.post(
  '/:id/call-logs',
  validate(createCallLogSchema.omit({ lead_id: true })),
  async (req: Request, res: Response, next) => {
    try {
      const leadId = req.params['id'];
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const {
        activity_type = 'outgoing_call',
        outcome,
        temperature,
        notes,
        follow_up_required,
        next_follow_up_at,
        follow_up_owner,
        duration_seconds,
        attachment_url,
        attachment_name,
      } = req.body;

      // Verify lead exists and belongs to organization
      const { data: lead, error: leadErr } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (leadErr || !lead) {
        throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      }

      // 1. Follow-up handling if requested
      let createdFollowUp: any = null;
      if (follow_up_required && next_follow_up_at) {
        const targetOwner = follow_up_owner || lead.inbound_sales_id || userId;

        // Verify owner is active member
        const { data: ownerProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, account_status, is_active')
          .eq('id', targetOwner)
          .eq('organization_id', orgId)
          .single();

        if (ownerProfile && (ownerProfile.account_status !== 'active' || ownerProfile.is_active === false)) {
          throw new AppError(400, 'INACTIVE_OWNER', 'Follow-up owner must be an active user account.');
        }

        const { data: fu, error: fuErr } = await supabaseAdmin
          .from('follow_ups')
          .insert({
            organization_id: orgId,
            lead_id: leadId,
            assigned_to: targetOwner,
            due_at: next_follow_up_at,
            notes: `Follow-up following ${activity_type.replace(/_/g, ' ')} (${outcome}): ${notes.slice(0, 150)}`,
            reminder_status: 'pending',
            completion_status: 'pending',
            created_by: userId,
          })
          .select('*, assignee:profiles!assigned_to(id, full_name)')
          .single();

        if (fuErr) throw fuErr;
        createdFollowUp = fu;

        // Update lead next_follow_up_at
        await supabaseAdmin
          .from('leads')
          .update({ next_follow_up_at })
          .eq('id', leadId)
          .eq('organization_id', orgId);
      }

      // 2. Update Lead Temperature if provided
      if (temperature && temperature !== lead.temperature) {
        await supabaseAdmin
          .from('leads')
          .update({ temperature })
          .eq('id', leadId)
          .eq('organization_id', orgId);
      }

      // 3. Insert into lead_activities
      const { data: activity, error: actErr } = await supabaseAdmin
        .from('lead_activities')
        .insert({
          organization_id: orgId,
          lead_id: leadId,
          author_id: userId,
          activity_type,
          outcome,
          notes,
          duration_seconds: duration_seconds || null,
          attachment_url: attachment_url || null,
          attachment_name: attachment_name || null,
          follow_up_id: createdFollowUp ? createdFollowUp.id : null,
          occurred_at: new Date().toISOString(),
        })
        .select('*, author:profiles!author_id(id, full_name, role), follow_up:follow_ups!follow_up_id(*)')
        .single();

      if (actErr) throw actErr;

      // 4. Record Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[0], // 'create'
        entity_type: 'lead_activities',
        entity_id: activity.id,
        new_values: activity,
        occurred_at: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        data: {
          activity,
          followUp: createdFollowUp,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 9c. POST /leads/:id/activities/:activityId/amend — Auditable Amendment ────
leadsRouter.post(
  '/:id/activities/:activityId/amend',
  validate(amendLeadActivitySchema),
  async (req: Request, res: Response, next) => {
    try {
      const { id: leadId, activityId } = req.params as { id: string; activityId: string };
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const { notes, amendment_reason } = req.body;

      // Fetch target original activity
      const { data: origActivity, error: fetchErr } = await supabaseAdmin
        .from('lead_activities')
        .select('*')
        .eq('id', activityId)
        .eq('lead_id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (fetchErr || !origActivity) {
        throw new AppError(404, 'NOT_FOUND', 'Original activity record not found.');
      }

      // Append auditable amendment record (never mutate original)
      const { data: amendment, error: insErr } = await supabaseAdmin
        .from('lead_activities')
        .insert({
          organization_id: orgId,
          lead_id: leadId,
          author_id: userId,
          activity_type: 'amendment',
          outcome: 'Amended',
          notes: `[Correction to ${origActivity.activity_type} on ${new Date(
            origActivity.occurred_at,
          ).toLocaleDateString()}]: ${notes.trim()}`,
          amends_activity_id: activityId,
          is_amendment: true,
          amendment_reason: amendment_reason.trim(),
          occurred_at: new Date().toISOString(),
        })
        .select('*, author:profiles!author_id(id, full_name, role), amends_activity:lead_activities!amends_activity_id(id, notes, occurred_at)')
        .single();

      if (insErr) throw insErr;

      // Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[1], // 'update'
        entity_type: 'lead_activities_amendment',
        entity_id: amendment.id,
        notes: `Amended activity ${activityId}: ${amendment_reason}`,
        occurred_at: new Date().toISOString(),
      });

      res.status(201).json({ success: true, data: amendment });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 10. POST /leads/:id/follow-ups — Schedule Follow-up ───────────────────────
leadsRouter.post(
  '/:id/follow-ups',
  validate(createFollowUpSchema.omit({ lead_id: true })),
  async (req: Request, res: Response, next) => {
    try {
      const leadId = req.params['id'];
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const { due_at, notes, assigned_to } = req.body;

      // Verify lead
      const { data: lead, error: leadErr } = await supabaseAdmin
        .from('leads')
        .select('id, organization_id')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (leadErr || !lead) {
        throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      }

      // Insert Follow-up
      const { data: followUp, error: fuErr } = await supabaseAdmin
        .from('follow_ups')
        .insert({
          organization_id: orgId,
          lead_id: leadId,
          assigned_to: assigned_to ?? userId,
          due_at,
          notes: notes ?? null,
          reminder_status: 'pending',
          completion_status: 'pending',
          created_by: userId,
        })
        .select('*, assignee:profiles!assigned_to(id, full_name)')
        .single();

      if (fuErr) throw fuErr;

      // Update next_follow_up_at on lead
      await supabaseAdmin
        .from('leads')
        .update({ next_follow_up_at: due_at })
        .eq('id', leadId)
        .eq('organization_id', orgId);

      // Log activity
      const formattedDate = new Date(due_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: leadId,
        author_id: userId,
        activity_type: 'note',
        outcome: 'Follow-up Scheduled',
        notes: `Follow-up scheduled for ${formattedDate}${notes ? `: "${notes}"` : ''}`,
        occurred_at: new Date().toISOString(),
      });

      res.status(201).json({ success: true, data: followUp });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 11. DELETE /leads/:id — Admin Only ───────────────────────────────────────
leadsRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', req.params['id'])
      .eq('organization_id', req.auth!.organizationId);

    if (error) throw error;
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ─── 12. Pincode-Based Matching Algorithm ──────────────────────────────────────
export interface ScoringResult {
  score: number;
  isPincodeMatch: boolean;
  isBasePincodeMatch: boolean;
  isAreaMatch: boolean;
  isAtCapacity: boolean;
  recommended: boolean;
  recommendationReason: string;
}

export function computeAgentMatchScore(params: {
  leadPincode?: string | null;
  leadArea?: string | null;
  agentPincode?: string | null;
  servicePincodes: string[];
  serviceAreas: string[];
  availability: 'available' | 'busy' | 'on_leave' | 'offline';
  maxActiveLeads: number;
  currentActiveLeads: number;
  pendingSiteVisits: number;
}): ScoringResult {
  const {
    leadPincode,
    leadArea,
    agentPincode,
    servicePincodes = [],
    serviceAreas = [],
    availability = 'available',
    maxActiveLeads = 15,
    currentActiveLeads = 0,
    pendingSiteVisits = 0,
  } = params;

  const cleanLeadPin = leadPincode?.trim() || '';
  const cleanLeadArea = leadArea?.trim().toLowerCase() || '';

  const isPincodeMatch = !!cleanLeadPin && servicePincodes.includes(cleanLeadPin);
  const isBasePincodeMatch = !!cleanLeadPin && !!agentPincode && agentPincode.trim() === cleanLeadPin;
  const isAreaMatch =
    !!cleanLeadArea &&
    serviceAreas.some((a) => a.trim().toLowerCase() === cleanLeadArea);
  const isAtCapacity = currentActiveLeads >= maxActiveLeads;

  let score = 0;

  // 1. Pincode and Area Geographic Eligibility Signals
  if (isPincodeMatch) score += 50;
  if (isBasePincodeMatch) score += 35;
  if (isAreaMatch) score += 25;

  // 2. Availability
  if (availability === 'available') score += 20;
  else if (availability === 'busy') score += 5;
  else if (availability === 'on_leave' || availability === 'offline') score -= 50;

  // 3. Workload & Headroom Capacity
  if (!isAtCapacity) {
    const headroomRatio = Math.max(0, (maxActiveLeads - currentActiveLeads) / Math.max(1, maxActiveLeads));
    score += Math.round(headroomRatio * 15);
  } else {
    score -= 30; // Capacity penalty
  }

  // 4. Pending Site Visits
  if (pendingSiteVisits === 0) score += 10;
  else if (pendingSiteVisits <= 2) score += 5;
  else score -= 5;

  // Recommendation Reason determination
  let recommendationReason = 'Alternative coverage agent';
  if (isPincodeMatch && isBasePincodeMatch && !isAtCapacity && availability === 'available') {
    recommendationReason = `Primary base & service pincode match (${cleanLeadPin}) with available capacity`;
  } else if (isPincodeMatch && !isAtCapacity && availability === 'available') {
    recommendationReason = `Configured service pincode match (${cleanLeadPin})`;
  } else if (isBasePincodeMatch && !isAtCapacity && availability === 'available') {
    recommendationReason = `Base headquarters pincode match (${agentPincode})`;
  } else if (isAreaMatch && !isAtCapacity && availability === 'available') {
    recommendationReason = `Configured service area match (${leadArea})`;
  } else if (isAtCapacity) {
    recommendationReason = `At maximum active capacity (${currentActiveLeads}/${maxActiveLeads} active leads)`;
  } else if (availability !== 'available') {
    recommendationReason = `Agent availability is currently ${availability}`;
  }

  const recommended =
    (isPincodeMatch || isBasePincodeMatch || isAreaMatch) &&
    !isAtCapacity &&
    availability === 'available' &&
    score >= 40;

  return {
    score: Math.max(0, score),
    isPincodeMatch,
    isBasePincodeMatch,
    isAreaMatch,
    isAtCapacity,
    recommended,
    recommendationReason,
  };
}

// ─── 13. GET /leads/:id/eligible-agents — Rank Eligible Field Agents ───────────
leadsRouter.get('/:id/eligible-agents', async (req: Request, res: Response, next) => {
  try {
    const leadId = req.params['id'];
    const orgId = req.auth!.organizationId;

    // Fetch lead details
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, pincode, area, assigned_field_agent_id, organization_id')
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .single();

    if (leadErr || !lead) {
      throw new AppError(404, 'NOT_FOUND', 'Lead not found');
    }

    // Fetch all active field agents in the organization
    const { data: agentProfiles, error: agentProfilesErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone, role, account_status, is_active')
      .eq('organization_id', orgId)
      .eq('role', 'field_agent')
      .eq('account_status', 'active');

    if (agentProfilesErr) throw agentProfilesErr;

    const activeAgentProfiles = (agentProfiles ?? []).filter((p) => p.is_active !== false);

    // Fetch field agent specific profiles (service pincodes, capacity, etc.)
    const { data: faProfiles } = await supabaseAdmin
      .from('field_agent_profiles')
      .select('*')
      .eq('organization_id', orgId);

    const faProfileMap = new Map((faProfiles ?? []).map((f) => [f.user_id, f]));

    // Fetch active assigned leads count per agent
    const { data: activeLeads } = await supabaseAdmin
      .from('leads')
      .select('assigned_field_agent_id')
      .eq('organization_id', orgId)
      .not('assigned_field_agent_id', 'is', null)
      .in('status', ['new', 'contacted', 'qualified', 'follow_up', 'site_visit_scheduled']);

    const leadCountMap = new Map<string, number>();
    (activeLeads ?? []).forEach((l) => {
      if (l.assigned_field_agent_id) {
        leadCountMap.set(
          l.assigned_field_agent_id,
          (leadCountMap.get(l.assigned_field_agent_id) || 0) + 1,
        );
      }
    });

    // Fetch pending site visits per agent
    const { data: pendingVisits } = await supabaseAdmin
      .from('site_visits')
      .select('field_agent_id')
      .eq('organization_id', orgId)
      .eq('visit_status', 'scheduled');

    const visitCountMap = new Map<string, number>();
    (pendingVisits ?? []).forEach((v) => {
      if (v.field_agent_id) {
        visitCountMap.set(v.field_agent_id, (visitCountMap.get(v.field_agent_id) || 0) + 1);
      }
    });

    // Calculate score & ranking for each agent
    const rankedAgents: EligibleAgentMatch[] = activeAgentProfiles.map((p) => {
      const fa = faProfileMap.get(p.id);
      const servicePincodes: string[] = fa?.service_pincodes || [];
      const serviceAreas: string[] = fa?.service_areas || [];
      const availability = fa?.availability || 'available';
      const maxActiveLeads = fa?.max_active_leads ?? 15;
      const currentActiveLeads = leadCountMap.get(p.id) || 0;
      const pendingSiteVisits = visitCountMap.get(p.id) || 0;

      const scoring = computeAgentMatchScore({
        leadPincode: lead.pincode,
        leadArea: lead.area,
        agentPincode: fa?.pincode,
        servicePincodes,
        serviceAreas,
        availability,
        maxActiveLeads,
        currentActiveLeads,
        pendingSiteVisits,
      });

      return {
        agent_id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        email: p.email,
        base_pincode: fa?.pincode || null,
        service_pincodes: servicePincodes,
        service_areas: serviceAreas,
        availability,
        max_active_leads: maxActiveLeads,
        current_active_leads: currentActiveLeads,
        pending_site_visits: pendingSiteVisits,
        score: scoring.score,
        is_pincode_match: scoring.isPincodeMatch,
        is_base_pincode_match: scoring.isBasePincodeMatch,
        is_area_match: scoring.isAreaMatch,
        is_at_capacity: scoring.isAtCapacity,
        recommended: scoring.recommended,
        recommendation_reason: scoring.recommendationReason,
        notes: fa?.notes || null,
      };
    });

    // Sort ranked agents
    rankedAgents.sort((a, b) => {
      // 1. Recommended first
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      // 2. Score descending
      if (b.score !== a.score) return b.score - a.score;
      // 3. Lowest workload first (load balancing)
      return a.current_active_leads - b.current_active_leads;
    });

    // If multiple were tagged recommended, keep only top 1 as primary recommendation
    let hasRecommended = false;
    rankedAgents.forEach((agent) => {
      if (agent.recommended) {
        if (!hasRecommended) {
          hasRecommended = true;
        } else {
          agent.recommended = false;
        }
      }
    });

    const hasExactPincodeMatch = rankedAgents.some(
      (a) => a.is_pincode_match || a.is_base_pincode_match,
    );

    let unassignedReason: string | null = null;
    if (rankedAgents.length === 0) {
      unassignedReason = 'No active field agent profiles found in the organization.';
    } else if (!hasExactPincodeMatch) {
      unassignedReason = lead.pincode
        ? `No active field agents configure service pincode ${lead.pincode}. Showing alternative agents or administrative override.`
        : 'Lead has no service pincode specified. Assigning an agent requires administrative discretion.';
    } else if (!hasRecommended) {
      unassignedReason = 'Matching field agents for this pincode are currently at maximum capacity or unavailable.';
    }

    const response: EligibleAgentsResponse = {
      lead_id: lead.id,
      lead_pincode: lead.pincode,
      lead_area: lead.area,
      current_agent_id: lead.assigned_field_agent_id,
      has_exact_pincode_match: hasExactPincodeMatch,
      unassigned_reason: unassignedReason,
      agents: rankedAgents,
    };

    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});

// ─── 14. POST /leads/:id/assign-agent — Protected Field Agent Assignment ───────
leadsRouter.post(
  '/:id/assign-agent',
  validate(assignFieldAgentSchema),
  async (req: Request, res: Response, next) => {
    try {
      const userRole = req.auth!.role;
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const leadId = req.params['id'];
      const { agent_id, override_reason } = req.body;

      // Permission Check: Only admin and inbound_sales can assign leads
      if (userRole === 'field_agent') {
        throw new AppError(403, 'FORBIDDEN', 'Field agents are not authorized to assign or reassign leads.');
      }

      // Fetch lead
      const { data: lead, error: leadErr } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (leadErr || !lead) {
        throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      }

      // Verify target field agent exists and is active
      const { data: targetProfile, error: targetErr } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, phone, role, account_status, is_active')
        .eq('id', agent_id)
        .eq('organization_id', orgId)
        .single();

      if (targetErr || !targetProfile) {
        throw new AppError(404, 'NOT_FOUND', 'Selected field agent not found in your organization.');
      }

      if (targetProfile.role !== 'field_agent') {
        throw new AppError(400, 'INVALID_ROLE', 'Assigned user must have the Field Agent role.');
      }

      if (targetProfile.account_status !== 'active' || targetProfile.is_active === false) {
        throw new AppError(400, 'INACTIVE_AGENT', 'Cannot assign leads to an inactive or suspended field agent.');
      }

      // Check agent capacity
      const { data: targetFA } = await supabaseAdmin
        .from('field_agent_profiles')
        .select('max_active_leads, availability')
        .eq('user_id', agent_id)
        .eq('organization_id', orgId)
        .single();

      const maxCapacity = targetFA?.max_active_leads ?? 15;

      const { count: activeCount } = await supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('assigned_field_agent_id', agent_id)
        .in('status', ['new', 'contacted', 'qualified', 'follow_up', 'site_visit_scheduled']);

      const currentActiveCount = activeCount ?? 0;

      // If at or over capacity and no override reason, reject
      if (currentActiveCount >= maxCapacity && !override_reason?.trim()) {
        throw new AppError(
          400,
          'CAPACITY_EXCEEDED',
          `Field agent ${targetProfile.full_name} has reached maximum capacity (${currentActiveCount}/${maxCapacity} active leads). Please provide an override reason to proceed.`,
        );
      }

      const previousAgentId = lead.assigned_field_agent_id;
      let prevAgentProfile: any = null;
      if (previousAgentId) {
        const { data: prevP } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', previousAgentId)
          .single();
        prevAgentProfile = prevP;
      }

      // Atomic Update: Leads table
      const { data: updatedLead, error: updateErr } = await supabaseAdmin
        .from('leads')
        .update({
          assigned_field_agent_id: agent_id,
          assigned_to: agent_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .select('*, assigned_field_agent:profiles!assigned_field_agent_id(id, full_name, email, phone)')
        .single();

      if (updateErr) throw updateErr;

      // 1. In-app Notification for newly assigned field agent
      await supabaseAdmin.from('notifications').insert({
        organization_id: orgId,
        user_id: agent_id,
        type: 'lead_assigned',
        title: `New Lead Assigned: ${lead.customer_name}`,
        body: `You have been assigned to lead ${lead.customer_name} (${lead.phone}, Area: ${
          lead.area || 'N/A'
        }, Pincode: ${lead.pincode || 'N/A'}). Assigned by ${req.auth!.email}.${
          override_reason ? ` (Override: ${override_reason})` : ''
        }`,
        metadata: { lead_id: leadId, customer_name: lead.customer_name, assigned_by: userId },
        created_at: new Date().toISOString(),
      });

      // 2. Notification for previous agent on reassignment
      if (previousAgentId && previousAgentId !== agent_id) {
        await supabaseAdmin.from('notifications').insert({
          organization_id: orgId,
          user_id: previousAgentId,
          type: 'lead_reassigned',
          title: `Lead Reassigned: ${lead.customer_name}`,
          body: `Lead ${lead.customer_name} was reassigned to ${targetProfile.full_name} by ${
            req.auth!.email
          }.${override_reason ? ` (Override: ${override_reason})` : ''}`,
          metadata: { lead_id: leadId, customer_name: lead.customer_name, new_agent_id: agent_id },
          created_at: new Date().toISOString(),
        });
      }

      // 3. Activity Timeline Record (Append-Only)
      const actionType = previousAgentId ? 'Reassigned' : 'Assigned';
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: leadId,
        author_id: userId,
        activity_type: 'assignment',
        outcome: actionType,
        notes: `Field agent ${actionType.toLowerCase()} to ${targetProfile.full_name} (${
          targetProfile.phone || 'No phone'
        }). Previous agent: ${prevAgentProfile?.full_name || 'Unassigned'}.${
          override_reason ? ` (Override Reason: ${override_reason})` : ''
        }`,
        occurred_at: new Date().toISOString(),
      });

      // 4. Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[1], // 'update'
        entity_type: 'leads',
        entity_id: leadId,
        notes: `Assigned field agent ${targetProfile.full_name} (${agent_id}) to lead ${leadId}`,
        occurred_at: new Date().toISOString(),
      });

      res.json({
        success: true,
        data: {
          lead: updatedLead,
          assignedAgent: targetProfile,
          previousAgent: prevAgentProfile,
          previousAgentId: previousAgentId || null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 14. GET /leads/:id/visits — List Site Visits ─────────────────────────────
leadsRouter.get('/:id/visits', async (req: Request, res: Response, next) => {
  try {
    const leadId = req.params['id'];
    const orgId = req.auth!.organizationId;

    const { data: visits, error } = await supabaseAdmin
      .from('site_visits')
      .select('*, field_agent:profiles!field_agent_id(id, full_name, email, phone)')
      .eq('lead_id', leadId)
      .eq('organization_id', orgId)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: visits || [] });
  } catch (err) {
    next(err);
  }
});

// ─── 15. POST /leads/:id/visits — Schedule a Site Visit ───────────────────────
leadsRouter.post(
  '/:id/visits',
  validate(createSiteVisitSchema.omit({ lead_id: true })),
  async (req: Request, res: Response, next) => {
    try {
      const leadId = req.params['id'] as string;
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const {
        field_agent_id,
        scheduled_at,
        visit_status = 'scheduled',
        site_observations,
        roof_suitability,
        electricity_bill_amount,
        monthly_consumption_kwh,
        recommended_system_capacity_kw,
        attachments = [],
        next_action,
      } = req.body;

      // Verify lead exists
      const { data: lead, error: leadErr } = await supabaseAdmin
        .from('leads')
        .select('id, organization_id, customer_name, inbound_sales_id, assigned_field_agent_id, status')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (leadErr || !lead) {
        throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      }

      const agentId = field_agent_id || lead.assigned_field_agent_id;
      if (!agentId) {
        throw new AppError(400, 'AGENT_REQUIRED', 'Please specify a field agent or assign one to this lead.');
      }

      const { data: visit, error: visitErr } = await supabaseAdmin
        .from('site_visits')
        .insert({
          organization_id: orgId,
          lead_id: leadId,
          field_agent_id: agentId,
          scheduled_at,
          visit_status,
          site_observations,
          roof_suitability,
          electricity_bill_amount,
          monthly_consumption_kwh,
          recommended_system_capacity_kw,
          attachments,
          next_action,
        })
        .select('*, field_agent:profiles!field_agent_id(id, full_name, email, phone)')
        .single();

      if (visitErr || !visit) throw visitErr;

      // Update lead status to site_visit_scheduled if earlier status
      if (['new', 'fresh', 'contacted', 'qualified', 'follow_up'].includes(lead.status)) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'site_visit_scheduled' })
          .eq('id', leadId);
      }

      // Add timeline activity
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: leadId,
        author_id: userId,
        activity_type: 'site_visit',
        outcome: 'Scheduled',
        notes: `Site visit scheduled for ${new Date(scheduled_at).toLocaleString('en-IN')}.${
          site_observations ? ` Notes: ${site_observations}` : ''
        }`,
        occurred_at: new Date().toISOString(),
      });

      // Audit log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[0], // create
        entity_type: 'site_visits',
        entity_id: visit.id,
        new_values: visit,
        occurred_at: new Date().toISOString(),
      });

      // In-app Notification for assigned field agent and inbound sales
      try {
        await notifySiteVisitChange({
          organization_id: orgId,
          visit_id: visit.id,
          lead_id: leadId,
          customer_name: lead.customer_name || 'Customer',
          change_type: 'scheduled',
          scheduled_at,
          field_agent_id: agentId,
          inbound_sales_id: lead.inbound_sales_id,
          actor_id: userId,
        });
      } catch {
        // non-blocking
      }

      // Synchronize to Google Calendar if assigned field agent has active integration
      try {
        const { data: calIntegration } = await supabaseAdmin
          .from('calendar_integrations')
          .select('id, sync_status, sync_enabled')
          .eq('user_id', agentId)
          .eq('organization_id', orgId)
          .eq('provider', 'google')
          .eq('sync_status', 'active')
          .eq('sync_enabled', true)
          .maybeSingle();

        if (calIntegration) {
          const startTime = new Date(scheduled_at).toISOString();
          const endTime = new Date(new Date(scheduled_at).getTime() + 60 * 60 * 1000).toISOString();
          await createGoogleCalendarEvent(agentId, orgId, {
            lead_id: leadId,
            site_visit_id: visit.id,
            title: `Site Inspection: ${lead.customer_name || 'Customer'}`,
            description: site_observations || 'Site feasibility inspection',
            start_time: startTime,
            end_time: endTime,
          });
        }
      } catch {
        // non-blocking
      }

      res.status(201).json({ success: true, data: visit });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 16. PATCH /leads/:id/visits/:visitId — Update / Complete Site Visit ──────
leadsRouter.patch(
  '/:id/visits/:visitId',
  validate(updateSiteVisitSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { id: leadId, visitId } = req.params as { id: string; visitId: string };
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;

      // Verify existing visit
      const { data: existingVisit, error: fetchErr } = await supabaseAdmin
        .from('site_visits')
        .select('*')
        .eq('id', visitId)
        .eq('lead_id', leadId)
        .eq('organization_id', orgId)
        .single();

      if (fetchErr || !existingVisit) {
        throw new AppError(404, 'NOT_FOUND', 'Site visit not found');
      }

      // Fetch lead details for notification
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('customer_name, inbound_sales_id')
        .eq('id', leadId)
        .single();

      const updateData: Record<string, any> = { ...req.body, updated_at: new Date().toISOString() };

      if (req.body.visit_status === 'completed' && !existingVisit.completed_at && !req.body.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedVisit, error: updateErr } = await supabaseAdmin
        .from('site_visits')
        .update(updateData)
        .eq('id', visitId)
        .eq('organization_id', orgId)
        .select('*, field_agent:profiles!field_agent_id(id, full_name, email, phone)')
        .single();

      if (updateErr) throw updateErr;

      // Update lead status to site_visit_completed if completed
      if (req.body.visit_status === 'completed') {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'site_visit_completed' })
          .eq('id', leadId);
      }

      // Add timeline activity
      const statusLabel = req.body.visit_status || 'updated';
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: leadId,
        author_id: userId,
        activity_type: 'site_visit',
        outcome: statusLabel.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        notes: req.body.site_observations || `Site visit updated to ${statusLabel}`,
        occurred_at: new Date().toISOString(),
      });

      // Audit log
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: userId,
        action: AUDIT_ACTIONS[1], // update
        entity_type: 'site_visits',
        entity_id: visitId,
        old_values: existingVisit,
        new_values: updatedVisit,
        occurred_at: new Date().toISOString(),
      });

      // Determine change_type for notification
      let changeType: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | null = null;
      if (req.body.visit_status === 'completed') changeType = 'completed';
      else if (req.body.visit_status === 'cancelled') changeType = 'cancelled';
      else if (req.body.scheduled_at && req.body.scheduled_at !== existingVisit.scheduled_at) {
        changeType = 'rescheduled';
      }

      if (changeType) {
        try {
          await notifySiteVisitChange({
            organization_id: orgId,
            visit_id: visitId,
            lead_id: leadId,
            customer_name: lead?.customer_name || 'Customer',
            change_type: changeType,
            scheduled_at: updatedVisit.scheduled_at,
            field_agent_id: updatedVisit.field_agent_id,
            inbound_sales_id: lead?.inbound_sales_id,
            actor_id: userId,
          });
        } catch {
          // non-blocking
        }
      }

      // Synchronize update or cancellation to Google Calendar if event exists
      try {
        const { data: calEvent } = await supabaseAdmin
          .from('calendar_events')
          .select('id, user_id')
          .eq('site_visit_id', visitId)
          .eq('organization_id', orgId)
          .eq('status', 'confirmed')
          .maybeSingle();

        if (calEvent) {
          if (req.body.visit_status === 'cancelled') {
            await updateGoogleCalendarEvent(calEvent.user_id, orgId, calEvent.id, {
              status: 'cancelled',
            });
          } else if (req.body.scheduled_at) {
            const startTime = new Date(req.body.scheduled_at).toISOString();
            const endTime = new Date(new Date(req.body.scheduled_at).getTime() + 60 * 60 * 1000).toISOString();
            await updateGoogleCalendarEvent(calEvent.user_id, orgId, calEvent.id, {
              start_time: startTime,
              end_time: endTime,
            });
          }
        }
      } catch {
        // non-blocking
      }

      res.json({ success: true, data: updatedVisit });
    } catch (err) {
      next(err);
    }
  },
);

