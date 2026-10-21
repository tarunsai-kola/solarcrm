import { Router, type Request, type Response } from 'express';
import { updateCrmConfigSchema } from '@solar-crm/shared';
import type { CrmConfig } from '@solar-crm/shared';

import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const crmConfigRouter = Router();
crmConfigRouter.use(requireAuth);

export const DEFAULT_CRM_CONFIG: CrmConfig = {
  lead_statuses: [
    { id: 'new', label: 'Fresh', is_active: true, is_system: true, color: 'blue', sort_order: 1 },
    { id: 'contacted', label: 'Contacted', is_active: true, is_system: true, color: 'cyan', sort_order: 2 },
    { id: 'qualified', label: 'Qualified', is_active: true, is_system: true, color: 'purple', sort_order: 3 },
    { id: 'follow_up', label: 'Follow-up', is_active: true, is_system: true, color: 'indigo', sort_order: 4 },
    { id: 'site_visit_scheduled', label: 'Site Visit Scheduled', is_active: true, is_system: true, color: 'amber', sort_order: 5 },
    { id: 'site_visit_completed', label: 'Site Visit Completed', is_active: true, is_system: true, color: 'yellow', sort_order: 6 },
    { id: 'quotation_prepared', label: 'Quotation Prepared', is_active: true, is_system: true, color: 'violet', sort_order: 7 },
    { id: 'quotation_sent', label: 'Quotation Sent', is_active: true, is_system: true, color: 'pink', sort_order: 8 },
    { id: 'negotiation', label: 'Negotiation', is_active: true, is_system: true, color: 'orange', sort_order: 9 },
    { id: 'won', label: 'Won', is_active: true, is_system: true, color: 'emerald', sort_order: 10 },
    { id: 'lost', label: 'Lost', is_active: true, is_system: true, color: 'rose', sort_order: 11 },
    { id: 'not_interested', label: 'Not Interested', is_active: true, is_system: true, color: 'slate', sort_order: 12 },
    { id: 'disqualified', label: 'Disqualified', is_active: true, is_system: true, color: 'zinc', sort_order: 13 },
  ],
  enquiry_types: [
    { id: 'residential', label: 'Residential Rooftop', is_active: true, sort_order: 1 },
    { id: 'commercial', label: 'Commercial & Institutional', is_active: true, sort_order: 2 },
    { id: 'industrial', label: 'Industrial Solar', is_active: true, sort_order: 3 },
    { id: 'agricultural', label: 'Agricultural / Solar Pump', is_active: true, sort_order: 4 },
    { id: 'housing_society', label: 'Housing Society / Apartment', is_active: true, sort_order: 5 },
    { id: 'other', label: 'Other', is_active: true, sort_order: 6 },
  ],
  lead_sources: [
    { id: 'Meta Ads', name: 'Meta Ads', is_active: true, is_campaign: true },
    { id: 'Tata Solar', name: 'Tata Solar', is_active: true, is_campaign: true },
    { id: 'JustDial', name: 'JustDial', is_active: true, is_campaign: false },
    { id: 'Website', name: 'Website Inquiry', is_active: true, is_campaign: false },
    { id: 'Referral', name: 'Customer Referral', is_active: true, is_campaign: false },
    { id: 'Cold Call', name: 'Cold Outreach', is_active: true, is_campaign: false },
    { id: 'Other', name: 'Other', is_active: true, is_campaign: false },
  ],
  assignment_rules: {
    mode: 'pincode_match',
    auto_assign: true,
    fallback_to_round_robin: true,
    max_workload_cap: 15,
    reassign_uncontacted_after_hours: 24,
  },
  reminder_preferences: {
    lead_times_minutes: [15, 60, 1440],
    daily_digest_time: '09:00',
    enable_email: true,
    enable_in_app: true,
    enable_whatsapp: true,
    overdue_escalation_hours: 24,
  },
};

