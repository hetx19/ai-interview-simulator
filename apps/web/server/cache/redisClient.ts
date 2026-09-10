import { kv } from '@vercel/kv';
import { randomUUID } from 'node:crypto';
import { logger } from '@/server/logging/logger';
import { getCorrelationId } from '@/server/logging/correlationStore';

export const redis = kv;

export interface GetCachedOptions {
  ttl: number; // TTL in seconds — caller always specifies
  tags?: string[]; // Tag names for tag-based invalidation
  lockTtlMs?: number; // Distributed lock TTL in ms (default: 5000)
}

const inFlightRequests = new Map<string, Promise<unknown>>();

async function pollForCachedValue<T>(
  key: string,
  opts: { maxAttempts: number; intervalMs: number },
): Promise<T | null> {
  for (let i = 0; i < opts.maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, opts.intervalMs));
    try {
      const value = await redis.get<T>(key);
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Continue polling or fall through
    }
  }
  return null;
}

async function writeToCache<T>(
  key: string,
  value: T,
  options: GetCachedOptions,
): Promise<void> {
  try {
    await redis.set(key, value, { ex: options.ttl });
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await redis.sadd(tag, key);
        await redis.expire(tag, options.ttl + 60);
      }
    }
  } catch (err) {
    logger.warn(
      { key, err, correlationId: getCorrelationId() },
      'Redis cache write failed',
    );
  }
}

async function executeWithLock<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: GetCachedOptions,
): Promise<T> {
  const lockKey = `lock:${key}`;
  const lockToken = randomUUID();
  const lockTtlMs = options.lockTtlMs ?? 5000;

  let acquired = false;
  try {
    const res = await redis.set(lockKey, lockToken, {
      nx: true,
      px: lockTtlMs,
    });
    acquired = res === 'OK';
  } catch (err) {
    logger.warn(
      { key, err, correlationId: getCorrelationId() },
      'Redis lock acquisition failed, proceeding to fetch',
    );
    acquired = true;
  }

  if (!acquired) {
    const polled = await pollForCachedValue<T>(key, {
      maxAttempts: 10,
      intervalMs: 200,
    });
    if (polled !== null && polled !== undefined) {
      return polled;
    }
  }

  try {
    const value = await fetcher();
    await writeToCache(key, value, options);
    return value;
  } finally {
    if (acquired) {
      try {
        const releaseLockLua = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;
        await redis.eval(releaseLockLua, [lockKey], [lockToken]);
      } catch (err) {
        logger.warn(
          { key, err, correlationId: getCorrelationId() },
          'Redis lock release failed',
        );
      }
    }
  }
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: GetCachedOptions,
): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      let cached: T | null = null;
      try {
        cached = await redis.get<T>(key);
      } catch (err) {
        logger.warn(
          { key, err, correlationId: getCorrelationId() },
          'Redis get failed, falling back to fetcher',
        );
      }

      if (cached !== null && cached !== undefined) {
        return cached;
      }

      return await executeWithLock(key, fetcher, options);
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(
      { key, err, correlationId: getCorrelationId() },
      'Redis invalidateCache failed',
    );
  }
}

export async function invalidateByTag(tag: string): Promise<void> {
  try {
    const keys = await redis.smembers(tag);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del(tag);
  } catch (err) {
    logger.warn(
      { tag, err, correlationId: getCorrelationId() },
      'Redis invalidateByTag failed',
    );
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
      cursor = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : Number(nextCursor);
    } while (cursor !== 0);
  } catch (err) {
    logger.warn(
      { pattern, err, correlationId: getCorrelationId() },
      'Redis invalidatePattern failed',
    );
  }
}
