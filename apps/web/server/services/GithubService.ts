import { GitHubApiClient, gitHubApiClient, GitHubRepo, ContributionCalendar } from '@/server/external/GitHubApiClient';
import { GithubRepository } from '@/server/repositories/GithubRepository';
import { cacheKeys, cacheTags, cacheTTL } from '@/lib/cache/cacheKeys';
import { redis, getCached, invalidateCache, invalidateByTag } from '@/server/cache/redisClient';
import { AppError } from '@/server/graphql/errors';
import { logger } from '@/server/logging/logger';
import { getCorrelationId } from '@/server/logging/correlationStore';
import type { GithubProfile } from '@prisma/client';

export interface ScoreBreakdown {
  commitConsistency: number; // 30%
  codeQuality: number; // 20%
  communityEngagement: number; // 20%
  repositoryHealth: number; // 15%
  languageDiversity: number; // 15%
  githubScore: number; // 0-100
  repoHealthScore: number; // 0-100
  openSourceScore: number; // 0-100
}

export function calculateCommitConsistency(calendar?: ContributionCalendar | null): number {
  if (!calendar || calendar.totalContributions === 0 || !calendar.weeks || calendar.weeks.length === 0) {
    return 0;
  }

  const allDays = calendar.weeks.flatMap((w) => w.contributionDays || []);
  if (allDays.length === 0) return 0;

  let activeWeeks = 0;
  for (const week of calendar.weeks) {
    const weekCount = (week.contributionDays || []).reduce((acc, d) => acc + (d.contributionCount || 0), 0);
    if (weekCount > 0) activeWeeks++;
  }

  const activeWeekRatio = activeWeeks / Math.max(1, calendar.weeks.length);
  let base = activeWeekRatio * 85;

  // Streak calculation
  let currentStreak = 0;
  let maxStreak = 0;
  let currentGap = 0;
  let maxGapDays = 0;

  for (const day of allDays) {
    if (day.contributionCount > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      currentGap = 0;
    } else {
      currentStreak = 0;
      currentGap++;
      if (currentGap > maxGapDays) maxGapDays = currentGap;
    }
  }

  if (maxStreak >= 14) {
    base += 15; // bonus for 2-week active streak
  }

  if (maxGapDays > 30) {
    base -= 15; // penalty for >30 day gap
  }

  return Math.max(0, Math.min(100, Math.round(base)));
}

