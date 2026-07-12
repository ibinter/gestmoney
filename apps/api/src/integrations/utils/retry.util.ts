import { Logger } from '@nestjs/common';

const logger = new Logger('RetryUtil');

export function backoffDelay(attempt: number, baseMs = 1000): number {
  return baseMs * Math.pow(2, attempt);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
  context = 'Operation',
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      if (attempt < maxRetries) {
        const delay = backoffDelay(attempt, baseDelayMs);
        logger.warn(
          `${context} failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms... Error: ${err.message}`,
        );
        await sleep(delay);
      } else {
        logger.error(
          `${context} failed after ${maxRetries + 1} attempts. Last error: ${err.message}`,
        );
      }
    }
  }

  throw lastError!;
}
