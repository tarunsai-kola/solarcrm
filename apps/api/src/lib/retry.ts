import { logger } from './logger.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  isRetryable?: (err: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 3000,
  backoffFactor: 2,
  isRetryable: (err: any) => {
    // Retry on network errors or 5xx server errors or 429 rate limit
    if (!err) return false;
    const status = err.status || err.statusCode || err.response?.status;
    if (status === 429 || (status >= 500 && status <= 599)) return true;
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      return true;
    }
    return false;
  },
};

/**
 * Executes an async function with exponential backoff and jitter for transient errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  operationName = 'operation',
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 0;
  let delay = opts.initialDelayMs;

  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = opts.isRetryable(err);
      if (attempt >= opts.maxRetries || !isRetryable) {
        if (attempt > 1) {
          logger.warn(
            { attempt, maxRetries: opts.maxRetries, err: err.message, operationName },
            `Retry attempts exhausted for ${operationName}`,
          );
        }
        throw err;
      }

      // Add jitter (+/- 20%) to prevent thundering herd
      const jitter = (Math.random() - 0.5) * 0.4 * delay;
      const actualDelay = Math.min(opts.maxDelayMs, Math.max(50, Math.round(delay + jitter)));

      logger.info(
        { attempt, nextDelayMs: actualDelay, operationName, err: err.message },
        `Transient failure during ${operationName}. Retrying in ${actualDelay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, actualDelay));
      delay = Math.min(opts.maxDelayMs, delay * opts.backoffFactor);
    }
  }
}