export function calculateCodeQuality(repos: GitHubRepo[]): number {
  if (!repos || repos.length === 0) return 0;

  let withLicense = 0;
  let withDescription = 0;
  let nonForks = 0;

  for (const r of repos) {
    if (r.license && r.license !== 'NOASSERTION') withLicense++;
    if (r.description && r.description.trim().length > 10) withDescription++;
    if (!r.isFork) nonForks++;
  }

  const licenseRatio = withLicense / repos.length;
  const descRatio = withDescription / repos.length;
  const originalRatio = nonForks / repos.length;

  const score = licenseRatio * 40 + descRatio * 40 + originalRatio * 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateCommunityEngagement(repos: GitHubRepo[]): number {
  if (!repos || repos.length === 0) return 0;

  let effectiveStars = 0;
  let effectiveForks = 0;

  for (const r of repos) {
    const weight = r.isFork ? 0.5 : 1.0;
    effectiveStars += (r.stars || 0) * weight;
    effectiveForks += (r.forks || 0) * weight;
  }

  const combined = effectiveStars * 2 + effectiveForks * 3;
  if (combined <= 0) return 10; // baseline for having public code

  // Scaled logarithmic curve: 10 points -> ~30, 50 points -> ~65, 150+ points -> 100
  const score = Math.min(100, 15 + Math.log2(combined + 1) * 11);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateRepositoryHealth(repos: GitHubRepo[]): number {
  if (!repos || repos.length === 0) return 0;

  const activeRepos = repos.filter((r) => !r.isInactive);
  const activeRatio = activeRepos.length / repos.length;

  return Math.max(0, Math.min(100, Math.round(activeRatio * 100)));
}

export function calculateLanguageDiversity(languageDistribution: Record<string, number>): number {
  const entries = Object.entries(languageDistribution);
  if (entries.length === 0) return 0;
  if (entries.length === 1) return 30; // Solid proficiency in 1 language

  const total = entries.reduce((acc, [, val]) => acc + val, 0);
  if (total === 0) return 0;

  // Shannon Diversity Index: H = -sum(p_i * ln(p_i))
  let H = 0;
  for (const [, val] of entries) {
    if (val > 0) {
      const p = val / total;
      H -= p * Math.log(p);
    }
  }

  // An H of ~1.5 corresponds to ~4 well-balanced languages
  const score = 30 + (H / 1.5) * 70;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateOverallScores(
  repos: GitHubRepo[],
  calendar?: ContributionCalendar | null,
  languages: Record<string, number> = {},
): ScoreBreakdown {
  const publicRepos = (repos || []).filter((r) => !r.isPrivate);
  const isPrivateOnly = repos && repos.length > 0 && publicRepos.length === 0;

  if (!repos || repos.length === 0) {
    return {
      commitConsistency: 0,
      codeQuality: 0,
      communityEngagement: 0,
      repositoryHealth: 0,
      languageDiversity: 0,
      githubScore: 0,
      repoHealthScore: 0,
      openSourceScore: 0,
    };
  }

  // Edge case: Private-only profile -> partial analysis (only commit consistency from calendar is assessable)
  if (isPrivateOnly) {
    const commitConsistency = calculateCommitConsistency(calendar);
    const githubScore = Math.max(
      0,
      Math.min(100, Math.round(commitConsistency * 0.3)),
    );
    return {
      commitConsistency,
      codeQuality: 0,
      communityEngagement: 0,
      repositoryHealth: 0,
      languageDiversity: 0,
      githubScore,
      repoHealthScore: 0,
      openSourceScore: 0,
    };
  }

  const commitConsistency = calculateCommitConsistency(calendar);
  const codeQuality = calculateCodeQuality(publicRepos);
  const communityEngagement = calculateCommunityEngagement(publicRepos);
  const repositoryHealth = calculateRepositoryHealth(publicRepos);
  const languageDiversity = calculateLanguageDiversity(languages);

  const githubScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        commitConsistency * 0.3 +
          codeQuality * 0.2 +
          communityEngagement * 0.2 +
          repositoryHealth * 0.15 +
          languageDiversity * 0.15,
      ),
    ),
  );

  const repoHealthScore = repositoryHealth;
  const openSourceScore = Math.max(
    0,
    Math.min(100, Math.round(communityEngagement * 0.6 + codeQuality * 0.4)),
  );

  return {
    commitConsistency,
    codeQuality,
    communityEngagement,
    repositoryHealth,
    languageDiversity,
    githubScore,
    repoHealthScore,
    openSourceScore,
  };
}

export function generateRecommendations(
  breakdown: ScoreBreakdown,
  repos: GitHubRepo[],
): string[] {
  const recs: string[] = [];
  const publicRepos = (repos || []).filter((r) => !r.isPrivate);

  if (!repos || repos.length === 0) {
    recs.push('Create your first public repository to begin building your GitHub score.');
    return recs;
  }

  // Edge case: Private-only profile warning
  if (repos.length > 0 && publicRepos.length === 0) {
    recs.push(
      'Your profile only contains private repositories. Private repositories are excluded from analysis to respect code privacy, resulting in a partial analysis with reduced accuracy. Consider making key repositories public or adding public showcases.',
    );
    return recs;
  }

  if (breakdown.commitConsistency < 50) {
    recs.push('Aim for weekly commits and avoid gaps over 30 days to improve your Consistency score.');
  }

  const missingLicense = publicRepos.filter((r) => !r.isFork && (!r.license || r.license === 'NOASSERTION'));
  if (missingLicense.length > 0) {
    recs.push(`Add open-source licenses (such as MIT or Apache 2.0) to ${missingLicense.length} repository/repositories.`);
  }

  const inactive = publicRepos.filter((r) => r.isInactive);
  if (inactive.length > 0) {
    recs.push(`Resume activity or archive ${inactive.length} dormant repository/repositories to improve repository health.`);
  }

  if (breakdown.languageDiversity < 40) {
    recs.push('Expand project language diversity across your portfolio to increase language coverage.');
  }

  if (breakdown.communityEngagement < 30) {
    recs.push('Enhance repository READMEs and share your projects with developer communities to boost stars and forks.');
  }

  if (recs.length === 0) {
    recs.push('Your GitHub profile demonstrates excellent code quality, consistency, and repository health!');
  }

  return recs;
}

