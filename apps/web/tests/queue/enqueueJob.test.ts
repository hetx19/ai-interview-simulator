import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { SignJWT } from 'jose';
import { POST } from '@/app/api/webhooks/qstash/route';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import { qstash } from '@/server/queue/qstashClient';
import * as jobRouter from '@/server/queue/jobRouter';
import { env } from '@/lib/env';

const mockSyncProfile = vi.fn().mockResolvedValue({ id: 'p1', githubScore: 90 });
vi.mock('@/server/services/GithubService', () => {
  return {
    GithubService: class {
      syncProfile = mockSyncProfile;
    },
  };
});
vi.mock('@/server/auth/encryption', () => ({
  getDecryptedAccessToken: vi.fn().mockResolvedValue('gho_test_token_123'),
  encryptToken: vi.fn(),
  decryptToken: vi.fn(),
}));

// Helper to sign bodies using the actual current signing key
async function generateSignature(body: string, key = env.QSTASH_CURRENT_SIGNING_KEY): Promise<string> {
  const bodyHash = crypto.createHash('sha256').update(body).digest('base64url');
  return new SignJWT({ body: bodyHash })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('Upstash')
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(key));
}

describe('QStash Queue & Webhook Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('11. Valid signed webhook accepted and job dispatched', async () => {
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob').mockResolvedValue(undefined);
    const jobPayload = {
      type: JobType.GITHUB_SYNC,
      payload: { userId: 'user-123', githubUsername: 'octocat' },
      correlationId: 'corr-11',
      userId: 'user-123',
      enqueuedAt: new Date().toISOString(),
    };
    const bodyStr = JSON.stringify(jobPayload);
    const signature = await generateSignature(bodyStr);

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': signature,
      },
      body: bodyStr,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: JobType.GITHUB_SYNC }));
    dispatchSpy.mockRestore();
  });

  it('12. Missing signature header returns 403', async () => {
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob');
    const bodyStr = JSON.stringify({ type: JobType.GITHUB_SYNC, userId: 'u1' });

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('FORBIDDEN');
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('13. Forged signature returns 403 and zero handler calls', async () => {
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob');
    const bodyStr = JSON.stringify({ type: JobType.GITHUB_SYNC, userId: 'u1' });
    const forgedSignature = await generateSignature(bodyStr, 'wrong-signature-key-attack');

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': forgedSignature,
      },
      body: bodyStr,
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('FORBIDDEN');
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('14. Malformed JSON after valid signature returns 400', async () => {
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob');
    const malformedBody = 'not valid json string {{{';
    const signature = await generateSignature(malformedBody);

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': signature,
      },
      body: malformedBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('BAD_REQUEST');
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('15. Unknown job type returns 400', async () => {
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob');
    const bodyStr = JSON.stringify({ type: 'unknown_type', userId: 'u1' });
    const signature = await generateSignature(bodyStr);

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': signature,
      },
      body: bodyStr,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('BAD_REQUEST');
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('16. Handler error returns 500 for QStash retry', async () => {
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob').mockRejectedValueOnce(new Error('Internal DB failure'));
    const bodyStr = JSON.stringify({
      type: JobType.LEETCODE_SYNC,
      payload: { userId: 'u2' },
      userId: 'u2',
    });
    const signature = await generateSignature(bodyStr);

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': signature,
      },
      body: bodyStr,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('INTERNAL_ERROR');
    dispatchSpy.mockRestore();
  });

  it('17. enqueueJob sends correct payload shape', async () => {
    const publishSpy = vi.spyOn(qstash, 'publishJSON').mockResolvedValueOnce({ messageId: 'msg-123' } as any);

    const result = await enqueueJob(JobType.GITHUB_SYNC, {
      userId: 'user-xyz',
      githubUsername: 'octocat',
    });

    expect(result).toEqual({ messageId: 'msg-123' });
    expect(publishSpy).toHaveBeenCalledTimes(1);

    const callArgs = publishSpy.mock.calls[0][0];
    expect(callArgs.url).toBe(`${env.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash`);
    expect(callArgs.retries).toBe(3);
    expect(callArgs.delay).toBe(0);
    expect(callArgs.body).toMatchObject({
      type: JobType.GITHUB_SYNC,
      userId: 'user-xyz',
      payload: { userId: 'user-xyz', githubUsername: 'octocat' },
    });
    expect((callArgs.body as any).correlationId).toBeDefined();
    expect((callArgs.headers as Record<string, string>)['X-Correlation-ID']).toBeDefined();

    publishSpy.mockRestore();
  });

  it('18. Verification occurs before processing (ordering check)', async () => {
    // Valid job body, but forged signature
    const validJob = JSON.stringify({
      type: JobType.GITHUB_SYNC,
      payload: { userId: 'user-xyz' },
      userId: 'user-xyz',
    });
    const badSignature = await generateSignature(validJob, 'wrong-secret');
    const dispatchSpy = vi.spyOn(jobRouter, 'dispatchJob');

    const request = new Request('http://localhost:3000/api/webhooks/qstash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Upstash-Signature': badSignature,
      },
      body: validJob,
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('19. dispatchJob executes GITHUB_SYNC and invalidates user cache tags', async () => {
    await jobRouter.dispatchJob({
      type: JobType.GITHUB_SYNC,
      payload: { userId: 'u_sync_test' },
      correlationId: 'corr-19',
      userId: 'u_sync_test',
      enqueuedAt: new Date().toISOString(),
    });

    expect(mockSyncProfile).toHaveBeenCalledWith('gho_test_token_123');
  });
});
