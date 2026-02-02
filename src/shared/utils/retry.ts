// src/shared/utils/retry.ts

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < opts.maxAttempts) {
        const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
        logger.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

export function retryDecorator(options?: Partial<RetryOptions>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retryAsync(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
