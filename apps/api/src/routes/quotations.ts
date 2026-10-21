import { Router, type Request, type Response } from 'express';
import {
  createQuotationInputSchema,
  quotationFilterSchema,
  reviseQuotationInputSchema,
  updateQuotationInputSchema,
  updateQuotationStatusSchema,
} from '@solar-crm/shared';

import { AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { calculateQuotationTotals } from '../services/quotation-calc.js';
import { generateQuotationPdf } from '../services/quotation-pdf.js';
import { notifyQuotationStatusChange } from '../services/notification-service.js';

export const quotationsRouter = Router();
quotationsRouter.use(requireAuth);

/**
 * Helper to generate a sequential quotation reference: SUN-YYYYMM-XXXX
 */
async function generateQuotationNumber(orgId: string): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `SUN-${yearMonth}-`;

  const { count, error } = await supabaseAdmin
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .ilike('quotation_number', `${prefix}%`);

  if (error) throw error;
  const seq = ((count || 0) + 1).toString().padStart(4, '0');
  return `${prefix}${seq}`;
}

/**
 * Capture an immutable company snapshot for quotation history preservation
 */
async function captureCompanySnapshot(orgId: string) {
  const [settingsRes, officesRes, bankRes] = await Promise.all([
    supabaseAdmin.from('company_settings').select('*').eq('organization_id', orgId).single(),
    supabaseAdmin.from('company_offices').select('*').eq('organization_id', orgId).order('is_headquarters', { ascending: false }).limit(6),
    supabaseAdmin.from('company_bank_accounts').select('*').eq('organization_id', orgId).eq('is_primary', true).maybeSingle(),
  ]);

  return {
    settings: settingsRes.data || {},
    offices: officesRes.data || [],
    bank_account: bankRes.data || null,
    captured_at: new Date().toISOString(),
  };
}

