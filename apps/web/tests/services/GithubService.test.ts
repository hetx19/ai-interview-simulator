import { describe, it, expect, vi } from 'vitest';
import {
  calculateCommitConsistency,
  calculateCodeQuality,
  calculateCommunityEngagement,
  calculateRepositoryHealth,
  calculateLanguageDiversity,
  calculateOverallScores,
  generateRecommendations,
  GithubService,
} from '@/server/services/GithubService';
import { GitHubRepo, ContributionCalendar } from '@/server/external/GitHubApiClient';
import { AppError } from '@/server/graphql/errors';

describe('GithubService Scoring Engine', () => {
  it('1. Returns 0 across all metrics when user has 0 repositories and no contributions', () => {
    const scores = calculateOverallScores([], null, {});
    expect(scores.githubScore).toBe(0);
    expect(scores.repoHealthScore).toBe(0);
    expect(scores.openSourceScore).toBe(0);

    const recs = generateRecommendations(scores, []);
    expect(recs).toContain(
      'Create your first public repository to begin building your GitHub score.',
    );
  });

  it('2. calculateCommitConsistency awards bonus for 14+ day streak', () => {
    const weeks: ContributionCalendar['weeks'] = [];
    let dayCount = 0;
    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        dayCount++;
        const hasCommit = dayCount >= 10 && dayCount <= 25;
        days.push({
          contributionCount: hasCommit ? 2 : 0,
          date: `2025-01-${String(dayCount).padStart(2, '0')}`,
          weekday: d,
        });
      }
      weeks.push({ contributionDays: days });
    }

    const calendar: ContributionCalendar = {
      totalContributions: 32,
      weeks,
    };

    const score = calculateCommitConsistency(calendar);
    expect(score).toBeGreaterThan(0);
  });

  it('3. calculateCommitConsistency penalizes long gaps > 30 days', () => {
    const weeks: ContributionCalendar['weeks'] = [];
    let dayIndex = 0;
    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        dayIndex++;
        const isCommitDay = dayIndex === 1 || dayIndex === 65;
        days.push({
          contributionCount: isCommitDay ? 1 : 0,
          date: `2025-01-01`,
          weekday: d,
        });
      }
      weeks.push({ contributionDays: days });
    }

    const calendar: ContributionCalendar = {
      totalContributions: 2,
      weeks,
    };

    const score = calculateCommitConsistency(calendar);
    expect(score).toBeLessThan(15);
  });

  it('4. calculateCodeQuality assesses licenses and descriptions', () => {
    const reposWithLicenses: GitHubRepo[] = [
      {
        id: 1,
        name: 'repo-1',
        fullName: 'user/repo-1',
        owner: 'user',
        stars: 10,
        forks: 2,
        isFork: false,
        isPrivate: false,
        language: 'TypeScript',
        pushedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        size: 500,
        isInactive: false,
        htmlUrl: 'https://github.com/user/repo-1',
        description: 'Comprehensive developer analytics engine',
        license: 'MIT',
      },
      {
        id: 2,
        name: 'repo-2',
        fullName: 'user/repo-2',
        owner: 'user',
        stars: 5,
        forks: 1,
        isFork: false,
        isPrivate: false,
        language: 'Rust',
        pushedAt: new Date().toISOString(),
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        size: 1000,
        isInactive: false,
        htmlUrl: 'https://github.com/user/repo-2',
        description: 'High performance Redis proxy written in Rust',
        license: 'Apache-2.0',
      },
    ];

    const qualityScore = calculateCodeQuality(reposWithLicenses);
    expect(qualityScore).toBe(100);

    const poorQualityRepos: GitHubRepo[] = [
      {
        ...reposWithLicenses[0]!,
        license: null,
        description: null,
      },
    ];
    const poorScore = calculateCodeQuality(poorQualityRepos);
    expect(poorScore).toBe(20);
  });

  it('5. calculateCommunityEngagement weights forked repos at 50%', () => {
    const originalRepo: GitHubRepo = {
      id: 1,
      name: 'orig',
      fullName: 'user/orig',
      owner: 'user',
      stars: 100,
      forks: 20,
      isFork: false,
      isPrivate: false,
      language: 'Go',
      pushedAt: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      size: 500,
      isInactive: false,
      htmlUrl: '',
      description: 'orig',
      license: 'MIT',
    };

    const forkedRepo: GitHubRepo = {
      ...originalRepo,
      id: 2,
      name: 'fork',
      isFork: true,
    };

    const scoreOrig = calculateCommunityEngagement([originalRepo]);
    const scoreFork = calculateCommunityEngagement([forkedRepo]);

    expect(scoreOrig).toBeGreaterThan(scoreFork);
  });

  it('6. calculateRepositoryHealth computes active vs inactive ratio', () => {
    const repos: GitHubRepo[] = [
      {
        id: 1,
        name: 'active-1',
        fullName: 'u/active-1',
        owner: 'u',
        stars: 0,
        forks: 0,
        isFork: false,
        isPrivate: false,
        language: 'JS',
        pushedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        size: 100,
        isInactive: false,
        htmlUrl: '',
        description: null,
        license: null,
      },
      {
        id: 2,
        name: 'inactive-1',
        fullName: 'u/inactive-1',
        owner: 'u',
        stars: 0,
        forks: 0,
        isFork: false,
        isPrivate: false,
        language: 'JS',
        pushedAt: '2022-01-01T00:00:00Z',
        createdAt: '2022-01-01T00:00:00Z',
        updatedAt: '2022-01-01T00:00:00Z',
        size: 100,
        isInactive: true,
        htmlUrl: '',
        description: null,
        license: null,
      },
    ];

    const health = calculateRepositoryHealth(repos);
    expect(health).toBe(50);
  });

  it('7. calculateLanguageDiversity uses Shannon diversity index', () => {
    const singleLang = calculateLanguageDiversity({ TypeScript: 10000 });
    expect(singleLang).toBe(30);

    const multiLang = calculateLanguageDiversity({
      TypeScript: 2500,
      Python: 2500,
      Rust: 2500,
      Go: 2500,
    });
    expect(multiLang).toBeGreaterThan(80);
  });

  it('8. Excludes private repositories from score calculations', () => {
    const publicRepo: GitHubRepo = {
      id: 1,
      name: 'public-repo',
      fullName: 'u/public-repo',
      owner: 'u',
      stars: 50,
      forks: 10,
      isFork: false,
      isPrivate: false,
      language: 'TypeScript',
      pushedAt: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      size: 500,
      isInactive: false,
      htmlUrl: '',
      description: 'Public tools',
      license: 'MIT',
    };

    const privateRepo: GitHubRepo = {
      id: 2,
      name: 'private-repo',
      fullName: 'u/private-repo',
      owner: 'u',
      stars: 500, // Large star count in private repo should NOT inflate public score
      forks: 100,
      isFork: false,
      isPrivate: true,
      language: 'Rust',
      pushedAt: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      size: 5000,
      isInactive: false,
      htmlUrl: '',
      description: 'Secret proprietary algorithm',
      license: null,
    };

    const scoreWithBoth = calculateOverallScores([publicRepo, privateRepo], null, { TypeScript: 500 });
    const scorePublicOnly = calculateOverallScores([publicRepo], null, { TypeScript: 500 });

    // Both scores must be identical because privateRepo is excluded from analysis
    expect(scoreWithBoth.githubScore).toBe(scorePublicOnly.githubScore);
    expect(scoreWithBoth.communityEngagement).toBe(scorePublicOnly.communityEngagement);
    expect(scoreWithBoth.codeQuality).toBe(scorePublicOnly.codeQuality);
  });

  it('9. Handles private-only profile edge case with partial analysis and warning', () => {
    const privateRepo: GitHubRepo = {
      id: 1,
      name: 'private-only',
      fullName: 'u/private-only',
      owner: 'u',
      stars: 10,
      forks: 0,
      isFork: false,
      isPrivate: true,
      language: 'Python',
      pushedAt: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      size: 200,
      isInactive: false,
      htmlUrl: '',
      description: 'Private research',
      license: null,
    };

    const calendar: ContributionCalendar = {
      totalContributions: 50,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2025-01-01', weekday: 1 },
          ],
        },
      ],
    };

    const scores = calculateOverallScores([privateRepo], calendar, {});
    // Repository metrics are 0, commit consistency from calendar is computed partially
    expect(scores.codeQuality).toBe(0);
    expect(scores.communityEngagement).toBe(0);
    expect(scores.repositoryHealth).toBe(0);
    expect(scores.commitConsistency).toBeGreaterThan(0);

    const recs = generateRecommendations(scores, [privateRepo]);
    expect(recs[0]).toContain('Your profile only contains private repositories');
    expect(recs[0]).toContain('reduced accuracy');
  });

  it('10. Throttles sync when lastSyncedAt is within 24 hours', async () => {
    const service = new GithubService('test-user-id');
    const mockRepo = (service as any).repository;

    const recentSync = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    vi.spyOn(mockRepo, 'findByUserId').mockResolvedValueOnce({
      id: 'prof-123',
      userId: 'test-user-id',
      lastSyncedAt: recentSync,
      githubScore: 85,
    });

    const result = await service.syncProfile('fake_token', { force: false });
    expect(result.githubScore).toBe(85);
  });

  it('11. assertSyncAllowed throws RATE_LIMITED within 24 hours and succeeds after 24 hours', async () => {
    const service = new GithubService('test-user-id');
    const mockRepo = (service as any).repository;

    // Cooldown active (2 hours ago)
    const recentSync = new Date(Date.now() - 2 * 60 * 60 * 1000);
    vi.spyOn(mockRepo, 'findByUserId').mockResolvedValueOnce({
      id: 'prof-123',
      userId: 'test-user-id',
      lastSyncedAt: recentSync,
    });

    await expect(service.assertSyncAllowed()).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });

    // Cooldown expired (25 hours ago)
    const oldSync = new Date(Date.now() - 25 * 60 * 60 * 1000);
    vi.spyOn(mockRepo, 'findByUserId').mockResolvedValueOnce({
      id: 'prof-123',
      userId: 'test-user-id',
      lastSyncedAt: oldSync,
    });

    await expect(service.assertSyncAllowed()).resolves.toBeUndefined();
  });

  it('12. Mid-sync rate limit serves cached data with stale-data indicator', async () => {
    const mockApiClient = {
      getUserProfile: vi.fn().mockRejectedValue(new AppError('RATE_LIMITED', 'GitHub rate limit exceeded')),
      getRepositories: vi.fn(),
      getContributionCalendar: vi.fn(),
    } as any;

    const service = new GithubService('test-user-id', mockApiClient);
    const mockRepo = (service as any).repository;

    vi.spyOn(mockRepo, 'findByUserId').mockResolvedValueOnce({
      id: 'prof-123',
      userId: 'test-user-id',
      githubScore: 82,
      recommendations: ['Great consistency!'],
      lastSyncedAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // > 24h ago
    });

    const profile = await service.syncProfile('fake_token', { force: true });
    expect(profile.githubScore).toBe(82);
    expect(profile.recommendations?.some((r) => r.includes('[Stale Data]'))).toBe(true);
  });

  it('13. Expired or revoked GitHub token throws UNAUTHENTICATED error for reconnection', async () => {
    const mockApiClient = {
      getUserProfile: vi.fn().mockRejectedValue(new AppError('UNAUTHENTICATED', 'Bad credentials')),
      getRepositories: vi.fn(),
      getContributionCalendar: vi.fn(),
    } as any;

    const service = new GithubService('test-user-id', mockApiClient);
    const mockRepo = (service as any).repository;

    vi.spyOn(mockRepo, 'findByUserId').mockResolvedValueOnce(null);

    await expect(service.syncProfile('expired_token', { force: true })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: expect.stringContaining('reconnect'),
    });
  });
});
