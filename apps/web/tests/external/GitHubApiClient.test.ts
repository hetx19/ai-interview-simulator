import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubApiClient } from '@/server/external/GitHubApiClient';
import { AppError } from '@/server/graphql/errors';

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;
  const mockToken = 'gho_mock_token_12345';

  beforeEach(() => {
    vi.restoreAllMocks();
    client = new GitHubApiClient('https://api.github.test');
  });

  it('1. getUserProfile succeeds on 200 OK', async () => {
    const mockUser = {
      id: 123456,
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456',
      bio: 'Open source enthusiast',
      public_repos: 42,
      followers: 100,
      following: 10,
      created_at: '2011-01-25T18:44:36Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUser,
      headers: new Headers(),
    } as any);

    const profile = await client.getUserProfile(mockToken);

    expect(profile.login).toBe('octocat');
    expect(profile.id).toBe(123456);
    expect(profile.publicRepos).toBe(42);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.test/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
  });

  it('2. Throws AppError with UNAUTHENTICATED on 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile(mockToken)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('3. Throws AppError with RATE_LIMITED on 403 when remaining is 0', async () => {
    const headers = new Headers();
    headers.set('x-ratelimit-remaining', '0');
    headers.set('x-ratelimit-reset', '1893456000');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers,
      text: async () => 'API rate limit exceeded',
    } as any);

    await expect(client.getUserProfile(mockToken)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('4. Retries 500 error and throws after exhausting attempts', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers(),
    } as any);

    await expect(client.getUserProfile(mockToken)).rejects.toThrow();
    // 3 retries total
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('5. getRepositories flags inactive repos and respects pagination', async () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 14);

    const mockReposPage1 = [
      {
        id: 1,
        name: 'active-repo',
        full_name: 'octocat/active-repo',
        owner: { login: 'octocat' },
        stargazers_count: 50,
        forks_count: 5,
        fork: false,
        language: 'TypeScript',
        pushed_at: new Date().toISOString(),
        created_at: '2025-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        size: 1024,
      },
      {
        id: 2,
        name: 'inactive-repo',
        full_name: 'octocat/inactive-repo',
        owner: { login: 'octocat' },
        stargazers_count: 10,
        forks_count: 0,
        fork: false,
        language: 'Python',
        pushed_at: twelveMonthsAgo.toISOString(),
        created_at: '2023-01-01T00:00:00Z',
        updated_at: twelveMonthsAgo.toISOString(),
        size: 512,
      },
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockReposPage1,
      headers: new Headers(),
    } as any);

    const repos = await client.getRepositories(mockToken, 100, { maxPages: 1 });

    expect(repos).toHaveLength(2);
    expect(repos[0]?.name).toBe('active-repo');
    expect(repos[0]?.isInactive).toBe(false);
    expect(repos[1]?.name).toBe('inactive-repo');
    expect(repos[1]?.isInactive).toBe(true);
  });

  it('6. getContributionCalendar queries GraphQL endpoint correctly', async () => {
    const mockCalendarData = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 540,
              weeks: [
                {
                  contributionDays: [
                    { contributionCount: 5, date: '2026-01-01', weekday: 4 },
                  ],
                },
              ],
            },
          },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockCalendarData,
      headers: new Headers(),
    } as any);

    const calendar = await client.getContributionCalendar(mockToken, 'octocat');

    expect(calendar.totalContributions).toBe(540);
    expect(calendar.weeks).toHaveLength(1);
    expect(calendar.weeks[0]?.contributionDays[0]?.contributionCount).toBe(5);
  });

  it('7. getContributionCalendar throws RATE_LIMITED when GraphQL returns rate limit errors in JSON payload', async () => {
    const mockGraphQLError = {
      errors: [
        {
          type: 'RATE_LIMITED',
          message: 'API rate limit exceeded for user ID',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGraphQLError,
      headers: new Headers(),
    } as any);

    await expect(client.getContributionCalendar(mockToken, 'octocat')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('8. getRepositories tracks isPrivate flag and supports excludePrivate option', async () => {
    const mockRepos = [
      {
        id: 1,
        name: 'pub-repo',
        full_name: 'octocat/pub-repo',
        owner: { login: 'octocat' },
        private: false,
        stargazers_count: 5,
        forks_count: 0,
        fork: false,
        pushed_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'priv-repo',
        full_name: 'octocat/priv-repo',
        owner: { login: 'octocat' },
        private: true,
        stargazers_count: 20,
        forks_count: 0,
        fork: false,
        pushed_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRepos,
      headers: new Headers(),
    } as any);

    const allRepos = await client.getRepositories(mockToken, 100, { maxPages: 1 });
    expect(allRepos).toHaveLength(2);
    expect(allRepos[0]?.isPrivate).toBe(false);
    expect(allRepos[1]?.isPrivate).toBe(true);

    const publicOnly = await client.getRepositories(mockToken, 100, { excludePrivate: true, maxPages: 1 });
    expect(publicOnly).toHaveLength(1);
    expect(publicOnly[0]?.name).toBe('pub-repo');
  });
});
