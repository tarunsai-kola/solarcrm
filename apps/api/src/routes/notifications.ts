import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

// ─── 1. GET /notifications — Paginated list for authenticated user ─────────────
notificationsRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;
    const { is_read, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (is_read !== undefined && is_read !== '') {
      query = query.eq('is_read', is_read === 'true');
    }

    query = query.range((pageNum - 1) * size, pageNum * size - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: {
        items: data || [],
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

// ─── 2. GET /notifications/unread-count — Fast badge counter ─────────────────
notificationsRouter.get('/unread-count', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        unread_count: count ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 3. PATCH /notifications/:id/read — Mark single as read ───────────────────
notificationsRouter.patch('/:id/read', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;
    const notificationId = req.params['id'] as string;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(404, 'NOT_FOUND', 'Notification not found or unauthorized');
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── 4. PATCH /notifications/read-all — Mark all as read ─────────────────────
notificationsRouter.patch('/read-all', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
});

// ─── 5. DELETE /notifications/:id — Remove notification ───────────────────────
notificationsRouter.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;
    const notificationId = req.params['id'] as string;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('organization_id', orgId);

    if (error) throw error;

    res.json({ success: true, message: 'Notification removed successfully' });
  } catch (err) {
    next(err);
  }
});
