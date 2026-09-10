import { AppError } from '@/server/graphql/errors';
import { logger } from '@/server/logging/logger';
import { getCorrelationId } from '@/server/logging/correlationStore';

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  stars: number;
  forks: number;
  isFork: boolean;
  language: string | null;
  pushedAt: string | null;
  createdAt: string;
  updatedAt: string;
  size: number;
  isInactive: boolean;
  htmlUrl: string;
  description: string | null;
  license: string | null;
}

export interface CommitActivityWeek {
  total: number;
  week: number;
  days: number[];
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: Array<{
    contributionDays: ContributionDay[];
  }>;
}

export class GitHubApiClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://api.github.com') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    backoffMs = 100,
  ): Promise<Response> {
    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const res = await fetch(url, options);

        if (res.status === 401) {
          throw new AppError('UNAUTHENTICATED', 'GitHub token expired or invalid');
        }

        if (res.status === 403) {
          const remaining = res.headers.get('x-ratelimit-remaining');
          if (remaining === '0') {
            const resetHeader = res.headers.get('x-ratelimit-reset');
            throw new AppError(
              'RATE_LIMITED',
              `GitHub API rate limit exceeded. Reset at ${resetHeader ? new Date(Number(resetHeader) * 1000).toISOString() : 'unknown'}`,
            );
          }
          const bodyText = await res.text().catch(() => '');
          if (bodyText.includes('rate limit')) {
            throw new AppError('RATE_LIMITED', 'GitHub API rate limit exceeded');
          }
          throw new AppError('FORBIDDEN', 'GitHub API access forbidden');
        }

        if (res.status >= 500 && attempt < retries) {
          logger.warn(
            { url, status: res.status, attempt, correlationId: getCorrelationId() },
            'GitHub API 5xx, retrying with exponential backoff',
          );
          await new Promise((resolve) =>
            setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)),
          );
          continue;
        }

        if (!res.ok) {
          throw new AppError(
            'INTERNAL_ERROR',
            `GitHub API returned error ${res.status}: ${res.statusText}`,
          );
        }

        return res;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        if (attempt < retries) {
          logger.warn(
            { url, attempt, error, correlationId: getCorrelationId() },
            'GitHub API network error, retrying',
          );
          await new Promise((resolve) =>
            setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)),
          );
          continue;
        }
        throw new AppError(
          'INTERNAL_ERROR',
          `GitHub API request failed after ${attempt} attempts: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
  }

  public async getUserProfile(token: string): Promise<GitHubUserProfile> {
    const res = await this.fetchWithRetry(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevMetric-App',
      },
    });

    const data = await res.json();
    return {
      id: data.id,
      login: data.login,
      name: data.name ?? null,
      avatarUrl: data.avatar_url,
      bio: data.bio ?? null,
      publicRepos: data.public_repos ?? 0,
      followers: data.followers ?? 0,
      following: data.following ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async getRepositories(
    token: string,
    perPage = 100,
    options?: { filterForks?: boolean; maxPages?: number },
  ): Promise<GitHubRepo[]> {
    const allRepos: GitHubRepo[] = [];
    let page = 1;
    const maxPages = options?.maxPages ?? 10;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    while (page <= maxPages) {
      const url = `${this.baseUrl}/user/repos?per_page=${perPage}&page=${page}&sort=pushed&direction=desc&affiliation=owner,collaborator`;
      const res = await this.fetchWithRetry(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevMetric-App',
        },
      });

      const data: any[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const r of data) {
        if (options?.filterForks && r.fork) {
          continue;
        }

        const isInactive = !r.pushed_at || new Date(r.pushed_at) < twelveMonthsAgo;

        allRepos.push({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          owner: r.owner?.login ?? '',
          stars: r.stargazers_count ?? 0,
          forks: r.forks_count ?? 0,
          isFork: !!r.fork,
          language: r.language ?? null,
          pushedAt: r.pushed_at ?? null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          size: r.size ?? 0,
          isInactive,
          htmlUrl: r.html_url ?? '',
          description: r.description ?? null,
          license: r.license?.spdx_id ?? null,
        });
      }

      if (data.length < perPage) {
        break;
      }
      page++;
    }

    return allRepos;
  }

  public async getCommitActivity(
    token: string,
    owner: string,
    repo: string,
  ): Promise<CommitActivityWeek[]> {
    const url = `${this.baseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/commit_activity`;
    const res = await this.fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevMetric-App',
      },
    });

    if (res.status === 202) {
      // 202 Accepted means GitHub is compiling stats
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((week: any) => ({
      total: week.total ?? 0,
      week: week.week ?? 0,
      days: Array.isArray(week.days) ? week.days : [],
    }));
  }

  public async getContributionCalendar(
    token: string,
    username: string,
  ): Promise<ContributionCalendar> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const graphqlUrl = this.baseUrl.endsWith('/graphql')
      ? this.baseUrl
      : `${this.baseUrl.replace(/\/$/, '')}/graphql`;

    const res = await this.fetchWithRetry(graphqlUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'DevMetric-App',
      },
      body: JSON.stringify({ query, variables: { username } }),
    });

    const json = await res.json();
    const calendar =
      json?.data?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) {
      return {
        totalContributions: 0,
        weeks: [],
      };
    }

    return {
      totalContributions: calendar.totalContributions ?? 0,
      weeks: calendar.weeks ?? [],
    };
  }
}

export const gitHubApiClient = new GitHubApiClient();
