import compression from 'compression';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { supabaseAdmin } from './lib/supabase.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { analyticsRouter } from './routes/analytics.js';
import { auditRouter } from './routes/audit.js';
import { crmConfigRouter } from './routes/crm-config.js';
import { dashboardRouter } from './routes/dashboard.js';
import { followUpsRouter } from './routes/followups.js';
import { integrationsRouter } from './routes/integrations.js';
import { leadsRouter } from './routes/leads.js';
import { notificationsRouter } from './routes/notifications.js';
import { quotationsRouter } from './routes/quotations.js';
import { settingsRouter } from './routes/settings.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();

  // ── Restore original URL if rewritten by serverless host (e.g. Vercel) ───
  app.use((req, _res, next) => {
    const rawUrl =
      (req.headers['x-forwarded-url'] as string | undefined) ||
      (req.headers['x-matched-path'] as string | undefined);
    if (rawUrl && (req.url === '/api' || req.url === '/api/')) {
      try {
        const parsed = new URL(rawUrl, 'http://localhost');
        req.url = parsed.pathname + parsed.search;
      } catch {
        req.url = rawUrl;
      }
    }
    next();
  });

  // ── Request correlation ID ───────────────────────────────────────────────
  app.use((req, res, next) => {
    const incomingId = req.headers['x-request-id'];
    const reqId =
      typeof incomingId === 'string' && incomingId.trim().length > 0
        ? incomingId.trim()
        : randomUUID();
    req.id = reqId;
    res.setHeader('X-Request-ID', reqId);
    next();
  });

  // ── Security middleware ─────────────────────────────────────────────────
  app.use(helmet());
  const corsOrigin = env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN;
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-ID',
        'Idempotency-Key',
        'X-Idempotency-Key',
      ],
      exposedHeaders: ['X-Request-ID', 'X-Idempotency-Replay', 'X-Cache-Lookup'],
    }),
  );

  // ── Rate limiting ───────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ── Request parsing ─────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(compression());

  // ── Logging with Request ID ─────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id || (req.headers['x-request-id'] as string) || randomUUID(),
      customProps: (req) => ({
        requestId: (req as any).id,
      }),
    }),
  );

  // ── Idempotency protection for mutating requests ────────────────────────
  app.use(idempotencyMiddleware);

  // ── Diagnostic Root Route ──────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Solar CRM API',
      version: '1.0.0',
      health: '/health',
      api_base: env.API_BASE_PATH,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Health probes (Liveness & Readiness) ─────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health/live', (_req, res) => {
    res.json({
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      // Fast check against the database
      const { error } = await supabaseAdmin.from('organizations').select('id').limit(1);
      if (error) {
        res.status(503).json({
          status: 'unready',
          database: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'unready',
        database: 'disconnected',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ── API Routes ──────────────────────────────────────────────────────────
  const base = env.API_BASE_PATH;
  app.use(`${base}/dashboard`, dashboardRouter);
  app.use(`${base}/analytics`, analyticsRouter);
  app.use(`${base}/crm-config`, crmConfigRouter);
  app.use(`${base}/leads`, leadsRouter);
  app.use(`${base}/quotations`, quotationsRouter);
  app.use(`${base}/notifications`, notificationsRouter);
  app.use(`${base}/follow-ups`, followUpsRouter);
  app.use(`${base}/integrations`, integrationsRouter);
  app.use(`${base}/users`, usersRouter);
  app.use(`${base}/settings`, settingsRouter);
  app.use(`${base}/audit`, auditRouter);

  // ── 404 & Error handling ────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
