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

    const repos = await client.getRepositories(mockToken, 'octocat', 100, { maxPages: 1 });

    expect(repos).toHaveLength(2);
    expect(repos[0]?.name).toBe('active-repo');
    expect(repos[0]?.isInactive).toBe(false);
    expect(repos[1]?.name).toBe('inactive-repo');
    expect(repos[1]?.isInactive).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.test/users/octocat/repos?per_page=100&page=1&sort=pushed&direction=desc',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
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

    const allRepos = await client.getRepositories(mockToken, 'octocat', 100, { maxPages: 1 });
    expect(allRepos).toHaveLength(2);
    expect(allRepos[0]?.isPrivate).toBe(false);
    expect(allRepos[1]?.isPrivate).toBe(true);

    const publicOnly = await client.getRepositories(mockToken, 'octocat', 100, { excludePrivate: true, maxPages: 1 });
    expect(publicOnly).toHaveLength(1);
    expect(publicOnly[0]?.name).toBe('pub-repo');
  });

  it('9. getRepositories resolves username via getUserProfile when username is not provided in calling context', async () => {
    const mockUser = {
      id: 123456,
      login: 'resolved-octocat',
      name: 'Resolved Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456',
      bio: null,
      public_repos: 1,
      followers: 10,
      following: 2,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const mockRepos = [
      {
        id: 999,
        name: 'fallback-repo',
        full_name: 'resolved-octocat/fallback-repo',
        owner: { login: 'resolved-octocat' },
        private: false,
        stargazers_count: 12,
        forks_count: 3,
        fork: false,
        pushed_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser,
        headers: new Headers(),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRepos,
        headers: new Headers(),
      } as any);

    // Call without username: (mockToken, perPage, options)
    const repos = await client.getRepositories(mockToken, 100, { maxPages: 1 });

    expect(repos).toHaveLength(1);
    expect(repos[0]?.name).toBe('fallback-repo');
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.test/user',
      expect.anything(),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.test/users/resolved-octocat/repos?per_page=100&page=1&sort=pushed&direction=desc',
      expect.anything(),
    );
  });

  it('10. getRepositories hits /users/{username}/repos against a realistic GitHub public repo fixture and preserves pagination params', async () => {
    // Realistic fixture modeled directly from GitHub REST API GET /users/{username}/repos
    const realisticPublicRepoPage1 = [
      {
        id: 1296269,
        node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
        private: false,
        owner: {
          login: 'octocat',
          id: 583231,
          avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
          html_url: 'https://github.com/octocat',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/octocat/Hello-World',
        description: 'This is your first repo!',
        fork: false,
        created_at: '2011-01-26T19:01:12Z',
        updated_at: '2026-01-01T00:00:00Z',
        pushed_at: new Date().toISOString(),
        size: 108,
        stargazers_count: 80,
        watchers_count: 80,
        language: 'TypeScript',
        forks_count: 9,
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT',
        },
        visibility: 'public',
      },
      {
        id: 1296270,
        node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2Mjcw',
        name: 'Spoon-Knife',
        full_name: 'octocat/Spoon-Knife',
        private: false,
        owner: {
          login: 'octocat',
          id: 583231,
          avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
          html_url: 'https://github.com/octocat',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/octocat/Spoon-Knife',
        description: 'This repo is for forking practice.',
        fork: false,
        created_at: '2011-01-27T19:01:12Z',
        updated_at: '2026-01-01T00:00:00Z',
        pushed_at: new Date().toISOString(),
        size: 250,
        stargazers_count: 1500,
        watchers_count: 1500,
        language: 'JavaScript',
        forks_count: 320,
        license: {
          key: 'apache-2.0',
          name: 'Apache License 2.0',
          spdx_id: 'Apache-2.0',
        },
        visibility: 'public',
      },
    ];

    const realisticPublicRepoPage2 = [
      {
        id: 1296271,
        node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2Mjcx',
        name: 'octocat.github.io',
        full_name: 'octocat/octocat.github.io',
        private: false,
        owner: {
          login: 'octocat',
          id: 583231,
          avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
          html_url: 'https://github.com/octocat',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/octocat/octocat.github.io',
        description: 'Personal blog and showcase',
        fork: false,
        created_at: '2011-03-01T12:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        pushed_at: new Date().toISOString(),
        size: 512,
        stargazers_count: 45,
        watchers_count: 45,
        language: 'HTML',
        forks_count: 12,
        license: null,
        visibility: 'public',
      },
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => realisticPublicRepoPage1,
        headers: new Headers(),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => realisticPublicRepoPage2,
        headers: new Headers(),
      } as any);

    // Request with perPage = 2, so page 1 returns 2 items, triggering page 2 fetch
    const repos = await client.getRepositories(mockToken, 'octocat', 2, { maxPages: 2 });

    expect(repos).toHaveLength(3);

    // Verify first page request preserves pagination params
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.test/users/octocat/repos?per_page=2&page=1&sort=pushed&direction=desc',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevMetric-App',
        }),
      }),
    );

    // Verify second page request preserves pagination params
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.test/users/octocat/repos?per_page=2&page=2&sort=pushed&direction=desc',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevMetric-App',
        }),
      }),
    );

    // Verify mapped shape matches GitHubRepo schema perfectly for GithubService consumption
    expect(repos[0]).toMatchObject({
      id: 1296269,
      name: 'Hello-World',
      fullName: 'octocat/Hello-World',
      owner: 'octocat',
      stars: 80,
      forks: 9,
      isFork: false,
      language: 'TypeScript',
      size: 108,
      isInactive: false,
      isPrivate: false,
      htmlUrl: 'https://github.com/octocat/Hello-World',
      description: 'This is your first repo!',
      license: 'MIT',
    });

    expect(repos[1]).toMatchObject({
      id: 1296270,
      name: 'Spoon-Knife',
      fullName: 'octocat/Spoon-Knife',
      owner: 'octocat',
      stars: 1500,
      forks: 320,
      isFork: false,
      language: 'JavaScript',
      size: 250,
      isInactive: false,
      isPrivate: false,
      htmlUrl: 'https://github.com/octocat/Spoon-Knife',
      description: 'This repo is for forking practice.',
      license: 'Apache-2.0',
    });

    expect(repos[2]).toMatchObject({
      id: 1296271,
      name: 'octocat.github.io',
      fullName: 'octocat/octocat.github.io',
      owner: 'octocat',
      stars: 45,
      forks: 12,
      isFork: false,
      language: 'HTML',
      size: 512,
      isInactive: false,
      isPrivate: false,
      htmlUrl: 'https://github.com/octocat/octocat.github.io',
      description: 'Personal blog and showcase',
      license: null,
    });
  });
});
