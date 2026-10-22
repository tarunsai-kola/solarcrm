import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { notifyQuotationStatusChange } from '../services/notification-service.js';

export const publicProposalRouter = Router();

/**
 * 1. GET /public/proposals/:id — Public view for prospective customer
 * Accessible without session token authentication.
 */
publicProposalRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const quoteId = req.params['id'] as string;

    const { data: quote, error: quoteErr } = await supabaseAdmin
      .from('quotations')
      .select(
        `
        *,
        lead:leads(id, customer_name, phone, email, address, area, city, pincode),
        creator:profiles!quotations_created_by_fkey(id, full_name, email),
        items:quotation_items(*)
      `,
      )
      .eq('id', quoteId)
      .maybeSingle();

    if (quoteErr) {
      throw new AppError(500, 'DB_ERROR', 'Failed to fetch proposal details');
    }

    if (!quote) {
      // If not in database (e.g. sample or mock quote), return 404
      throw new AppError(404, 'NOT_FOUND', 'Solar Proposal not found or link expired');
    }

    if (Array.isArray(quote.items)) {
      quote.items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. POST /public/proposals/:id/accept — Digital E-Signature acceptance by customer
 */
publicProposalRouter.post('/:id/accept', async (req: Request, res: Response, next) => {
  try {
    const quoteId = req.params['id'] as string;
    const { signerName, signerPhone, signerDesignation, signatureType, signatureData, termsAccepted, notes } = req.body;

    if (!signerName || !signatureData || !termsAccepted) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Missing required e-signature parameters or terms acceptance');
    }

    const { data: existingQuote, error: fetchErr } = await supabaseAdmin
      .from('quotations')
      .select('*, lead:leads(*)')
      .eq('id', quoteId)
      .maybeSingle();

    if (fetchErr || !existingQuote) {
      throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
    }

    const now = new Date().toISOString();
    const verificationHash = `KOLA-VERIFY-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const signatureRecord = {
      signer_name: signerName.trim(),
      signer_phone: signerPhone?.trim() || '',
      signer_designation: signerDesignation?.trim() || 'Property Owner',
      signature_type: signatureType || 'drawn',
      signature_data: signatureData,
      signed_at: now,
      verification_hash: verificationHash,
      ip_stamp: req.ip || 'Customer Direct Portal',
    };

    const combinedNotes = notes
      ? `${existingQuote.notes || ''}\n[DIGITAL SIGNATURE ACCEPTANCE]: ${notes}`
      : existingQuote.notes;

    const { data: updatedQuote, error: updateErr } = await supabaseAdmin
      .from('quotations')
      .update({
        status: 'accepted',
        accepted_at: now,
        notes: combinedNotes,
        updated_at: now,
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateErr) {
      throw new AppError(500, 'DB_ERROR', 'Failed to record digital acceptance');
    }

    // Trigger notification to sales team
    try {
      await notifyQuotationStatusChange({
        organization_id: existingQuote.organization_id,
        quotation_id: quoteId,
        quote_number: existingQuote.quotation_number,
        customer_name: existingQuote.lead?.customer_name || signerName,
        new_status: 'accepted',
        actor_id: existingQuote.created_by,
        assigned_sales_id: existingQuote.lead?.assigned_sales_id,
        assigned_agent_id: existingQuote.lead?.assigned_field_agent_id,
        grand_total: existingQuote.total_amount,
      });
    } catch {
      // non-fatal
    }

    res.json({
      success: true,
      data: {
        ...updatedQuote,
        signature: signatureRecord,
        verificationHash,
      },
      message: 'Proposal successfully signed and confirmed!',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /public/proposals/:id/request-revision — Customer requested modifications
 */
publicProposalRouter.post('/:id/request-revision', async (req: Request, res: Response, next) => {
  try {
    const quoteId = req.params['id'] as string;
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Please provide notes describing your revision request');
    }

    const { data: existingQuote, error: fetchErr } = await supabaseAdmin
      .from('quotations')
      .select('*, lead:leads(*)')
      .eq('id', quoteId)
      .maybeSingle();

    if (fetchErr || !existingQuote) {
      throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
    }

    const now = new Date().toISOString();
    const updatedNotes = `${existingQuote.notes || ''}\n[REVISION REQUESTED by Customer on ${new Date().toLocaleDateString('en-IN')}]: ${notes}`;

    const { data: updatedQuote, error: updateErr } = await supabaseAdmin
      .from('quotations')
      .update({
        status: 'revised',
        notes: updatedNotes,
        updated_at: now,
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateErr) {
      throw new AppError(500, 'DB_ERROR', 'Failed to save revision request');
    }

    // Notify sales agent
    try {
      await notifyQuotationStatusChange({
        organization_id: existingQuote.organization_id,
        quotation_id: quoteId,
        quote_number: existingQuote.quotation_number,
        customer_name: existingQuote.lead?.customer_name || 'Customer',
        new_status: 'revised',
        actor_id: existingQuote.created_by,
        assigned_sales_id: existingQuote.lead?.assigned_sales_id,
        grand_total: existingQuote.total_amount,
      });
    } catch {
      // non-fatal
    }

    res.json({
      success: true,
      data: updatedQuote,
      message: 'Revision request forwarded to your dedicated solar consultant.',
    });
  } catch (err) {
    next(err);
  }
});
