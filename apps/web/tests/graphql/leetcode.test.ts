import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/prisma';
import { POST } from '@/app/api/graphql/route';
import { getServerSession } from 'next-auth/next';
import crypto from 'node:crypto';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/server/queue/enqueueJob', () => ({
  enqueueJob: vi.fn().mockResolvedValue({ messageId: 'msg-lc-job-456' }),
}));

vi.mock('@/server/cache/redisClient', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
  getCached: vi.fn().mockImplementation((_key: string, fetcher: () => any) => fetcher()),
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  invalidateByTag: vi.fn().mockResolvedValue(undefined),
}));

describe('GraphQL LeetCode Analytics (leetcodeProfile & syncLeetcode)', () => {
  let user: { id: string; email: string };

  beforeAll(async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    user = await db.user.create({
      data: {
        email: `lc-gql-${runId}@example.com`,
        username: `lc_gql_${runId}`,
        name: 'LeetCode GQL User',
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });

    await db.leetcodeProfile.create({
      data: {
        userId: user.id,
        leetcodeUsername: 'tour_de_code',
        leetcodeScore: 88,
        totalSolved: 420,
        easySolved: 120,
        mediumSolved: 230,
        hardSolved: 70,
        contestRating: 1980,
        contestRanking: 3200,
        streakDays: 55,
        topicPerformance: { Arrays: { solved: 50, category: 'fundamental', status: 'Proficient' } },
        weakTopics: ['Dynamic Programming'],
        recommendations: [{ slug: 'coin-change', title: 'Coin Change', difficulty: 'Medium', url: 'https://leetcode.com' }],
        contestHistory: [],
        lastSyncedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
      },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await db.leetcodeProfile.deleteMany({ where: { userId: user.id } });
      await db.user.deleteMany({ where: { id: user.id } });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Returns UNAUTHENTICATED when requesting leetcodeProfile without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ leetcodeProfile { leetcodeScore totalSolved } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('2. Returns leetcodeProfile data for authenticated session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id, email: user.email },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ leetcodeProfile { id leetcodeUsername leetcodeScore totalSolved easySolved mediumSolved hardSolved contestRating streakDays } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeUndefined();
    expect(json.data.leetcodeProfile).toBeDefined();
    expect(json.data.leetcodeProfile.leetcodeUsername).toBe('tour_de_code');
    expect(json.data.leetcodeProfile.leetcodeScore).toBe(88);
    expect(json.data.leetcodeProfile.totalSolved).toBe(420);
    expect(json.data.leetcodeProfile.contestRating).toBe(1980);
  });

  it('3. syncLeetcode mutation returns QUEUED response and enqueues job', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id, email: user.email },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation { syncLeetcode(username: "tour_de_code") { jobId status message } }',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeUndefined();
    expect(json.data.syncLeetcode.status).toBe('QUEUED');
    expect(json.data.syncLeetcode.jobId).toBe('msg-lc-job-456');
  });

  it('4. saveManualLeetcodeProfile mutation saves self-reported data and returns updated profile', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user.id, email: user.email },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation {
            saveManualLeetcodeProfile(input: {
              leetcodeUsername: "manual_dev"
              easySolved: 80
              mediumSolved: 120
              hardSolved: 30
              contestRating: 1750
              streakDays: 20
            }) {
              leetcodeUsername
              leetcodeScore
              totalSolved
              easySolved
              mediumSolved
              hardSolved
              contestRating
              streakDays
            }
          }
        `,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeUndefined();
    expect(json.data.saveManualLeetcodeProfile.leetcodeUsername).toBe('manual_dev');
    expect(json.data.saveManualLeetcodeProfile.totalSolved).toBe(230);
    expect(json.data.saveManualLeetcodeProfile.leetcodeScore).toBeGreaterThan(0);
    expect(json.data.saveManualLeetcodeProfile.contestRating).toBe(1750);
  });
});
