import { ValidationError } from './errors';

type BucketState = {
  windowStartMs: number;
  count: number;
};

const buckets = new Map<string, BucketState>();

export function enforceTenantRateLimit(
  tenantId: string,
  bucket: string,
  limit: number,
  windowMs: number
): void {
  const now = Date.now();
  const key = `${tenantId}:${bucket}`;
  const current = buckets.get(key);

  if (!current || now - current.windowStartMs > windowMs) {
    buckets.set(key, { windowStartMs: now, count: 1 });
    return;
  }

  if (current.count >= limit) {
    throw new ValidationError(`rate limit excedido para ${bucket}`);
  }

  current.count += 1;
  buckets.set(key, current);
}
