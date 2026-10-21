import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler.js';

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  timestamp: number;
  inFlight: boolean;
}

// In-memory LRU-like cache for idempotent mutations (10 minutes TTL)
const idempotencyStore = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;

function cleanOldEntries() {
  const now = Date.now();
  for (const [key, val] of idempotencyStore.entries()) {
    if (now - val.timestamp > CACHE_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}

/**
 * Idempotency middleware for mutating endpoints (POST, PATCH, PUT)
 * Protects against duplicate submissions, network retry duplication, and race conditions
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to mutating methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!rawKey || typeof rawKey !== 'string') {
    return next(); // Key is optional; if not provided, proceed normally
  }

  // Scope idempotency key by organization and user to prevent cross-tenant collision
  const orgId = req.auth?.organizationId || 'global';
  const userId = req.auth?.userId || 'anonymous';
  const scopedKey = `${orgId}:${userId}:${req.method}:${req.path}:${rawKey.trim()}`;

  // Purge expired keys periodically
  if (idempotencyStore.size > MAX_CACHE_ENTRIES) {
    cleanOldEntries();
  }

  const existing = idempotencyStore.get(scopedKey);
  const now = Date.now();

  if (existing && now - existing.timestamp < CACHE_TTL_MS) {
    // If request is currently processing, return 409 Conflict
    if (existing.inFlight) {
      return next(
        new AppError(
          409,
          'CONCURRENT_REQUEST',
          'A request with this idempotency key is currently processing. Please wait.',
        ),
      );
    }

    // Replay cached response
    res.setHeader('X-Cache-Lookup', 'HIT');
    res.setHeader('X-Idempotency-Replay', 'true');
    for (const [headerName, headerVal] of Object.entries(existing.headers)) {
      if (headerVal !== undefined && headerName !== 'transfer-encoding') {
        res.setHeader(headerName, headerVal);
      }
    }
    res.status(existing.statusCode).send(existing.body);
    return;
  }

  // Register in-flight request
  idempotencyStore.set(scopedKey, {
    statusCode: 200,
    headers: {},
    body: null,
    timestamp: now,
    inFlight: true,
  });

  // Intercept response to cache result
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  let capturedBody: any = null;

  res.send = function (body: any) {
    capturedBody = body;
    const entry = idempotencyStore.get(scopedKey);
    if (entry) {
      entry.inFlight = false;
      entry.statusCode = res.statusCode;
      entry.body = capturedBody;
      entry.headers = {
        'content-type': res.getHeader('content-type') as string,
      };
    }
    return originalSend(body);
  };

  res.json = function (body: any) {
    capturedBody = body;
    const entry = idempotencyStore.get(scopedKey);
    if (entry) {
      entry.inFlight = false;
      entry.statusCode = res.statusCode;
      entry.body = capturedBody;
      entry.headers = {
        'content-type': 'application/json; charset=utf-8',
      };
    }
    return originalJson(body);
  };

  next();
}

/**
 * Helper for testing to clear idempotency cache
 */
export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
}
