import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/prisma';
import { POST } from '@/app/api/graphql/route';
import { getServerSession } from 'next-auth/next';
import crypto from 'node:crypto';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/server/queue/enqueueJob', () => ({
  enqueueJob: vi.fn().mockResolvedValue({ messageId: 'msg-job-123' }),
}));

describe('GraphQL GitHub Analytics (githubProfile & syncGitHub)', () => {
  let user: { id: string; email: string };

  beforeAll(async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    user = await db.user.create({
      data: {
        email: `gh-gql-${runId}@example.com`,
        username: `gh_gql_${runId}`,
        name: 'GitHub GQL User',
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });

    await db.githubProfile.create({
      data: {
        userId: user.id,
        githubUsername: 'octocat',
        githubScore: 88,
        repoHealthScore: 92,
        openSourceScore: 85,
        totalRepos: 15,
        totalStars: 120,
        totalForks: 30,
        totalCommitsYear: 450,
        recommendations: ['Keep up the great work!'],
        lastSyncedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await db.githubProfile.deleteMany({ where: { userId: user.id } });
      await db.user.deleteMany({ where: { id: user.id } });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Returns UNAUTHENTICATED when requesting githubProfile without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ githubProfile { githubScore lastSyncedAt } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('2. Returns githubProfile data for authenticated session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id, email: user.email },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ githubProfile { id githubUsername githubScore totalRepos recommendations } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeUndefined();
    expect(json.data?.githubProfile).toMatchObject({
      githubUsername: 'octocat',
      githubScore: 88,
      totalRepos: 15,
      recommendations: ['Keep up the great work!'],
    });
  });

  it('3. Returns UNAUTHENTICATED when invoking syncGitHub mutation without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation { syncGitHub { jobId status message } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('4. Successfully triggers syncGitHub mutation for authenticated session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id, email: user.email },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation { syncGitHub { jobId status message } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeUndefined();
    expect(json.data?.syncGitHub).toMatchObject({
      jobId: 'msg-job-123',
      status: 'QUEUED',
      message: 'GitHub synchronization job queued successfully',
    });
  });
});