export class GithubService {
  private userId: string;
  private repository: GithubRepository;
  private apiClient: GitHubApiClient;

  constructor(userId: string, apiClient: GitHubApiClient = gitHubApiClient) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('GithubService requires a userId');
    }
    this.userId = userId;
    this.repository = new GithubRepository(userId);
    this.apiClient = apiClient;
  }

  public async getProfile(): Promise<GithubProfile | null> {
    const key = cacheKeys.githubProfile(this.userId);
    return getCached(
      key,
      async () => {
        return this.repository.findByUserId(this.userId);
      },
      {
        ttl: cacheTTL.githubProfile,
        tags: [cacheTags.user(this.userId)],
      },
    );
  }

  /**
   * Acquires a 2-minute distributed lock to reject concurrent sync requests.
   * Throws AppError('RATE_LIMITED') if another sync is already in progress.
   */
  public async acquireSyncLock(): Promise<void> {
    const lockKey = `sync:lock:github:${this.userId}`;
    const acquired = await redis.set(lockKey, '1', { nx: true, ex: 120 });
    if (!acquired) {
      throw new AppError(
        'RATE_LIMITED',
        'A GitHub sync is already in progress. Please wait for it to complete.',
      );
    }
  }

  /**
   * Releases the distributed sync lock.
   */
  public async releaseSyncLock(): Promise<void> {
    const lockKey = `sync:lock:github:${this.userId}`;
    await redis.del(lockKey);
  }

  /**
   * Enforces the 24-hour application rate limit on sync triggers.
   * Throws AppError('RATE_LIMITED') with retry-after details if cooldown is active.
   */
  public async assertSyncAllowed(existingProfile?: GithubProfile | null): Promise<void> {
    const profile = existingProfile !== undefined ? existingProfile : await this.repository.findByUserId(this.userId);
    if (profile?.lastSyncedAt) {
      const now = Date.now();
      const elapsedMs = now - new Date(profile.lastSyncedAt).getTime();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      if (elapsedMs < twentyFourHoursMs) {
        const retryAfterSeconds = Math.ceil((twentyFourHoursMs - elapsedMs) / 1000);
        throw new AppError(
          'RATE_LIMITED',
          `GitHub sync can only be triggered once every 24 hours. Retry after ${retryAfterSeconds} seconds.`,
          'lastSyncedAt',
        );
      }
    }
  }

  public async syncProfile(
    token: string,
    options?: { throwOnRateLimit?: boolean },
  ): Promise<GithubProfile> {
    // Acquire distributed lock to prevent concurrent sync floods
    await this.acquireSyncLock();

    try {
    const existing = await this.repository.findByUserId(this.userId);
    const now = new Date();

    // 24-hour resync limit check
    if (existing?.lastSyncedAt) {
      const elapsedMs = now.getTime() - new Date(existing.lastSyncedAt).getTime();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      if (elapsedMs < twentyFourHoursMs) {
        const retryAfterSeconds = Math.ceil((twentyFourHoursMs - elapsedMs) / 1000);
        logger.info(
          { userId: this.userId, lastSyncedAt: existing.lastSyncedAt, retryAfterSeconds, correlationId: getCorrelationId() },
          'GitHub profile sync throttled (24h cooldown)',
        );
        if (options?.throwOnRateLimit) {
          throw new AppError(
            'RATE_LIMITED',
            `GitHub sync can only be triggered once every 24 hours. Retry after ${retryAfterSeconds} seconds.`,
            'lastSyncedAt',
          );
        }
        return existing;
      }
    }

    logger.info(
      { userId: this.userId, correlationId: getCorrelationId() },
      'Starting GitHub profile synchronization',
    );

    let userProfile;
    let repos: GitHubRepo[] = [];
    let calendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

    try {
      // 1. Fetch user profile
      userProfile = await this.apiClient.getUserProfile(token);

      // Confirm the username passed matches the authenticated GitHub account's login
      const targetUsername = userProfile.login;
      if (existing?.githubUsername && existing.githubUsername.toLowerCase() !== targetUsername.toLowerCase()) {
        logger.warn(
          { userId: this.userId, storedUsername: existing.githubUsername, authenticatedLogin: targetUsername },
          'GitHub login differs from stored githubUsername; using authenticated account login',
        );
      }

      // 2. Fetch user repositories (tracks public and private flags) via public repos endpoint
      repos = await this.apiClient.getRepositories(token, targetUsername, 100, { excludePrivate: true });

      // 3. Fetch contribution calendar via GraphQL
      calendar = await this.apiClient.getContributionCalendar(token, userProfile.login);
    } catch (err: any) {
      // Specified edge case: GitHub rate limit hit mid-sync -> serve cached data with a stale-data indicator
      if (err instanceof AppError && err.code === 'RATE_LIMITED' && existing) {
        logger.warn(
          { userId: this.userId, err, correlationId: getCorrelationId() },
          'GitHub API rate limit hit mid-sync. Serving cached profile with stale-data indicator.',
        );
        const staleRecs = existing.recommendations ? [...existing.recommendations] : [];
        if (!staleRecs.some((r) => r.includes('stale-data indicator') || r.includes('rate limit was encountered'))) {
          staleRecs.unshift('[Stale Data] GitHub API rate limit was encountered during sync. Displaying cached telemetry.');
        }
        return {
          ...existing,
          recommendations: staleRecs,
        };
      }

      // Specified edge case: Expired/revoked GitHub token -> reconnect prompt, not a silent failure
      if (err instanceof AppError && err.code === 'UNAUTHENTICATED') {
        logger.warn(
          { userId: this.userId, correlationId: getCorrelationId() },
          'GitHub token expired or revoked. Reconnect required.',
        );
        throw new AppError(
          'UNAUTHENTICATED',
          'GitHub token expired or revoked. Please reconnect your GitHub account.',
        );
      }

      throw err;
    }

    // Exclude private repos from scoring and public telemetry
    const publicRepos = repos.filter((r) => !r.isPrivate);

    // Compute language distribution strictly from public repos
    const languageDistribution: Record<string, number> = {};
    for (const repo of publicRepos) {
      if (repo.language) {
        const weight = repo.isFork ? 0.5 : 1.0;
        languageDistribution[repo.language] =
          (languageDistribution[repo.language] || 0) + Math.round((repo.size || 1) * weight);
      }
    }

    // Compute top repos from public repos (sorted by stars descending, top 6)
    const sortedRepos = [...publicRepos].sort((a, b) => b.stars - a.stars);
    const topRepos = sortedRepos.slice(0, 6).map((r) => ({
      name: r.name,
      stars: r.stars,
      forks: r.forks,
      url: r.htmlUrl,
      description: r.description,
      language: r.language,
      isInactive: r.isInactive,
    }));

    // Calculate scores (pure function)
    const breakdown = calculateOverallScores(repos, calendar, languageDistribution);
    const recommendations = generateRecommendations(breakdown, repos);

    const totalStars = publicRepos.reduce((acc, r) => acc + (r.stars || 0), 0);
    const totalForks = publicRepos.reduce((acc, r) => acc + (r.forks || 0), 0);

    // Persist to database via GithubRepository
    const profile = await this.repository.upsertProfile(this.userId, {
      userId: this.userId,
      githubUsername: userProfile.login,
      githubScore: breakdown.githubScore,
      repoHealthScore: breakdown.repoHealthScore,
      openSourceScore: breakdown.openSourceScore,
      totalRepos: publicRepos.length,
      totalStars,
      totalForks,
      totalCommitsYear: calendar.totalContributions,
      languageDistribution,
      contributionCalendar: calendar as any,
      topRepos: topRepos as any,
      recommendations,
      lastSyncedAt: now,
    });

    // Invalidate and write-through to Redis cache
    const cacheKey = cacheKeys.githubProfile(this.userId);
    try {
      await invalidateCache(cacheKey);
      await redis.set(cacheKey, profile, { ex: cacheTTL.githubProfile });
      await invalidateByTag(cacheTags.user(this.userId));
    } catch (err) {
      logger.warn(
        { userId: this.userId, err, correlationId: getCorrelationId() },
        'Failed to update GitHub profile cache after sync',
      );
    }

    logger.info(
      {
        userId: this.userId,
        githubScore: breakdown.githubScore,
        correlationId: getCorrelationId(),
      },
      'GitHub profile sync completed successfully',
    );

    return profile;
    } finally {
      await this.releaseSyncLock();
    }
  }
}
