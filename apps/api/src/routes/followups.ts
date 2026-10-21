import { Router } from 'express';
import type { Request, Response } from 'express';

import {
  completeFollowUpSchema,
  createFollowUpSchema,
  followUpFilterSchema,
  rescheduleFollowUpSchema,
  updateFollowUpSchema,
} from '@solar-crm/shared';

import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from '../services/google-calendar.js';

export const followUpsRouter = Router();

// All follow-up endpoints require authentication
followUpsRouter.use(requireAuth);

// ─── 1. GET /follow-ups — List with Tab Counts & Role Scoping ─────────────────
followUpsRouter.get(
  '/',
  validate(followUpFilterSchema, 'query'),
  async (req: Request, res: Response, next) => {
    try {
      const {
        tab = 'all',
        status,
        assigned_to,
        lead_id,
        temperature,
        search,
        from,
        to,
        page = '1',
        pageSize = '25',
      } = req.query as Record<string, string>;

      const orgId = req.auth!.organizationId;
      const userRole = req.auth!.role;
      const userId = req.auth!.userId;

      const now = new Date();
      const nowIso = now.toISOString();

      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayIso = startOfToday.toISOString();

      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      const endOfTodayIso = endOfToday.toISOString();

      // Base query
      let query = supabaseAdmin
        .from('follow_ups')
        .select(
          `*,
           lead:leads!lead_id(id, customer_name, phone, email, status, temperature, area, pincode, address, assigned_field_agent_id, inbound_sales_id),
           assignee:profiles!assigned_to(id, full_name, email, role),
           creator:profiles!created_by(id, full_name)`,
          { count: 'exact' },
        )
        .eq('organization_id', orgId);

      // Role Scoping: Field Agents only see follow-ups assigned to them or on leads assigned to them
      if (userRole === 'field_agent') {
        query = query.or(`assigned_to.eq.${userId}`);
      }

      // Filter by Tab
      if (tab === 'overdue') {
        query = query.eq('completion_status', 'pending').lt('due_at', nowIso);
      } else if (tab === 'due_today') {
        query = query
          .eq('completion_status', 'pending')
          .gte('due_at', startOfTodayIso)
          .lte('due_at', endOfTodayIso);
      } else if (tab === 'upcoming') {
        query = query.eq('completion_status', 'pending').gt('due_at', endOfTodayIso);
      } else if (tab === 'completed') {
        query = query.eq('completion_status', 'completed');
      } else if (tab === 'cancelled') {
        query = query.eq('completion_status', 'cancelled');
      }

      // Filter by Status (if provided and tab is 'all')
      if (status && status !== 'all' && tab === 'all') {
        if (status === 'overdue') {
          query = query.eq('completion_status', 'pending').lt('due_at', nowIso);
        } else {
          query = query.eq('completion_status', status);
        }
      }

      // Explicit Filters
      if (assigned_to) query = query.eq('assigned_to', assigned_to);
      if (lead_id) query = query.eq('lead_id', lead_id);
      if (from) query = query.gte('due_at', from);
      if (to) query = query.lte('due_at', to);

      // Search across notes or lead name
      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(`notes.ilike.%${s}%`);
      }

      // Order by due date: overdue/today first, completed descending
      if (tab === 'completed' || tab === 'cancelled') {
        query = query.order('updated_at', { ascending: false });
      } else {
        query = query.order('due_at', { ascending: true });
      }

      // Pagination
      const pageNum = Math.max(1, parseInt(page, 10));
      const size = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
      query = query.range((pageNum - 1) * size, pageNum * size - 1);

      const { data: items, count, error } = await query;
      if (error) throw error;

      // Filter by lead temperature if specified (post-fetch filter if relations)
      let filteredItems = items ?? [];
      if (temperature) {
        filteredItems = filteredItems.filter((f: any) => f.lead?.temperature === temperature);
      }

      // Tab Counts Query for Badges
      let countQuery = supabaseAdmin
        .from('follow_ups')
        .select('id, due_at, completion_status')
        .eq('organization_id', orgId);

      if (userRole === 'field_agent') {
        countQuery = countQuery.eq('assigned_to', userId);
      }

      const { data: allFollowUps } = await countQuery;
      const all = allFollowUps ?? [];

      const overdueCount = all.filter(
        (f) => f.completion_status === 'pending' && new Date(f.due_at) < now,
      ).length;

      const todayCount = all.filter(
        (f) =>
          f.completion_status === 'pending' &&
          new Date(f.due_at) >= startOfToday &&
          new Date(f.due_at) <= endOfToday,
      ).length;

      const upcomingCount = all.filter(
        (f) => f.completion_status === 'pending' && new Date(f.due_at) > endOfToday,
      ).length;

      const completedCount = all.filter((f) => f.completion_status === 'completed').length;
      const cancelledCount = all.filter((f) => f.completion_status === 'cancelled').length;

      res.json({
        success: true,
        data: {
          items: filteredItems.map((item: any) => ({
            ...item,
            is_overdue: item.completion_status === 'pending' && new Date(item.due_at) < now,
          })),
          total: count ?? 0,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil((count ?? 0) / size),
          counts: {
            overdue: overdueCount,
            dueToday: todayCount,
            upcoming: upcomingCount,
            completed: completedCount,
            cancelled: cancelledCount,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 2. POST /follow-ups — Create Follow-up ───────────────────────────────────
followUpsRouter.post('/', validate(createFollowUpSchema), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;
    const { lead_id, due_at, notes, assigned_to } = req.body;

    const targetAssignee = assigned_to || userId;

    // Verify assigned user is active and exists in organization
    const { data: assigneeProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, account_status, is_active, full_name')
      .eq('id', targetAssignee)
      .eq('organization_id', orgId)
      .single();

    if (profileErr || !assigneeProfile) {
      throw new AppError(400, 'INVALID_ASSIGNEE', 'Assignee must be an active member of your organization.');
    }

    if (assigneeProfile.account_status !== 'active' || assigneeProfile.is_active === false) {
      throw new AppError(400, 'INACTIVE_ASSIGNEE', 'Cannot assign follow-up to an inactive account.');
    }

    // Insert follow-up
    const { data: followUp, error: fuErr } = await supabaseAdmin
      .from('follow_ups')
      .insert({
        organization_id: orgId,
        lead_id,
        assigned_to: targetAssignee,
        due_at,
        notes: notes ?? null,
        reminder_status: 'pending',
        completion_status: 'pending',
        created_by: userId,
      })
      .select('*, lead:leads!lead_id(id, customer_name, phone), assignee:profiles!assigned_to(id, full_name)')
      .single();

    if (fuErr) throw fuErr;

    // Update next_follow_up_at on lead
    await supabaseAdmin
      .from('leads')
      .update({ next_follow_up_at: due_at })
      .eq('id', lead_id)
      .eq('organization_id', orgId);

    // Record activity
    const formattedDate = new Date(due_at).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await supabaseAdmin.from('lead_activities').insert({
      organization_id: orgId,
      lead_id,
      author_id: userId,
      activity_type: 'note',
      outcome: 'Follow-up Scheduled',
      follow_up_id: followUp.id,
      notes: `Follow-up scheduled for ${formattedDate} (Assigned to: ${assigneeProfile.full_name})${
        notes ? `: "${notes}"` : ''
      }`,
      occurred_at: new Date().toISOString(),
    });

    // Automatically synchronize to Google Calendar if assignee has active integration
    try {
      const { data: calIntegration } = await supabaseAdmin
        .from('calendar_integrations')
        .select('id, sync_status, sync_enabled')
        .eq('user_id', targetAssignee)
        .eq('organization_id', orgId)
        .eq('provider', 'google')
        .eq('sync_status', 'active')
        .eq('sync_enabled', true)
        .maybeSingle();

      if (calIntegration) {
        const startTime = new Date(due_at).toISOString();
        const endTime = new Date(new Date(due_at).getTime() + 30 * 60 * 1000).toISOString();
        await createGoogleCalendarEvent(targetAssignee, orgId, {
          lead_id,
          follow_up_id: followUp.id,
          title: `Follow-up: ${followUp.lead?.customer_name || 'Customer'}`,
          description: notes || 'Scheduled follow-up reminder',
          start_time: startTime,
          end_time: endTime,
        });
      }
    } catch {
      // Non-blocking for follow-up creation
    }

    res.status(201).json({ success: true, data: followUp });
  } catch (err) {
    next(err);
  }
});

// ─── 3. POST /follow-ups/:id/reschedule — Reschedule Follow-up ─────────────────
followUpsRouter.post(
  '/:id/reschedule',
  validate(rescheduleFollowUpSchema),
  async (req: Request, res: Response, next) => {
    try {
      const followUpId = req.params['id'];
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const { due_at, reason, notes } = req.body;

      // Fetch existing
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('follow_ups')
        .select('*, lead:leads!lead_id(id, customer_name)')
        .eq('id', followUpId)
        .eq('organization_id', orgId)
        .single();

      if (fetchErr || !existing) {
        throw new AppError(404, 'NOT_FOUND', 'Follow-up not found');
      }

      const oldDueFormatted = new Date(existing.due_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const newDueFormatted = new Date(due_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      // Update follow-up record
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('follow_ups')
        .update({
          due_at,
          reminder_status: 'pending', // Reset reminder to prevent duplicates and ensure timely ping
          rescheduled_count: (existing.rescheduled_count ?? 0) + 1,
          last_rescheduled_at: new Date().toISOString(),
          reschedule_reason: reason,
          notes: notes !== undefined ? notes : existing.notes,
        })
        .eq('id', followUpId)
        .eq('organization_id', orgId)
        .select('*, assignee:profiles!assigned_to(id, full_name)')
        .single();

      if (updateErr) throw updateErr;

      // Synchronize lead next_follow_up_at
      await supabaseAdmin
        .from('leads')
        .update({ next_follow_up_at: due_at })
        .eq('id', existing.lead_id)
        .eq('organization_id', orgId);

      // Record in Activity Timeline
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: existing.lead_id,
        author_id: userId,
        activity_type: 'note',
        outcome: 'Rescheduled',
        follow_up_id: followUpId,
        notes: `Follow-up rescheduled from ${oldDueFormatted} to ${newDueFormatted}. Reason: ${reason}${
          notes ? ` (Note: ${notes})` : ''
        }`,
        occurred_at: new Date().toISOString(),
      });

      // Synchronize update to Google Calendar if confirmed event exists
      try {
        const { data: calEvent } = await supabaseAdmin
          .from('calendar_events')
          .select('id, user_id')
          .eq('follow_up_id', followUpId)
          .eq('organization_id', orgId)
          .eq('status', 'confirmed')
          .maybeSingle();

        if (calEvent) {
          const startTime = new Date(due_at).toISOString();
          const endTime = new Date(new Date(due_at).getTime() + 30 * 60 * 1000).toISOString();
          await updateGoogleCalendarEvent(calEvent.user_id, orgId, calEvent.id, {
            start_time: startTime,
            end_time: endTime,
          });
        }
      } catch {
        // Non-blocking for reschedule
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 4. POST /follow-ups/:id/complete — Complete Follow-up ────────────────────
followUpsRouter.post(
  '/:id/complete',
  validate(completeFollowUpSchema),
  async (req: Request, res: Response, next) => {
    try {
      const followUpId = req.params['id'];
      const orgId = req.auth!.organizationId;
      const userId = req.auth!.userId;
      const { notes, outcome } = req.body;

      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('follow_ups')
        .select('*')
        .eq('id', followUpId)
        .eq('organization_id', orgId)
        .single();

      if (fetchErr || !existing) {
        throw new AppError(404, 'NOT_FOUND', 'Follow-up not found');
      }

      // Mark completed
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('follow_ups')
        .update({
          completion_status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes ? `${existing.notes ? `${existing.notes}\n` : ''}[Completion note]: ${notes}` : existing.notes,
        })
        .eq('id', followUpId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Recalculate next pending follow-up on this lead
      const { data: nextFollowUps } = await supabaseAdmin
        .from('follow_ups')
        .select('due_at')
        .eq('lead_id', existing.lead_id)
        .eq('completion_status', 'pending')
        .order('due_at', { ascending: true })
        .limit(1);

      const nextDueAt =
        nextFollowUps && nextFollowUps.length > 0 ? nextFollowUps[0]?.due_at ?? null : null;

      await supabaseAdmin
        .from('leads')
        .update({ next_follow_up_at: nextDueAt })
        .eq('id', existing.lead_id)
        .eq('organization_id', orgId);

      // Record activity
      await supabaseAdmin.from('lead_activities').insert({
        organization_id: orgId,
        lead_id: existing.lead_id,
        author_id: userId,
        activity_type: 'note',
        outcome: outcome || 'Follow-up Completed',
        follow_up_id: followUpId,
        notes: `Follow-up completed${notes ? `: ${notes}` : ''}`,
        occurred_at: new Date().toISOString(),
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 5. POST /follow-ups/:id/cancel — Cancel Follow-up ────────────────────────
followUpsRouter.post('/:id/cancel', async (req: Request, res: Response, next) => {
  try {
    const followUpId = req.params['id'];
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('follow_ups')
      .select('*')
      .eq('id', followUpId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !existing) {
      throw new AppError(404, 'NOT_FOUND', 'Follow-up not found');
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('follow_ups')
      .update({
        completion_status: 'cancelled',
      })
      .eq('id', followUpId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Recalculate next pending follow-up on this lead
    const { data: nextFollowUps } = await supabaseAdmin
      .from('follow_ups')
      .select('due_at')
      .eq('lead_id', existing.lead_id)
      .eq('completion_status', 'pending')
      .order('due_at', { ascending: true })
      .limit(1);

    const nextDueAt =
      nextFollowUps && nextFollowUps.length > 0 ? nextFollowUps[0]?.due_at ?? null : null;

    await supabaseAdmin
      .from('leads')
      .update({ next_follow_up_at: nextDueAt })
      .eq('id', existing.lead_id)
      .eq('organization_id', orgId);

    // Record activity
    await supabaseAdmin.from('lead_activities').insert({
      organization_id: orgId,
      lead_id: existing.lead_id,
      author_id: userId,
      activity_type: 'note',
      outcome: 'Follow-up Cancelled',
      follow_up_id: followUpId,
      notes: 'Follow-up task was cancelled.',
      occurred_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