// ─── 1. GET /crm-config ───────────────────────────────────────────────────────
crmConfigRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .select('custom_lead_statuses, custom_enquiry_types, lead_sources, assignment_rules, reminder_preferences')
      .eq('organization_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // If table doesn't have columns yet or error, fallback to defaults
      return res.json({ success: true, data: DEFAULT_CRM_CONFIG });
    }

    const config: CrmConfig = {
      lead_statuses: Array.isArray(data?.custom_lead_statuses) && data.custom_lead_statuses.length > 0
        ? data.custom_lead_statuses
        : DEFAULT_CRM_CONFIG.lead_statuses,
      enquiry_types: Array.isArray(data?.custom_enquiry_types) && data.custom_enquiry_types.length > 0
        ? (typeof data.custom_enquiry_types[0] === 'string'
            ? (data.custom_enquiry_types as string[]).map((t, idx) => ({ id: t, label: t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()), is_active: true, sort_order: idx + 1 }))
            : data.custom_enquiry_types)
        : DEFAULT_CRM_CONFIG.enquiry_types,
      lead_sources: Array.isArray(data?.lead_sources) && data.lead_sources.length > 0
        ? (typeof data.lead_sources[0] === 'string'
            ? (data.lead_sources as string[]).map((s) => ({ id: s, name: s, is_active: true, is_campaign: s.toLowerCase().includes('ads') || s.toLowerCase().includes('tata') }))
            : data.lead_sources)
        : DEFAULT_CRM_CONFIG.lead_sources,
      assignment_rules: data?.assignment_rules && typeof data.assignment_rules === 'object'
        ? { ...DEFAULT_CRM_CONFIG.assignment_rules, ...data.assignment_rules }
        : DEFAULT_CRM_CONFIG.assignment_rules,
      reminder_preferences: data?.reminder_preferences && typeof data.reminder_preferences === 'object'
        ? { ...DEFAULT_CRM_CONFIG.reminder_preferences, ...data.reminder_preferences }
        : DEFAULT_CRM_CONFIG.reminder_preferences,
    };

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

// ─── 2. PATCH /crm-config (Admin only) ────────────────────────────────────────
crmConfigRouter.patch(
  '/',
  requireRole('admin'),
  validate(updateCrmConfigSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const actorId = req.auth!.userId;
      const updates = req.body;

      const payload: Record<string, unknown> = {};
      if (updates.lead_statuses !== undefined) payload['custom_lead_statuses'] = updates.lead_statuses;
      if (updates.enquiry_types !== undefined) payload['custom_enquiry_types'] = updates.enquiry_types;
      if (updates.lead_sources !== undefined) payload['lead_sources'] = updates.lead_sources;
      if (updates.assignment_rules !== undefined) payload['assignment_rules'] = updates.assignment_rules;
      if (updates.reminder_preferences !== undefined) payload['reminder_preferences'] = updates.reminder_preferences;

      const { data, error } = await supabaseAdmin
        .from('company_settings')
        .update(payload)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        throw new AppError(500, 'UPDATE_FAILED', error.message);
      }

      // Record audit log event for CRM controls configuration update
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: actorId,
        p_action: 'update',
        p_entity_type: 'crm_controls',
        p_entity_id: data.id,
        p_new_values: updates,
      });

      res.json({
        success: true,
        message: 'CRM configuration updated successfully',
        data: {
          lead_statuses: data.custom_lead_statuses ?? updates.lead_statuses ?? DEFAULT_CRM_CONFIG.lead_statuses,
          enquiry_types: data.custom_enquiry_types ?? updates.enquiry_types ?? DEFAULT_CRM_CONFIG.enquiry_types,
          lead_sources: data.lead_sources ?? updates.lead_sources ?? DEFAULT_CRM_CONFIG.lead_sources,
          assignment_rules: data.assignment_rules ?? updates.assignment_rules ?? DEFAULT_CRM_CONFIG.assignment_rules,
          reminder_preferences: data.reminder_preferences ?? updates.reminder_preferences ?? DEFAULT_CRM_CONFIG.reminder_preferences,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 3. POST /crm-config/reset (Admin only) ───────────────────────────────────
crmConfigRouter.post(
  '/reset',
  requireRole('admin'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const actorId = req.auth!.userId;

      const { data, error } = await supabaseAdmin
        .from('company_settings')
        .update({
          custom_lead_statuses: DEFAULT_CRM_CONFIG.lead_statuses,
          custom_enquiry_types: DEFAULT_CRM_CONFIG.enquiry_types,
          lead_sources: DEFAULT_CRM_CONFIG.lead_sources,
          assignment_rules: DEFAULT_CRM_CONFIG.assignment_rules,
          reminder_preferences: DEFAULT_CRM_CONFIG.reminder_preferences,
        })
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        throw new AppError(500, 'RESET_FAILED', error.message);
      }

      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: actorId,
        p_action: 'update',
        p_entity_type: 'crm_controls_reset',
        p_entity_id: data.id,
        p_new_values: { reset_to_defaults: true },
      });

      res.json({
        success: true,
        message: 'CRM configuration reset to defaults',
        data: DEFAULT_CRM_CONFIG,
      });
    } catch (err) {
      next(err);
    }
  },
);
