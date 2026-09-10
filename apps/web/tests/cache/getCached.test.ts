import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redis, getCached, invalidateCache, invalidateByTag, invalidatePattern } from '@/server/cache/redisClient';

vi.mock('@vercel/kv', () => {
  const kv = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    sadd: vi.fn(),
    smembers: vi.fn(),
    scan: vi.fn(),
    expire: vi.fn(),
  };
  return { kv };
});

describe('Cache Layer - getCached & invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Cache hit returns cached value without calling fetcher', async () => {
    const cachedData = { id: 1, name: 'Alice' };
    vi.mocked(redis.get).mockResolvedValueOnce(cachedData);
    const fetcher = vi.fn().mockResolvedValue({ id: 1, name: 'Fresh' });

    const result = await getCached('user:1', fetcher, { ttl: 60 });

    expect(result).toEqual(cachedData);
    expect(fetcher).toHaveBeenCalledTimes(0);
    expect(redis.get).toHaveBeenCalledWith('user:1');
  });

  it('2. Cache miss calls fetcher and sets cache', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.set).mockResolvedValue('OK');
    const freshData = { id: 2, name: 'Bob' };
    const fetcher = vi.fn().mockResolvedValue(freshData);

    const result = await getCached('user:2', fetcher, { ttl: 60 });

    expect(result).toEqual(freshData);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith('user:2', freshData, { ex: 60 });
  });

  it('3. TTL passed to Redis', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.set).mockResolvedValue('OK');
    const fetcher = vi.fn().mockResolvedValue({ status: 'active' });

    await getCached('session:123', fetcher, { ttl: 300 });

    expect(redis.set).toHaveBeenCalledWith('session:123', { status: 'active' }, { ex: 300 });
  });

  it('4. Tag-based invalidation removes keys and deletes tag key without using KEYS', async () => {
    vi.mocked(redis.smembers).mockResolvedValueOnce(['k1', 'k2']);
    vi.mocked(redis.del).mockResolvedValue(1);

    await invalidateByTag('tag:user:abc');

    expect(redis.smembers).toHaveBeenCalledWith('tag:user:abc');
    expect(redis.del).toHaveBeenCalledWith('k1', 'k2');
    expect(redis.del).toHaveBeenCalledWith('tag:user:abc');
    // Verify KEYS was never touched
    expect((redis as any).keys).toBeUndefined();
  });

  it('5. Tags written on cache set with expiration buffer', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(redis.sadd).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);
    const fetcher = vi.fn().mockResolvedValue({ id: 'abc' });

    await getCached('key1', fetcher, { ttl: 60, tags: ['tag:user:abc'] });

    expect(redis.sadd).toHaveBeenCalledWith('tag:user:abc', 'key1');
    expect(redis.expire).toHaveBeenCalledWith('tag:user:abc', 120);
  });

  it('6. SCAN loop handles multiple batches without KEYS', async () => {
    vi.mocked(redis.scan)
      .mockResolvedValueOnce(['10', ['user:abc:github', 'user:abc:score']])
      .mockResolvedValueOnce(['0', ['user:abc:settings']]);
    vi.mocked(redis.del).mockResolvedValue(1);

    await invalidatePattern('user:abc:*');

    expect(redis.scan).toHaveBeenCalledTimes(2);
    expect(redis.scan).toHaveBeenNthCalledWith(1, 0, { match: 'user:abc:*', count: 100 });
    expect(redis.scan).toHaveBeenNthCalledWith(2, 10, { match: 'user:abc:*', count: 100 });
    expect(redis.del).toHaveBeenCalledWith('user:abc:github', 'user:abc:score');
    expect(redis.del).toHaveBeenCalledWith('user:abc:settings');
    expect((redis as any).keys).toBeUndefined();
  });

  it('7. Redis unavailable — fallback to fetcher without throwing', async () => {
    vi.mocked(redis.get).mockRejectedValueOnce(new Error('Redis connection timeout'));
    vi.mocked(redis.set).mockRejectedValue(new Error('Redis down'));
    const freshData = { fallback: true };
    const fetcher = vi.fn().mockResolvedValue(freshData);

    const result = await getCached('unstable:key', fetcher, { ttl: 60 });

    expect(result).toEqual(freshData);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('8. Redis unavailable — invalidate logs warning, does not throw', async () => {
    vi.mocked(redis.del).mockRejectedValueOnce(new Error('Redis error'));

    await expect(invalidateCache('dead:key')).resolves.not.toThrow();
  });

  it('9. 10 concurrent requests -> fetcher executes exactly once (stampede protection)', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.set).mockResolvedValue('OK');

    const fetcher = vi.fn().mockImplementation(async () => {
      await new Promise((res) => setTimeout(res, 50));
      return { computed: 42 };
    });

    const promises = Array(10)
      .fill(null)
      .map(() => getCached('same-key', fetcher, { ttl: 60 }));

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    for (const res of results) {
      expect(res).toEqual({ computed: 42 });
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('10. Different keys have separate in-flight state', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.set).mockResolvedValue('OK');

    const fetcher1 = vi.fn().mockImplementation(async () => {
      await new Promise((res) => setTimeout(res, 20));
      return { key: 1 };
    });
    const fetcher2 = vi.fn().mockImplementation(async () => {
      await new Promise((res) => setTimeout(res, 20));
      return { key: 2 };
    });

    const [res1, res2] = await Promise.all([
      getCached('k1', fetcher1, { ttl: 60 }),
      getCached('k2', fetcher2, { ttl: 60 }),
    ]);

    expect(res1).toEqual({ key: 1 });
    expect(res2).toEqual({ key: 2 });
    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).toHaveBeenCalledTimes(1);
  });
});
