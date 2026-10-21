import { Router, type Request, type Response } from 'express';
import {
  createCompanyBankAccountSchema,
  createCompanyOfficeSchema,
  createDefaultQuoteComponentSchema,
  updateCompanyBankAccountSchema,
  updateCompanyOfficeSchema,
  updateCompanySettingsSchema,
  updateDefaultQuoteComponentSchema,
} from '@solar-crm/shared';

import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

// ─── 1. Company Settings ──────────────────────────────────────────────────────
settingsRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Company settings not found');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch(
  '/',
  requireRole('admin'),
  validate(updateCompanySettingsSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const { data, error } = await supabaseAdmin
        .from('company_settings')
        .update(req.body)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Company settings not found');

      // Audit log
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: req.auth!.userId,
        p_action: 'update',
        p_entity_type: 'company_settings',
        p_entity_id: data.id,
        p_new_values: req.body,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 2. Company Offices (Min 1, Max 6) ────────────────────────────────────────
settingsRouter.get('/offices', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const { data, error } = await supabaseAdmin
      .from('company_offices')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_headquarters', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

settingsRouter.post(
  '/offices',
  requireRole('admin'),
  validate(createCompanyOfficeSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;

      // Enforce maximum 6 office locations
      const { count, error: countErr } = await supabaseAdmin
        .from('company_offices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (countErr) throw countErr;
      if ((count || 0) >= 6) {
        throw new AppError(400, 'MAX_OFFICES_REACHED', 'A maximum of 6 office locations can be configured');
      }

      // If set as headquarters, unset previous headquarters
      if (req.body.is_headquarters) {
        await supabaseAdmin
          .from('company_offices')
          .update({ is_headquarters: false })
          .eq('organization_id', orgId);
      }

      const { data, error } = await supabaseAdmin
        .from('company_offices')
        .insert({
          organization_id: orgId,
          ...req.body,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.patch(
  '/offices/:id',
  requireRole('admin'),
  validate(updateCompanyOfficeSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const officeId = req.params['id'] as string;

      if (req.body.is_headquarters) {
        await supabaseAdmin
          .from('company_offices')
          .update({ is_headquarters: false })
          .eq('organization_id', orgId);
      }

      const { data, error } = await supabaseAdmin
        .from('company_offices')
        .update(req.body)
        .eq('id', officeId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Office location not found');
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.delete(
  '/offices/:id',
  requireRole('admin'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const officeId = req.params['id'] as string;

      // Enforce minimum 1 office location
      const { count, error: countErr } = await supabaseAdmin
        .from('company_offices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (countErr) throw countErr;
      if ((count || 0) <= 1) {
        throw new AppError(400, 'MIN_OFFICES_REQUIRED', 'At least 1 office location must be retained for official quotations');
      }

      const { error } = await supabaseAdmin
        .from('company_offices')
        .delete()
        .eq('id', officeId)
        .eq('organization_id', orgId);

      if (error) throw error;
      res.json({ success: true, message: 'Office location removed successfully' });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 3. Company Bank Accounts (Admin only outside quotation generation) ──────
settingsRouter.get('/bank-accounts', requireRole('admin'), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const { data, error } = await supabaseAdmin
      .from('company_bank_accounts')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

settingsRouter.post(
  '/bank-accounts',
  requireRole('admin'),
  validate(createCompanyBankAccountSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;

      if (req.body.is_primary) {
        await supabaseAdmin
          .from('company_bank_accounts')
          .update({ is_primary: false })
          .eq('organization_id', orgId);
      }

      const { data, error } = await supabaseAdmin
        .from('company_bank_accounts')
        .insert({
          organization_id: orgId,
          ...req.body,
        })
        .select()
        .single();

      if (error) throw error;

      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: req.auth!.userId,
        p_action: 'create',
        p_entity_type: 'company_bank_account',
        p_entity_id: data.id,
      });

      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.patch(
  '/bank-accounts/:id',
  requireRole('admin'),
  validate(updateCompanyBankAccountSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const bankId = req.params['id'] as string;

      if (req.body.is_primary) {
        await supabaseAdmin
          .from('company_bank_accounts')
          .update({ is_primary: false })
          .eq('organization_id', orgId);
      }

      const { data, error } = await supabaseAdmin
        .from('company_bank_accounts')
        .update(req.body)
        .eq('id', bankId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Bank account not found');
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.delete(
  '/bank-accounts/:id',
  requireRole('admin'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const bankId = req.params['id'] as string;

      const { error } = await supabaseAdmin
        .from('company_bank_accounts')
        .delete()
        .eq('id', bankId)
        .eq('organization_id', orgId);

      if (error) throw error;
      res.json({ success: true, message: 'Bank account removed successfully' });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 4. Default Bill of Materials (BOM) Components ───────────────────────────
settingsRouter.get('/bom-components', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const { data, error } = await supabaseAdmin
      .from('default_quote_components')
      .select('*')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

settingsRouter.post(
  '/bom-components',
  requireRole('admin'),
  validate(createDefaultQuoteComponentSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;

      const { data, error } = await supabaseAdmin
        .from('default_quote_components')
        .insert({
          organization_id: orgId,
          ...req.body,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.patch(
  '/bom-components/:id',
  requireRole('admin'),
  validate(updateDefaultQuoteComponentSchema),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const componentId = req.params['id'] as string;

      const { data, error } = await supabaseAdmin
        .from('default_quote_components')
        .update(req.body)
        .eq('id', componentId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Component not found');
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.delete(
  '/bom-components/:id',
  requireRole('admin'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const componentId = req.params['id'] as string;

      const { error } = await supabaseAdmin
        .from('default_quote_components')
        .delete()
        .eq('id', componentId)
        .eq('organization_id', orgId);

      if (error) throw error;
      res.json({ success: true, message: 'Component removed successfully' });
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.post(
  '/bom-components/reorder',
  requireRole('admin'),
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.auth!.organizationId;
      const { items } = req.body as { items: Array<{ id: string; sort_order: number }> };

      if (!Array.isArray(items)) {
        throw new AppError(400, 'BAD_REQUEST', 'Items array required');
      }

      for (const item of items) {
        await supabaseAdmin
          .from('default_quote_components')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
          .eq('organization_id', orgId);
      }

      res.json({ success: true, message: 'Components reordered successfully' });
    } catch (err) {
      next(err);
    }
  },
);
