import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeetcodeApiClient } from '@/server/external/LeetcodeApiClient';

describe('LeetcodeApiClient Unit Tests', () => {
  let client: LeetcodeApiClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    client = new LeetcodeApiClient('https://leetcode.test/graphql', 1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. getUserProfile succeeds on 200 OK and maps GraphQL fields correctly', async () => {
    const mockGraphQLResponse = {
      data: {
        matchedUser: {
          username: 'tour_de_code',
          profile: {
            ranking: 15420,
            realName: 'Alex Mercer',
            userAvatar: 'https://leetcode.com/avatar.png',
          },
          submitStatsGlobal: {
            acSubmissionNum: [
              { difficulty: 'All', count: 412 },
              { difficulty: 'Easy', count: 120 },
              { difficulty: 'Medium', count: 224 },
              { difficulty: 'Hard', count: 68 },
            ],
          },
          userCalendar: {
            streak: 64,
            totalActiveDays: 180,
          },
          tagProblemCounts: {
            fundamental: [
              { tagName: 'Arrays', tagSlug: 'arrays', problemsSolved: 45 },
            ],
            intermediate: [
              { tagName: 'Dynamic Programming', tagSlug: 'dynamic-programming', problemsSolved: 58 },
            ],
            advanced: [],
          },
        },
        userContestRanking: {
          attendedContestsCount: 24,
          rating: 1942.3,
          globalRanking: 4810,
          totalParticipants: 100000,
          topPercentage: 4.81,
          badge: { name: 'Knight' },
        },
        userContestRankingHistory: [
          {
            attended: true,
            rating: 1942,
            ranking: 1200,
            problemsSolved: 3,
            totalProblems: 4,
            contest: {
              title: 'Weekly Contest 400',
              startTime: 1720000000,
            },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGraphQLResponse,
      headers: new Headers(),
    } as any);

    const result = await client.getUserProfile('tour_de_code');

    expect(result.username).toBe('tour_de_code');
    expect(result.totalSolved).toBe(412);
    expect(result.easySolved).toBe(120);
    expect(result.mediumSolved).toBe(224);
    expect(result.hardSolved).toBe(68);
    expect(result.streakDays).toBe(64);
    expect(result.contestRating).toBe(1942);
    expect(result.contestRanking).toBe(4810);
    expect(result.contestHistory?.length).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('2. Throws VALIDATION_ERROR when username is empty or whitespace', async () => {
    await expect(client.getUserProfile('')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    await expect(client.getUserProfile('   ')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('3. Throws NOT_FOUND when matchedUser is null in GraphQL response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          matchedUser: null,
        },
      }),
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile('nonexistent_user')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('4. Throws RATE_LIMITED on HTTP 429', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile('user123')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('5. Throws RATE_LIMITED when response contains rate limit in GraphQL error message', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        errors: [{ message: 'Rate limit exceeded: You have sent too many requests.' }],
        data: null,
      }),
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile('user123')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('6. Retries 500 status code with exponential backoff and fails after exhausting retries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile('user123')).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
    });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('7. Throws INTERNAL_ERROR on malformed or non-JSON body', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0');
      },
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile('user123')).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
    });
  });
});
