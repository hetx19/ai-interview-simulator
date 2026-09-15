import { AppError } from '@/server/graphql/errors';
import { logger } from '@/server/logging/logger';
import { getCorrelationId } from '@/server/logging/correlationStore';

export interface LeetcodeSubmissionCount {
  difficulty: 'All' | 'Easy' | 'Medium' | 'Hard' | string;
  count: number;
}

export interface LeetcodeTagCount {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface LeetcodeContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  totalParticipants: number;
  topPercentage: number;
  badge?: {
    name: string;
  } | null;
}

export interface LeetcodeContestHistoryEntry {
  attended: boolean;
  rating: number;
  ranking: number;
  problemsSolved: number;
  totalProblems: number;
  contest: {
    title: string;
    startTime: number;
  };
}

export interface LeetcodeRawData {
  username: string;
  realName?: string | null;
  avatarUrl?: string | null;
  ranking?: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  streakDays: number;
  totalActiveDays: number;
  contestRating?: number | null;
  contestRanking?: number | null;
  contestHistory?: Array<{
    date: number;
    rating: number;
    ranking: number;
    problemsSolved: number;
    totalProblems: number;
    contestTitle: string;
  }>;
  tagProblemCounts: {
    fundamental: LeetcodeTagCount[];
    intermediate: LeetcodeTagCount[];
    advanced: LeetcodeTagCount[];
  };
  recentAcSlugs?: string[];
}

const USER_PROFILE_QUERY = /* GraphQL */ `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        realName
        userAvatar
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      userCalendar {
        streak
        totalActiveDays
      }
      tagProblemCounts {
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
      badge {
        name
      }
    }
    userContestRankingHistory(username: $username) {
      attended
      rating
      ranking
      problemsSolved
      totalProblems
      contest {
        title
        startTime
      }
    }
    recentAcSubmissionList(username: $username, limit: 50) {
      titleSlug
    }
  }
`;

