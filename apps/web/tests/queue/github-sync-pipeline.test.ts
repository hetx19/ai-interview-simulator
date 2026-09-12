import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { dispatchJob } from '@/server/queue/jobRouter';
import { JobType } from '@/server/queue/jobTypes';
import { POST as syncRestHandler } from '@/app/api/v1/github/sync/route';
import { cacheKeys, cacheTags } from '@/lib/cache/cacheKeys';
import * as redisClient from '@/server/cache/redisClient';
import * as encryption from '@/server/auth/encryption';
import * as authNext from '@/auth';
import { GithubService } from '@/server/services/GithubService';
import { AppError } from '@/server/graphql/errors';

vi.mock('@/server/queue/enqueueJob', () => ({
  enqueueJob: vi.fn().mockResolvedValue({ messageId: 'msg-job-123' }),
}));

describe('GitHub Sync Job Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. dispatchJob successfully processes GITHUB_SYNC and invalidates cache key & tags', async () => {
    const userId = crypto.randomUUID();
    const fakeToken = 'gho_pipeline_token_123';

    vi.spyOn(encryption, 'getDecryptedAccessToken').mockResolvedValueOnce(fakeToken);
    const invalidateCacheSpy = vi.spyOn(redisClient, 'invalidateCache').mockResolvedValue();
    const invalidateByTagSpy = vi.spyOn(redisClient, 'invalidateByTag').mockResolvedValue();

    const mockProfile = {
      id: crypto.randomUUID(),
      userId,
      githubUsername: 'octo-pipe',
      githubScore: 86,
      repoHealthScore: 90,
      openSourceScore: 80,
      totalRepos: 10,
      totalStars: 45,
      totalForks: 12,
      totalCommitsYear: 250,
      recommendations: ['Keep up the consistency!'],
      lastSyncedAt: new Date(),
    } as any;

    const syncSpy = vi.spyOn(GithubService.prototype, 'syncProfile').mockResolvedValueOnce(mockProfile);

    await dispatchJob({
      type: JobType.GITHUB_SYNC,
      payload: { userId },
      correlationId: 'corr-pipe-1',
      userId,
      enqueuedAt: new Date().toISOString(),
    });

    expect(syncSpy).toHaveBeenCalledWith(fakeToken);
    expect(invalidateCacheSpy).toHaveBeenCalledWith(cacheKeys.githubProfile(userId));
    expect(invalidateByTagSpy).toHaveBeenCalledWith(cacheTags.user(userId));
  });

  it('2. dispatchJob gracefully handles expired/revoked OAuth token without endless failure', async () => {
    const userId = crypto.randomUUID();
    const expiredToken = 'gho_expired_token';

    vi.spyOn(encryption, 'getDecryptedAccessToken').mockResolvedValueOnce(expiredToken);

    // Mock syncProfile throwing UNAUTHENTICATED
    vi.spyOn(GithubService.prototype, 'syncProfile').mockRejectedValueOnce(
      new AppError('UNAUTHENTICATED', 'GitHub token expired or revoked. Reconnect required.'),
    );

    // Should resolve without throwing, preventing QStash retry loop
    await expect(
      dispatchJob({
        type: JobType.GITHUB_SYNC,
        payload: { userId },
        correlationId: 'corr-expired-1',
        userId,
        enqueuedAt: new Date().toISOString(),
      }),
    ).resolves.toBeUndefined();
  });

  it('3. REST POST /api/v1/github/sync returns 401 when unauthenticated', async () => {
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce(null as any);

    const response = await syncRestHandler();
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('UNAUTHORIZED');
  });

  it('4. REST POST /api/v1/github/sync returns 429 when 24h rate limit is active', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce({
      user: { id: userId, email: 'ratelimit@example.com' },
    } as any);

    vi.spyOn(GithubService.prototype, 'assertSyncAllowed').mockRejectedValueOnce(
      new AppError(
        'RATE_LIMITED',
        'GitHub sync can only be triggered once every 24 hours. Retry after 3600 seconds.',
        'lastSyncedAt',
      ),
    );

    const response = await syncRestHandler();
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe('RATE_LIMITED');
    expect(json.retryAfterSeconds).toBe(3600);
    expect(response.headers.get('Retry-After')).toBe('3600');
  });

  it('5. REST POST /api/v1/github/sync returns 202 when sync is queued', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(authNext, 'auth').mockResolvedValueOnce({
      user: { id: userId, email: 'valid@example.com' },
    } as any);

    vi.spyOn(GithubService.prototype, 'assertSyncAllowed').mockResolvedValueOnce(undefined);

    const response = await syncRestHandler();
    expect(response.status).toBe(202);
    const json = await response.json();
    expect(json.status).toBe('queued');
    expect(json.jobId).toBeDefined();
    expect(json.estimatedSeconds).toBe(30);
  });
});
