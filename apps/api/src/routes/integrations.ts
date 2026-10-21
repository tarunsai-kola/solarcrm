import fs from 'fs';
import path from 'path';
import { Router, type Request, type Response } from 'express';
import {
  createCalendarEventSchema,
  sendEmailSchema,
  sendWhatsAppSchema,
  updateCalendarEventSchema,
  type IntegrationStatus,
} from '@solar-crm/shared';

import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { encryptToken } from '../services/encryption.js';
import {
  cancelGoogleCalendarEvent,
  createGoogleCalendarEvent,
  disconnectGoogleIntegration,
  exchangeGoogleCodeForTokens,
  getGoogleAuthUrl,
  getGoogleIntegrationStatus,
  updateGoogleCalendarEvent,
} from '../services/google-calendar.js';
import {
  isEmailConfigured,
  sendLeadEmail,
} from '../services/email-service.js';
import {
  isWhatsAppBusinessConfigured,
  prepareWhatsAppMessage,
} from '../services/whatsapp-service.js';
import { processFollowUpReminders } from '../services/reminders.js';
import { getReminderWorkerStatus } from '../services/reminder-scheduler.js';

export const integrationsRouter = Router();

// All routes require authenticated user
integrationsRouter.use(requireAuth);

// ─── 1. GET /integrations/status — Overview of all integrations ────────────────
integrationsRouter.get('/status', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;

    const googleStatus = await getGoogleIntegrationStatus(userId, orgId);

    const emailStatus: IntegrationStatus = {
      provider: 'smtp',
      name: 'Email Service',
      configured: isEmailConfigured(),
      connected: isEmailConfigured(),
      sync_enabled: isEmailConfigured(),
      sync_status: isEmailConfigured() ? 'active' : 'unconfigured',
      details: isEmailConfigured()
        ? 'SMTP transport active and ready to deliver customer notifications.'
        : 'SMTP credentials not configured on server. Deliveries will be simulated for demonstration.',
    };

    const waStatus: IntegrationStatus = {
      provider: 'whatsapp',
      name: 'WhatsApp Messaging',
      configured: isWhatsAppBusinessConfigured(),
      connected: true, // wa.me deep-link is always available
      sync_enabled: true,
      sync_status: isWhatsAppBusinessConfigured() ? 'active' : 'unconfigured',
      details: isWhatsAppBusinessConfigured()
        ? 'WhatsApp Business Cloud API active for automated messaging.'
        : 'WhatsApp wa.me link generation active. Business Cloud API not configured on server.',
    };

    res.json({
      success: true,
      data: {
        integrations: [googleStatus, emailStatus, waStatus],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. GET /integrations/google/auth-url — Generate OAuth Consent URL ────────
integrationsRouter.get('/google/auth-url', (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;
    const customRedirect = typeof req.query['redirect_uri'] === 'string' ? req.query['redirect_uri'] : undefined;

    const authUrl = getGoogleAuthUrl(userId, orgId, customRedirect);

    res.json({
      success: true,
      data: {
        auth_url: authUrl,
        provider: 'google',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 3. POST /integrations/google/callback — Exchange Code for Tokens ─────────
integrationsRouter.post('/google/callback', async (req: Request, res: Response, next) => {
  try {
    const { code, state, redirect_uri } = req.body;
    if (!code || !state) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Missing code or state in OAuth callback');
    }

    const result = await exchangeGoogleCodeForTokens(code, state, redirect_uri);

    res.json({
      success: true,
      data: {
        message: 'Google Calendar successfully connected.',
        ...result,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 4. POST /integrations/google/disconnect — Disconnect & Revoke Tokens ─────
integrationsRouter.post('/google/disconnect', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;

    await disconnectGoogleIntegration(userId, orgId);

    res.json({
      success: true,
      data: { message: 'Google Calendar disconnected and credentials cleared.' },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 4b. POST /integrations/google/connect-demo — Instant Dev/Demo Google Connection ─────
integrationsRouter.post('/google/connect-demo', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;

    // Fetch user profile email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const userEmail = profile?.email || 'tarunsaikolaa@gmail.com';

    await supabaseAdmin.from('calendar_integrations').upsert(
      {
        organization_id: orgId,
        user_id: userId,
        provider: 'google',
        access_token: encryptToken('simulated-access-token'),
        refresh_token: encryptToken('simulated-refresh-token'),
        token_expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        calendar_id: 'primary',
        email: userEmail,
        sync_enabled: true,
        sync_status: 'active',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    );

    res.json({
      success: true,
      data: {
        message: 'Google Calendar successfully connected.',
        email: userEmail,
        calendar_id: 'primary',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 4c. POST /integrations/google/config — Save Google Cloud OAuth Credentials ─────
integrationsRouter.post('/google/config', async (req: Request, res: Response, next) => {
  try {
    const { client_id, client_secret, redirect_uri } = req.body;
    if (!client_id || !client_secret) {
      throw new AppError(400, 'VALIDATION_ERROR', 'client_id and client_secret are required');
    }

    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      envContent = '';
    }

    const updates: Record<string, string> = {
      GOOGLE_CLIENT_ID: client_id.trim(),
      GOOGLE_CLIENT_SECRET: client_secret.trim(),
      GOOGLE_REDIRECT_URI: (redirect_uri || 'http://localhost:5173/settings/integrations/google/callback').trim(),
    };

    for (const [k, v] of Object.entries(updates)) {
      process.env[k] = v;
      const regex = new RegExp(`^${k}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${k}=${v}`);
      } else {
        envContent += `\n${k}=${v}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    res.json({
      success: true,
      data: {
        message: 'Google OAuth credentials saved successfully.',
        configured: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 5. GET /integrations/google/events — List Calendar Events ─────────────────
integrationsRouter.get('/google/events', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;
    const leadId = req.query['lead_id'] as string | undefined;

    let query = supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('organization_id', orgId);

    if (leadId) {
      query = query.eq('lead_id', leadId);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data: events, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;

    res.json({
      success: true,
      data: events || [],
    });
  } catch (err) {
    next(err);
  }
});

// ─── 6. POST /integrations/google/events — Create Calendar Event with Meet ────
integrationsRouter.post(
  '/google/events',
  validate(createCalendarEventSchema),
  async (req: Request, res: Response, next) => {
    try {
      const userId = req.auth!.userId;
      const orgId = req.auth!.organizationId;

      const result = await createGoogleCalendarEvent(userId, orgId, req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 7. PATCH /integrations/google/events/:id — Update Calendar Event ──────────
integrationsRouter.patch(
  '/google/events/:id',
  validate(updateCalendarEventSchema),
  async (req: Request, res: Response, next) => {
    try {
      const userId = req.auth!.userId;
      const orgId = req.auth!.organizationId;
      const eventId = req.params['id']!;

      const updated = await updateGoogleCalendarEvent(userId, orgId, eventId, req.body);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 8. DELETE /integrations/google/events/:id — Cancel Calendar Event ─────────
integrationsRouter.delete('/google/events/:id', async (req: Request, res: Response, next) => {
  try {
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;
    const eventId = req.params['id']!;

    await cancelGoogleCalendarEvent(userId, orgId, eventId);

    res.json({
      success: true,
      data: { message: 'Calendar event cancelled successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 9. POST /integrations/email/send — Professional Email Composer ───────────
integrationsRouter.post(
  '/email/send',
  validate(sendEmailSchema),
  async (req: Request, res: Response, next) => {
    try {
      const userId = req.auth!.userId;
      const orgId = req.auth!.organizationId;

      const result = await sendLeadEmail(userId, orgId, req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 10. POST /integrations/whatsapp/prepare — WhatsApp Deep-Link & Dispatch ──
integrationsRouter.post(
  '/whatsapp/prepare',
  validate(sendWhatsAppSchema),
  async (req: Request, res: Response, next) => {
    try {
      const userId = req.auth!.userId;
      const orgId = req.auth!.organizationId;

      // Fetch customer name and area if not supplied
      let customerName = 'Customer';
      let area = '';

      if (req.body.lead_id) {
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .select('customer_name, area')
          .eq('id', req.body.lead_id)
          .single();

        if (lead) {
          customerName = lead.customer_name;
          area = lead.area || '';
        }
      }

      const result = await prepareWhatsAppMessage(userId, orgId, {
        lead_id: req.body.lead_id,
        phone: req.body.phone,
        template_type: req.body.template_type,
        custom_text: req.body.custom_text,
        customer_name: customerName,
        area,
        automated_send: req.body.automated_send,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 11. POST /integrations/reminders/process — Trigger Follow-up Reminders ───
integrationsRouter.post('/reminders/process', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const result = await processFollowUpReminders(orgId);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 11b. GET /integrations/reminders/status — Operational Worker Status ──────
integrationsRouter.get('/reminders/status', async (_req: Request, res: Response) => {
  const status = getReminderWorkerStatus();
  res.json({
    success: true,
    data: status,
  });
});

// ─── 12. GET /integrations/communications — View Lead Communication History ───
integrationsRouter.get('/communications', async (req: Request, res: Response, next) => {
  try {
    const orgId = req.auth!.organizationId;
    const leadId = req.query['lead_id'] as string | undefined;

    if (!leadId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'lead_id query parameter is required');
    }

    const { data: logs, error } = await supabaseAdmin
      .from('communication_logs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: logs || [],
    });
  } catch (err) {
    next(err);
  }
});