// ─── 1. GET /quotations — List quotations with filters ────────────────────────
quotationsRouter.get('/', validate(quotationFilterSchema, 'query'), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const { lead_id, status, search, is_latest, page = 1, pageSize = 20 } = req.query as any;

    let query = supabaseAdmin
      .from('quotations')
      .select(
        `
        *,
        lead:leads(id, customer_name, phone, area, city, pincode, status),
        creator:profiles!quotations_created_by_fkey(id, full_name, role)
      `,
        { count: 'exact' },
      )
      .eq('organization_id', orgId);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (status) query = query.eq('status', status);
    if (is_latest !== undefined) query = query.eq('is_latest', is_latest === 'true' || is_latest === true);
    if (search) {
      query = query.or(`quotation_number.ilike.%${search}%,title.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        items: data || [],
        total: count || 0,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. POST /quotations — Create new quotation with server calculations ──────
quotationsRouter.post('/', validate(createQuotationInputSchema), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;
    const userRole = req.auth!.role;

    if (userRole === 'field_agent') {
      throw new AppError(403, 'FORBIDDEN', 'Field agents cannot generate or issue quotations');
    }

    const {
      lead_id,
      title,
      system_capacity_kw,
      phase,
      system_type,
      discount_amount = 0,
      gst_rate = 13.80,
      kseb_charges = 0,
      advance_percentage = 20,
      valid_until,
      payment_terms,
      warranty_terms,
      exclusions,
      notes,
      authorized_signature_name,
      items,
    } = req.body;

    // Verify lead exists and belongs to this organization
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads')
      .select('id, customer_name, status')
      .eq('id', lead_id)
      .eq('organization_id', orgId)
      .single();

    if (leadErr || !lead) {
      throw new AppError(404, 'NOT_FOUND', 'Lead not found in this organization');
    }

    // Authoritative Server-side Calculations
    const calcResult = calculateQuotationTotals({
      items,
      discount_amount,
      gst_rate,
      kseb_charges,
      advance_percentage,
    });

    const quotationNumber = await generateQuotationNumber(orgId);
    const companySnapshot = await captureCompanySnapshot(orgId);

    // Calculate default valid_until (30 days from now) if not supplied
    const quoteValidUntil = valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Insert quotation record
    const { data: quotation, error: quoteErr } = await supabaseAdmin
      .from('quotations')
      .insert({
        organization_id: orgId,
        company_id: orgId,
        lead_id,
        created_by: userId,
        quotation_number: quotationNumber,
        version: 1,
        title: title || `Solar Rooftop ${system_capacity_kw}kWp System`,
        status: 'draft',
        system_capacity_kw,
        phase,
        system_type,
        subtotal: calcResult.subtotal,
        discount_amount: calcResult.discount_amount,
        taxable_value: calcResult.taxable_value,
        gst_rate: calcResult.gst_rate,
        tax_amount: calcResult.tax_amount,
        kseb_charges: calcResult.kseb_charges,
        total_amount: calcResult.total_amount,
        advance_percentage: calcResult.advance_percentage,
        advance_amount: calcResult.advance_amount,
        balance_amount: calcResult.balance_amount,
        valid_until: quoteValidUntil,
        payment_terms,
        warranty_terms,
        exclusions,
        notes,
        authorized_signature_name,
        is_latest: true,
        company_snapshot: companySnapshot,
      })
      .select()
      .single();

    if (quoteErr || !quotation) throw quoteErr;

    // Insert quotation line items
    const lineItemsToInsert = calcResult.items.map((it) => ({
      quotation_id: quotation.id,
      component_name: it.component_name,
      component_type: it.component_type,
      description: it.description,
      specifications: it.specifications,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unit_price,
      total_price: it.total_price,
      sort_order: it.sort_order,
      is_optional: it.is_optional,
      tax_rate: it.tax_rate,
    }));

    const { data: insertedItems, error: itemsErr } = await supabaseAdmin
      .from('quotation_items')
      .insert(lineItemsToInsert)
      .select();

    if (itemsErr) throw itemsErr;

    // Log audit event
    await supabaseAdmin.rpc('log_audit_event', {
      p_organization_id: orgId,
      p_actor_id: userId,
      p_action: 'create',
      p_entity_type: 'quotation',
      p_entity_id: quotation.id,
      p_new_values: {
        quotation_number: quotation.quotation_number,
        total_amount: quotation.total_amount,
        lead_id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...quotation,
        items: insertedItems || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 3. GET /quotations/:id — Fetch single quotation with line items ──────────
quotationsRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const quoteId = req.params['id'] as string;

    const { data: quote, error: quoteErr } = await supabaseAdmin
      .from('quotations')
      .select(
        `
        *,
        lead:leads(id, customer_name, phone, email, address, area, city, pincode, status),
        creator:profiles!quotations_created_by_fkey(id, full_name, email, role),
        items:quotation_items(*)
      `,
      )
      .eq('id', quoteId)
      .eq('organization_id', orgId)
      .single();

    if (quoteErr || !quote) {
      throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
    }

    // Sort items by sort_order
    if (Array.isArray(quote.items)) {
      quote.items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
});

// ─── 4. PATCH /quotations/:id — Update draft quotation ────────────────────────
quotationsRouter.patch('/:id', validate(updateQuotationInputSchema), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;
    const quoteId = req.params['id'] as string;

    // Fetch existing quotation
    const { data: existingQuote, error: fetchErr } = await supabaseAdmin
      .from('quotations')
      .select('*, items:quotation_items(*)')
      .eq('id', quoteId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !existingQuote) {
      throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
    }

    if (existingQuote.status !== 'draft') {
      throw new AppError(
        400,
        'CANNOT_EDIT_ISSUED_QUOTATION',
        `Quotation ${existingQuote.quotation_number} is already in status '${existingQuote.status}'. To modify, create a new revision.`,
      );
    }

    // Merge incoming values with existing values
    const itemsToCalculate = req.body.items || existingQuote.items;
    const discountToCalculate = req.body.discount_amount !== undefined ? req.body.discount_amount : existingQuote.discount_amount;
    const gstRateToCalculate = req.body.gst_rate !== undefined ? req.body.gst_rate : existingQuote.gst_rate;
    const ksebChargesToCalculate = req.body.kseb_charges !== undefined ? req.body.kseb_charges : existingQuote.kseb_charges;
    const advancePctToCalculate = req.body.advance_percentage !== undefined ? req.body.advance_percentage : existingQuote.advance_percentage;

    // Server-side recalculation
    const calcResult = calculateQuotationTotals({
      items: itemsToCalculate,
      discount_amount: discountToCalculate,
      gst_rate: gstRateToCalculate,
      kseb_charges: ksebChargesToCalculate,
      advance_percentage: advancePctToCalculate,
    });

    const updatePayload: Record<string, any> = {
      subtotal: calcResult.subtotal,
      discount_amount: calcResult.discount_amount,
      taxable_value: calcResult.taxable_value,
      gst_rate: calcResult.gst_rate,
      tax_amount: calcResult.tax_amount,
      kseb_charges: calcResult.kseb_charges,
      total_amount: calcResult.total_amount,
      advance_percentage: calcResult.advance_percentage,
      advance_amount: calcResult.advance_amount,
      balance_amount: calcResult.balance_amount,
      updated_at: new Date().toISOString(),
    };

    if (req.body.title !== undefined) updatePayload['title'] = req.body.title;
    if (req.body.system_capacity_kw !== undefined) updatePayload['system_capacity_kw'] = req.body.system_capacity_kw;
    if (req.body.phase !== undefined) updatePayload['phase'] = req.body.phase;
    if (req.body.system_type !== undefined) updatePayload['system_type'] = req.body.system_type;
    if (req.body.valid_until !== undefined) updatePayload['valid_until'] = req.body.valid_until;
    if (req.body.payment_terms !== undefined) updatePayload['payment_terms'] = req.body.payment_terms;
    if (req.body.warranty_terms !== undefined) updatePayload['warranty_terms'] = req.body.warranty_terms;
    if (req.body.exclusions !== undefined) updatePayload['exclusions'] = req.body.exclusions;
    if (req.body.notes !== undefined) updatePayload['notes'] = req.body.notes;
    if (req.body.authorized_signature_name !== undefined) updatePayload['authorized_signature_name'] = req.body.authorized_signature_name;

    const { data: updatedQuote, error: updateErr } = await supabaseAdmin
      .from('quotations')
      .update(updatePayload)
      .eq('id', quoteId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Replace items if new items array was supplied
    let currentItems = existingQuote.items;
    if (req.body.items) {
      await supabaseAdmin.from('quotation_items').delete().eq('quotation_id', quoteId);

      const itemsToInsert = calcResult.items.map((it) => ({
        quotation_id: quoteId,
        component_name: it.component_name,
        component_type: it.component_type,
        description: it.description,
        specifications: it.specifications,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        total_price: it.total_price,
        sort_order: it.sort_order,
        is_optional: it.is_optional,
        tax_rate: it.tax_rate,
      }));

      const { data: newItems, error: newItemsErr } = await supabaseAdmin
        .from('quotation_items')
        .insert(itemsToInsert)
        .select();

      if (newItemsErr) throw newItemsErr;
      currentItems = newItems || [];
    }

    res.json({
      success: true,
      data: {
        ...updatedQuote,
        items: currentItems,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 5. POST /quotations/:id/revise — Create new revision ─────────────────────
quotationsRouter.post('/:id/revise', validate(reviseQuotationInputSchema), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;
    const parentId = req.params['id'] as string;

    // Fetch parent quotation
    const { data: parentQuote, error: parentErr } = await supabaseAdmin
      .from('quotations')
      .select('*, items:quotation_items(*)')
      .eq('id', parentId)
      .eq('organization_id', orgId)
      .single();

    if (parentErr || !parentQuote) {
      throw new AppError(404, 'NOT_FOUND', 'Base quotation to revise not found');
    }

    // Mark parent as revised and no longer latest
    await supabaseAdmin
      .from('quotations')
      .update({
        status: parentQuote.status === 'draft' ? 'draft' : 'revised',
        is_latest: false,
      })
      .eq('id', parentId)
      .eq('organization_id', orgId);

    // Merge changes with parent quote
    const changes = req.body.changes || {};
    const itemsToUse = changes.items || parentQuote.items;
    const discToUse = changes.discount_amount !== undefined ? changes.discount_amount : parentQuote.discount_amount;
    const gstToUse = changes.gst_rate !== undefined ? changes.gst_rate : parentQuote.gst_rate;
    const ksebToUse = changes.kseb_charges !== undefined ? changes.kseb_charges : parentQuote.kseb_charges;
    const advToUse = changes.advance_percentage !== undefined ? changes.advance_percentage : parentQuote.advance_percentage;

    const calcResult = calculateQuotationTotals({
      items: itemsToUse,
      discount_amount: discToUse,
      gst_rate: gstToUse,
      kseb_charges: ksebToUse,
      advance_percentage: advToUse,
    });

    const companySnapshot = await captureCompanySnapshot(orgId);
    const newVersion = parentQuote.version + 1;

    // Create child revision
    const { data: revisedQuote, error: createRevErr } = await supabaseAdmin
      .from('quotations')
      .insert({
        organization_id: orgId,
        company_id: orgId,
        lead_id: parentQuote.lead_id,
        created_by: userId,
        quotation_number: parentQuote.quotation_number,
        version: newVersion,
        title: changes.title || parentQuote.title,
        status: 'draft',
        system_capacity_kw: changes.system_capacity_kw || parentQuote.system_capacity_kw,
        phase: changes.phase || parentQuote.phase,
        system_type: changes.system_type || parentQuote.system_type,
        subtotal: calcResult.subtotal,
        discount_amount: calcResult.discount_amount,
        taxable_value: calcResult.taxable_value,
        gst_rate: calcResult.gst_rate,
        tax_amount: calcResult.tax_amount,
        kseb_charges: calcResult.kseb_charges,
        total_amount: calcResult.total_amount,
        advance_percentage: calcResult.advance_percentage,
        advance_amount: calcResult.advance_amount,
        balance_amount: calcResult.balance_amount,
        valid_until: changes.valid_until || parentQuote.valid_until,
        payment_terms: changes.payment_terms || parentQuote.payment_terms,
        warranty_terms: changes.warranty_terms || parentQuote.warranty_terms,
        exclusions: changes.exclusions || parentQuote.exclusions,
        notes: req.body.notes || changes.notes || parentQuote.notes,
        authorized_signature_name: changes.authorized_signature_name || parentQuote.authorized_signature_name,
        parent_quotation_id: parentId,
        is_latest: true,
        company_snapshot: companySnapshot,
      })
      .select()
      .single();

    if (createRevErr || !revisedQuote) throw createRevErr;

    // Insert items for revised quotation
    const itemsToInsert = calcResult.items.map((it) => ({
      quotation_id: revisedQuote.id,
      component_name: it.component_name,
      component_type: it.component_type,
      description: it.description,
      specifications: it.specifications,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unit_price,
      total_price: it.total_price,
      sort_order: it.sort_order,
      is_optional: it.is_optional,
      tax_rate: it.tax_rate,
    }));

    const { data: newItems, error: itemsErr } = await supabaseAdmin
      .from('quotation_items')
      .insert(itemsToInsert)
      .select();

    if (itemsErr) throw itemsErr;

    // Audit log
    await supabaseAdmin.rpc('log_audit_event', {
      p_organization_id: orgId,
      p_actor_id: userId,
      p_action: 'create',
      p_entity_type: 'quotation_revision',
      p_entity_id: revisedQuote.id,
      p_new_values: {
        quotation_number: revisedQuote.quotation_number,
        version: newVersion,
        parent_id: parentId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...revisedQuote,
        items: newItems || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 6. POST /quotations/:id/status — Update quotation lifecycle status ───────
quotationsRouter.post('/:id/status', validate(updateQuotationStatusSchema), async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const userId = req.auth!.userId;
    const quoteId = req.params['id'] as string;
    const { status, notes } = req.body;

    const { data: existingQuote, error: fetchErr } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('id', quoteId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !existingQuote) {
      throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
    }

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // If issuing quotation, freeze company snapshot to prevent silent drift
    if (status === 'issued' && (!existingQuote.company_snapshot || Object.keys(existingQuote.company_snapshot).length === 0)) {
      updatePayload['company_snapshot'] = await captureCompanySnapshot(orgId);
    }

    const { data: updatedQuote, error: updateErr } = await supabaseAdmin
      .from('quotations')
      .update(updatePayload)
      .eq('id', quoteId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // If marked sent, update lead status to quotation_sent if lead was earlier
    if (status === 'sent') {
      const { data: currentLead } = await supabaseAdmin
        .from('leads')
        .select('status')
        .eq('id', existingQuote.lead_id)
        .single();

      if (currentLead && ['new', 'fresh', 'contacted', 'qualified', 'follow_up', 'site_visit_scheduled', 'site_visit_completed'].includes(currentLead.status)) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'quotation_sent' })
          .eq('id', existingQuote.lead_id);
      }
    }

    // Audit log
    await supabaseAdmin.rpc('log_audit_event', {
      p_organization_id: orgId,
      p_actor_id: userId,
      p_action: 'status_change',
      p_entity_type: 'quotation',
      p_entity_id: quoteId,
      p_old_values: { status: existingQuote.status },
      p_new_values: { status, notes },
    });

    // Notify assigned team members asynchronously
    try {
      const { data: leadData } = await supabaseAdmin
        .from('leads')
        .select('customer_name, assigned_sales_id, assigned_field_agent_id')
        .eq('id', existingQuote.lead_id)
        .single();

      await notifyQuotationStatusChange({
        organization_id: orgId,
        quotation_id: quoteId,
        quote_number: existingQuote.quotation_number,
        customer_name: leadData?.customer_name || 'Customer',
        new_status: status,
        actor_id: userId,
        assigned_sales_id: leadData?.assigned_sales_id,
        assigned_agent_id: leadData?.assigned_field_agent_id,
        grand_total: existingQuote.total_amount,
      });
    } catch {
      // Non-blocking for client response
    }

    res.json({ success: true, data: updatedQuote });
  } catch (err) {
    next(err);
  }
});

// ─── 7. GET /quotations/:id/pdf — Generate professional A4 PDF stream ────────
quotationsRouter.get('/:id/pdf', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const quoteId = req.params['id'] as string;

    // Fetch quotation with items, lead, snapshot
    const { data: quote, error: quoteErr } = await supabaseAdmin
      .from('quotations')
      .select(
        `
        *,
        lead:leads(customer_name, phone, email, address, area, pincode),
        items:quotation_items(*)
      `,
      )
      .eq('id', quoteId)
      .eq('organization_id', orgId)
      .single();

    if (quoteErr || !quote) {
      throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
    }

    // Prefer company snapshot if available (preserves exact historical state)
    const snapshot = quote.company_snapshot || {};
    let companySettings = snapshot.settings;
    let companyOffices = snapshot.offices;
    let companyBank = snapshot.bank_account;

    // Fallback to active settings if snapshot is empty (e.g. initial draft)
    if (!companySettings || Object.keys(companySettings).length === 0) {
      const [cSet, cOff, cBank] = await Promise.all([
        supabaseAdmin.from('company_settings').select('*').eq('organization_id', orgId).single(),
        supabaseAdmin.from('company_offices').select('*').eq('organization_id', orgId).limit(6),
        supabaseAdmin.from('company_bank_accounts').select('*').eq('organization_id', orgId).eq('is_primary', true).maybeSingle(),
      ]);
      companySettings = cSet.data || {};
      companyOffices = cOff.data || [];
      companyBank = cBank.data || null;
    }

    const pdfBuffer = await generateQuotationPdf({
      quotation: {
        id: quote.id,
        quotation_number: quote.quotation_number,
        version: quote.version,
        title: quote.title,
        status: quote.status,
        system_capacity_kw: Number(quote.system_capacity_kw || 0),
        phase: quote.phase,
        system_type: quote.system_type,
        subtotal: Number(quote.subtotal || 0),
        discount_amount: Number(quote.discount_amount || 0),
        taxable_value: Number(quote.taxable_value || 0),
        gst_rate: Number(quote.gst_rate || 13.8),
        tax_amount: Number(quote.tax_amount || 0),
        kseb_charges: Number(quote.kseb_charges || 0),
        total_amount: Number(quote.total_amount || 0),
        advance_percentage: Number(quote.advance_percentage || 20),
        advance_amount: Number(quote.advance_amount || 0),
        balance_amount: Number(quote.balance_amount || 0),
        valid_until: quote.valid_until,
        payment_terms: quote.payment_terms,
        warranty_terms: quote.warranty_terms,
        exclusions: quote.exclusions,
        notes: quote.notes,
        authorized_signature_name: quote.authorized_signature_name,
        created_at: quote.created_at,
      },
      items: (quote.items || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
      lead: quote.lead || { customer_name: 'Customer', phone: '' },
      company: companySettings,
      offices: companyOffices || [],
      bankAccount: companyBank,
    });

    const filename = `Quotation_${quote.quotation_number}_v${quote.version}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