export class LeetcodeApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(
    baseUrl = 'https://leetcode.com/graphql',
    timeoutMs = 10000,
  ) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Resilient GraphQL fetch with exponential backoff and timeout.
   * Classifies network errors, timeouts, rate limits, and 404s into typed AppErrors.
   */
  public async fetchGraphQL<T = any>(
    query: string,
    variables: Record<string, any>,
    retries = 3,
    backoffMs = 100,
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      attempt++;
      let timeoutId: NodeJS.Timeout | undefined;

      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'DevMetric-App/1.0 (Engineering Intelligence OS)',
            Referer: 'https://leetcode.com',
          },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.status === 429) {
          throw new AppError('RATE_LIMITED', 'LeetCode API rate limit exceeded');
        }

        if (res.status === 403) {
          const bodyText = await res.text().catch(() => '');
          const isCloudflare =
            res.headers.get('cf-mitigated') === 'challenge' ||
            res.headers.get('server')?.toLowerCase().includes('cloudflare') ||
            bodyText.includes('cf-challenge') ||
            bodyText.includes('_cf_chl') ||
            bodyText.includes('cloudflare');
          if (isCloudflare) {
            throw new AppError(
              'FORBIDDEN',
              'LeetCode automated sync is temporarily blocked by Cloudflare for cloud hosting IPs. Please use the Manual Entry option to log your metrics.',
            );
          }
          if (bodyText.toLowerCase().includes('rate limit') || bodyText.toLowerCase().includes('too many')) {
            throw new AppError('RATE_LIMITED', 'LeetCode API rate limit exceeded');
          }
          throw new AppError('FORBIDDEN', 'LeetCode API access forbidden');
        }

        if (res.status === 404) {
          throw new AppError(
            'NOT_FOUND',
            `LeetCode user "${variables.username}" not found`,
            'username',
          );
        }

        if (res.status >= 500 && attempt < retries) {
          logger.warn(
            {
              url: this.baseUrl,
              status: res.status,
              attempt,
              correlationId: getCorrelationId(),
            },
            'LeetCode API 5xx, retrying with exponential backoff',
          );
          await new Promise((resolve) =>
            setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)),
          );
          continue;
        }

        if (!res.ok) {
          throw new AppError(
            'INTERNAL_ERROR',
            `LeetCode API returned HTTP ${res.status}: ${res.statusText}`,
          );
        }

        let json: any;
        try {
          json = await res.json();
        } catch {
          throw new AppError('INTERNAL_ERROR', 'Malformed response from LeetCode API');
        }

        // LeetCode GraphQL errors handling
        if (json?.errors && Array.isArray(json.errors) && json.errors.length > 0) {
          for (const err of json.errors) {
            const msg = (err.message || '').toLowerCase();
            if (msg.includes('rate limit') || msg.includes('too many requests')) {
              throw new AppError('RATE_LIMITED', 'LeetCode API rate limit exceeded');
            }
            if (msg.includes('does not exist') || msg.includes('not found') || msg.includes('user not found')) {
              throw new AppError(
                'NOT_FOUND',
                `LeetCode user "${variables.username}" not found`,
                'username',
              );
            }
          }

          // If there is no data at all with errors, treat as internal/malformed error
          if (!json.data) {
            throw new AppError(
              'INTERNAL_ERROR',
              `LeetCode GraphQL error: ${json.errors[0]?.message || 'Unknown error'}`,
            );
          }
        }

        // When a username does not exist on LeetCode, matchedUser is null
        if (json?.data && json.data.matchedUser === null) {
          throw new AppError(
            'NOT_FOUND',
            `LeetCode user "${variables.username}" not found`,
            'username',
          );
        }

        if (!json || typeof json !== 'object' || !json.data) {
          throw new AppError('INTERNAL_ERROR', 'Malformed response from LeetCode API');
        }

        return json.data as T;
      } catch (error: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (error instanceof AppError) {
          throw error;
        }

        const isTimeout =
          error?.name === 'AbortError' ||
          error?.name === 'TimeoutError' ||
          error?.message?.includes('aborted');

        if (attempt < retries) {
          logger.warn(
            {
              url: this.baseUrl,
              attempt,
              isTimeout,
              error: error?.message,
              correlationId: getCorrelationId(),
            },
            'LeetCode API request failed, retrying with exponential backoff',
          );
          await new Promise((resolve) =>
            setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)),
          );
          continue;
        }

        if (isTimeout) {
          throw new AppError(
            'INTERNAL_ERROR',
            `LeetCode API request timed out after ${attempt} attempts (${this.timeoutMs}ms timeout)`,
          );
        }

        throw new AppError(
          'INTERNAL_ERROR',
          `LeetCode API request failed after ${attempt} attempts: ${error instanceof Error ? error.message : 'network failure'}`,
        );
      }
    }
  }

  /**
   * Fetches public profile, problem counts, contest rating, and topic performance.
   */
  public async getUserProfile(username: string): Promise<LeetcodeRawData> {
    const trimmed = username?.trim();
    if (!trimmed) {
      throw new AppError('VALIDATION_ERROR', 'LeetCode username is required', 'username');
    }

    const data = await this.fetchGraphQL<any>(USER_PROFILE_QUERY, {
      username: trimmed,
    });

    const user = data.matchedUser;
    if (!user) {
      throw new AppError('NOT_FOUND', `LeetCode user "${trimmed}" not found`, 'username');
    }

    // Parse difficulty solve counts
    const submissionNums: LeetcodeSubmissionCount[] =
      user.submitStatsGlobal?.acSubmissionNum || [];

    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const item of submissionNums) {
      const diff = item.difficulty?.toLowerCase();
      if (diff === 'all') totalSolved = item.count;
      else if (diff === 'easy') easySolved = item.count;
      else if (diff === 'medium') mediumSolved = item.count;
      else if (diff === 'hard') hardSolved = item.count;
    }

    // If "all" was not present, sum up the individual difficulties
    if (totalSolved === 0 && (easySolved > 0 || mediumSolved > 0 || hardSolved > 0)) {
      totalSolved = easySolved + mediumSolved + hardSolved;
    }

    // Contest rating information
    const contestRanking: LeetcodeContestRanking | null = data.userContestRanking ?? null;
    const contestRating = contestRanking?.rating ? Math.round(contestRanking.rating) : null;
    const contestRank = contestRanking?.globalRanking ?? null;

    // Filter attended contests history
    const contestHistoryRaw: LeetcodeContestHistoryEntry[] =
      data.userContestRankingHistory || [];
    const contestHistory = contestHistoryRaw
      .filter((c) => c.attended)
      .map((c) => ({
        date: c.contest?.startTime ? c.contest.startTime * 1000 : Date.now(),
        rating: Math.round(c.rating || 0),
        ranking: c.ranking || 0,
        problemsSolved: c.problemsSolved || 0,
        totalProblems: c.totalProblems || 0,
        contestTitle: c.contest?.title || 'Weekly Contest',
      }));

    // Tag counts by category
    const tagCounts = user.tagProblemCounts || {
      fundamental: [],
      intermediate: [],
      advanced: [],
    };

    // Extract recent accepted submission slugs
    const recentAcList = data.recentAcSubmissionList || [];
    const recentAcSlugs: string[] = Array.isArray(recentAcList)
      ? recentAcList.map((item: any) => item?.titleSlug).filter(Boolean)
      : [];

    return {
      username: user.username,
      realName: user.profile?.realName ?? null,
      avatarUrl: user.profile?.userAvatar ?? null,
      ranking: user.profile?.ranking ?? null,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      streakDays: user.userCalendar?.streak ?? 0,
      totalActiveDays: user.userCalendar?.totalActiveDays ?? 0,
      contestRating,
      contestRanking: contestRank,
      contestHistory,
      tagProblemCounts: {
        fundamental: tagCounts.fundamental || [],
        intermediate: tagCounts.intermediate || [],
        advanced: tagCounts.advanced || [],
      },
      recentAcSlugs,
    };
  }
}

export const leetcodeApiClient = new LeetcodeApiClient();
