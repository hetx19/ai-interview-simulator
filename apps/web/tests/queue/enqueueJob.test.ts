import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import { qstash } from '@/server/queue/qstashClient';
import { env } from '@/lib/env';
import { AppError } from '@/server/graphql/errors';
import crypto from 'node:crypto';

describe('enqueueJob queue wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches in-process asynchronously when mock QStash token is detected', async () => {
    const userId = crypto.randomUUID();
    const result = await enqueueJob(JobType.GITHUB_SYNC, { userId });

    expect(result.messageId).toBeDefined();
    expect(result.messageId.startsWith('local-job-')).toBe(true);
  });

  it('wraps remote QStash failure into AppError(INTERNAL_ERROR)', async () => {
    const userId = crypto.randomUUID();
    const originalToken = env.QSTASH_TOKEN;
    const originalUrl = env.NEXT_PUBLIC_APP_URL;
    (env as any).QSTASH_TOKEN = 'real_token_123';
    (env as any).NEXT_PUBLIC_APP_URL = 'https://prod.devmetric.com';

    vi.spyOn(qstash, 'publishJSON').mockRejectedValueOnce(
      new Error('QStash network failure'),
    );

    await expect(
      enqueueJob(JobType.GITHUB_SYNC, { userId }),
    ).rejects.toThrow(AppError);

    (env as any).QSTASH_TOKEN = originalToken;
    (env as any).NEXT_PUBLIC_APP_URL = originalUrl;
  });
});
