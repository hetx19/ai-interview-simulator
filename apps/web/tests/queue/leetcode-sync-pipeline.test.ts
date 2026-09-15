import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { dispatchJob } from '@/server/queue/jobRouter';
import { JobType } from '@/server/queue/jobTypes';
import { POST as syncRestHandler } from '@/app/api/v1/leetcode/sync/route';
import { POST as qstashWebhookHandler } from '@/app/api/webhooks/qstash/route';
import { cacheKeys, cacheTags } from '@/lib/cache/cacheKeys';
import * as redisClient from '@/server/cache/redisClient';
import * as authNext from '@/auth';
import * as verifyQStashModule from '@/server/queue/verifyQStash';
import { LeetcodeService } from '@/server/services/LeetcodeService';
import { AppError } from '@/server/graphql/errors';

vi.mock('@/server/queue/enqueueJob', () => ({
  enqueueJob: vi.fn().mockResolvedValue({ messageId: 'msg-lc-job-123' }),
}));

describe('LeetCode Sync Job Pipeline & QStash Worker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(redisClient, 'invalidateCache').mockResolvedValue();
    vi.spyOn(redisClient, 'invalidateByTag').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. dispatchJob successfully processes LEETCODE_SYNC with payload username and invalidates cache', async () => {
    const userId = crypto.randomUUID();
    const leetcodeUsername = 'tour_de_code';

    const invalidateCacheSpy = vi.spyOn(redisClient, 'invalidateCache').mockResolvedValue();
    const invalidateByTagSpy = vi.spyOn(redisClient, 'invalidateByTag').mockResolvedValue();

    const mockProfile = {
      id: crypto.randomUUID(),
      userId,
      leetcodeUsername,
      leetcodeScore: 84,
      totalSolved: 320,
      easySolved: 100,
      mediumSolved: 170,
      hardSolved: 50,
      contestRating: 1910,
      contestRanking: 5200,
      streakDays: 42,
      topicPerformance: {},
      weakTopics: [],
      recommendations: [],
      contestHistory: [],
      lastSyncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const syncSpy = vi.spyOn(LeetcodeService.prototype, 'syncProfile').mockResolvedValueOnce(mockProfile);

    await dispatchJob({
      type: JobType.LEETCODE_SYNC,
      payload: { userId, leetcodeUsername },
      correlationId: 'corr-lc-pipe-1',
      userId,
      enqueuedAt: new Date().toISOString(),
    });

    expect(syncSpy).toHaveBeenCalledWith(leetcodeUsername);
    expect(invalidateCacheSpy).toHaveBeenCalledWith(cacheKeys.leetcodeProfile(userId));
    expect(invalidateByTagSpy).toHaveBeenCalledWith(cacheTags.user(userId));
  });

  it('2. dispatchJob falls back to database profile when payload username is omitted', async () => {
    const userId = crypto.randomUUID();
    const existingProfile = {
      id: crypto.randomUUID(),
      userId,
      leetcodeUsername: 'fallback_user',
      leetcodeScore: 70,
      totalSolved: 200,
      easySolved: 80,
      mediumSolved: 100,
      hardSolved: 20,
      contestRating: null,
      contestRanking: null,
      streakDays: 10,
      topicPerformance: {},
      weakTopics: [],
      recommendations: [],
      contestHistory: [],
      lastSyncedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    vi.spyOn(LeetcodeService.prototype, 'getProfile').mockResolvedValueOnce(existingProfile);
    const syncSpy = vi.spyOn(LeetcodeService.prototype, 'syncProfile').mockResolvedValueOnce(existingProfile);

    await dispatchJob({
      type: JobType.LEETCODE_SYNC,
      payload: { userId },
      correlationId: 'corr-lc-fallback',
      userId,
      enqueuedAt: new Date().toISOString(),
    });

    expect(syncSpy).toHaveBeenCalledWith('fallback_user');
  });

  it('3. dispatchJob throws VALIDATION_ERROR when no username exists in payload or DB', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(LeetcodeService.prototype, 'getProfile').mockResolvedValueOnce(null);

    await expect(
      dispatchJob({
        type: JobType.LEETCODE_SYNC,
        payload: { userId },
        correlationId: 'corr-lc-err',
        userId,
        enqueuedAt: new Date().toISOString(),
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('4. REST POST /api/v1/leetcode/sync returns 401 when unauthenticated', async () => {
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce(null as any);

    const req = new Request('http://localhost:3000/api/v1/leetcode/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'alex' }),
    });

    const response = await syncRestHandler(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('UNAUTHORIZED');
  });

  it('5. REST POST /api/v1/leetcode/sync returns 400 when no username is provided and no profile exists', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce({
      user: { id: userId, email: 'user@example.com' },
    } as any);

    vi.spyOn(LeetcodeService.prototype, 'getProfile').mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/v1/leetcode/sync', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await syncRestHandler(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('6. REST POST /api/v1/leetcode/sync returns 429 when 24h rate limit is active', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce({
      user: { id: userId, email: 'ratelimit@example.com' },
    } as any);

    vi.spyOn(LeetcodeService.prototype, 'assertSyncAllowed').mockRejectedValueOnce(
      new AppError(
        'RATE_LIMITED',
        'LeetCode sync can only be triggered once every 24 hours. Retry after 7200 seconds.',
        'lastSyncedAt',
      ),
    );

    const req = new Request('http://localhost:3000/api/v1/leetcode/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'alex' }),
    });

    const response = await syncRestHandler(req);
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe('RATE_LIMITED');
    expect(json.retryAfterSeconds).toBe(7200);
    expect(response.headers.get('Retry-After')).toBe('7200');
  });

  it('7. REST POST /api/v1/leetcode/sync returns 202 when job is enqueued', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce({
      user: { id: userId, email: 'valid@example.com' },
    } as any);

    vi.spyOn(LeetcodeService.prototype, 'assertSyncAllowed').mockResolvedValueOnce(undefined);

    const req = new Request('http://localhost:3000/api/v1/leetcode/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'alex_code' }),
    });

    const response = await syncRestHandler(req);
    expect(response.status).toBe(202);
    const json = await response.json();
    expect(json.status).toBe('queued');
    expect(json.jobId).toBe('msg-lc-job-123');
  });

  it('8. Round-trips LEETCODE_SYNC through /api/webhooks/qstash worker using verified signature', async () => {
    const userId = crypto.randomUUID();
    const correlationId = 'corr-qstash-roundtrip';

    // Mock signature verification to succeed (testing the mock token / test environment flow)
    vi.spyOn(verifyQStashModule, 'verifyQStashSignature').mockResolvedValueOnce();

    const mockProfile = {
      id: crypto.randomUUID(),
      userId,
      leetcodeUsername: 'qstash_user',
      leetcodeScore: 78,
      totalSolved: 240,
    } as any;

    const syncSpy = vi.spyOn(LeetcodeService.prototype, 'syncProfile').mockResolvedValueOnce(mockProfile);
    vi.spyOn(redisClient, 'invalidateCache').mockResolvedValue();
    vi.spyOn(redisClient, 'invalidateByTag').mockResolvedValue();

    const qstashBody = JSON.stringify({
      type: JobType.LEETCODE_SYNC,
      payload: {
        userId,
        leetcodeUsername: 'qstash_user',
      },
      correlationId,
      userId,
      enqueuedAt: new Date().toISOString(),
    });

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': 'mock-valid-signature',
        'X-Correlation-ID': correlationId,
      },
      body: qstashBody,
    });

    const response = await qstashWebhookHandler(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.correlationId).toBe(correlationId);
    expect(syncSpy).toHaveBeenCalledWith('qstash_user');
  });
});
