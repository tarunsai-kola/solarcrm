import type { NextFunction, Request, Response } from 'express';

import type { ApiError } from '@solar-crm/shared';

// Extend Express Request with auth context
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
      auth?: {
        userId: string;
        email: string;
        role: string;
        organizationId: string;
        companyId: string;
      };
    }
  }
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof Error) {
    const body: ApiError = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
    res.status(500).json(body);
    return;
  }

  res.status(500).json({
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'Unknown error' },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  } satisfies ApiError);
}
