import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from './errorHandler.js';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Validates request data against a Zod schema.
 * Replaces the validated target with the parsed (coerced) data.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.flatten();
      next(
        new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details),
      );
      return;
    }
    // Replace with coerced/transformed data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[target] = result.data;
    next();
  };
}
