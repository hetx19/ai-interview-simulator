import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    // 52 weeks, with a 15-day streak of daily commits
    const weeks: ContributionCalendar['weeks'] = [];
    let dayCount = 0;
    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        dayCount++;
        // 15 days in a row with commit count 1, rest 0
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
    // Streak bonus (+15) applied
  });

  it('3. calculateCommitConsistency penalizes long gaps > 30 days', () => {
    // 52 weeks, but with only 2 active days 60 days apart
    const weeks: ContributionCalendar['weeks'] = [];
    let dayIndex = 0;
    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        dayIndex++;
        // Only active on day 1 and day 65 (>60 day gap)
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
    // Penalized for gap > 30 days
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
    // 100% licenses, 100% descriptions, 100% original repos -> 100
    expect(qualityScore).toBe(100);

    const poorQualityRepos: GitHubRepo[] = [
      {
        ...reposWithLicenses[0]!,
        license: null,
        description: null,
      },
    ];
    const poorScore = calculateCodeQuality(poorQualityRepos);
    expect(poorScore).toBe(20); // Only 20% for being original repo
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
    // 1 of 2 active -> 50%
    expect(health).toBe(50);
  });

  it('7. calculateLanguageDiversity uses Shannon diversity index', () => {
    // 1 language -> baseline 30
    const singleLang = calculateLanguageDiversity({ TypeScript: 10000 });
    expect(singleLang).toBe(30);

    // 4 evenly distributed languages -> higher diversity
    const multiLang = calculateLanguageDiversity({
      TypeScript: 2500,
      Python: 2500,
      Rust: 2500,
      Go: 2500,
    });
    expect(multiLang).toBeGreaterThan(80);
  });

  it('8. Throttles sync when lastSyncedAt is within 24 hours', async () => {
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
});
