import { Router } from 'express';
import type { Request, Response } from 'express';

import { auditLogFilterSchema } from '@solar-crm/shared';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const auditRouter = Router();
auditRouter.use(requireAuth, requireRole('admin'));

/**
 * Deep redaction helper to sanitize passwords, tokens, API keys and bank account secrets
 */
function redactSecrets(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSecrets);

  const sensitivePattern = /password|secret|token|api_key|hash|private_key/i;
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (sensitivePattern.test(key)) {
      result[key] = '[REDACTED]';
    } else if (
      key.toLowerCase().includes('account_number') &&
      typeof val === 'string' &&
      val.length > 4
    ) {
      result[key] = `••••••••${val.slice(-4)}`;
    } else if (typeof val === 'object' && val !== null) {
      result[key] = redactSecrets(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// GET /audit — admin only
auditRouter.get('/', validate(auditLogFilterSchema, 'query'), async (req: Request, res: Response, next) => {
  try {
    const { page, pageSize, actor_id, action, entity_type, resource_type, from, to } =
      req.query as Record<string, string>;
    const pageNum = parseInt(page ?? '1');
    const size = parseInt(pageSize ?? '25');

    const targetEntityType = entity_type || resource_type;

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*, actor:profiles!actor_id(id, full_name, role, email)', { count: 'exact' })
      .eq('organization_id', req.auth!.organizationId)
      .order('created_at', { ascending: false });

    if (actor_id) query = query.eq('actor_id', actor_id);
    if (action) query = query.eq('action', action);
    if (targetEntityType) query = query.eq('entity_type', targetEntityType);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    query = query.range((pageNum - 1) * size, pageNum * size - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // Apply strict secret redaction
    const sanitizedItems = (data || []).map((item) => ({
      ...item,
      old_values: redactSecrets(item.old_values),
      new_values: redactSecrets(item.new_values),
    }));

    res.json({
      success: true,
      data: {
        items: sanitizedItems,
        total: count ?? 0,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil((count ?? 0) / size),
      },
    });
  } catch (err) {
    next(err);
  }
});
