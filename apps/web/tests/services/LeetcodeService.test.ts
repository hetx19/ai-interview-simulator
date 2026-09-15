import { describe, it, expect } from 'vitest';
import {
  calculateSolveScore,
  calculateContestScore,
  calculateOverallLeetcodeScore,
  processTopicPerformance,
  generateLeetcodeRecommendations,
  LeetcodeService,
} from '@/server/services/LeetcodeService';

describe('LeetcodeService Scoring Engine & Fixture Verification', () => {
  describe('calculateSolveScore', () => {
    it('1. Returns 0 points and 0 score when 0 problems are solved', () => {
      const res = calculateSolveScore(0, 0, 0);
      expect(res.rawSolvePoints).toBe(0);
      expect(res.problemScore).toBe(0);
    });

    it('2. Hand-calculated fixture: Easy only (50 Easy = 50 pts -> 10 problemScore)', () => {
      // 50 * 1 = 50 pts; (50 / 500) * 100 = 10
      const res = calculateSolveScore(50, 0, 0);
      expect(res.rawSolvePoints).toBe(50);
      expect(res.problemScore).toBe(10);
    });

    it('3. Hand-calculated fixture: Mixed difficulty (50 Easy, 100 Med, 25 Hard = 325 pts -> 65 problemScore)', () => {
      // 50*1 + 100*2 + 25*3 = 50 + 200 + 75 = 325 pts; (325 / 500) * 100 = 65
      const res = calculateSolveScore(50, 100, 25);
      expect(res.rawSolvePoints).toBe(325);
      expect(res.problemScore).toBe(65);
    });

    it('4. Hand-calculated fixture: High volume caps strictly at 100', () => {
      // 100*1 + 200*2 + 100*3 = 100 + 400 + 300 = 800 pts; (800 / 500) * 100 = 160 -> capped at 100
      const res = calculateSolveScore(100, 200, 100);
      expect(res.rawSolvePoints).toBe(800);
      expect(res.problemScore).toBe(100);
    });

    it('5. Handles negative or undefined counts gracefully by treating as 0', () => {
      const res = calculateSolveScore(-5, 0, -2);
      expect(res.rawSolvePoints).toBe(0);
      expect(res.problemScore).toBe(0);
    });
  });

  describe('calculateContestScore', () => {
    it('6. Returns null when contest rating is absent or <= 0', () => {
      expect(calculateContestScore(null)).toBeNull();
      expect(calculateContestScore(undefined)).toBeNull();
      expect(calculateContestScore(0)).toBeNull();
      expect(calculateContestScore(-100)).toBeNull();
    });

    it('7. Hand-calculated fixture: Floor rating 1200 yields 0 contestScore', () => {
      expect(calculateContestScore(1200)).toBe(0);
      expect(calculateContestScore(1000)).toBe(0); // floored at 0
    });

    it('8. Hand-calculated fixture: 1500 rating yields 30 contestScore', () => {
      // (1500 - 1200) / (2200 - 1200) * 100 = 300 / 1000 * 100 = 30
      expect(calculateContestScore(1500)).toBe(30);
    });

    it('9. Hand-calculated fixture: Knight rating 1850 yields 65 contestScore', () => {
      // (1850 - 1200) / 1000 * 100 = 650 / 1000 * 100 = 65
      expect(calculateContestScore(1850)).toBe(65);
    });

    it('10. Hand-calculated fixture: Guardian rating 2200+ caps at 100 contestScore', () => {
      expect(calculateContestScore(2200)).toBe(100);
      expect(calculateContestScore(2500)).toBe(100);
    });
  });

  describe('calculateOverallLeetcodeScore', () => {
    it('11. 0 problems solved strictly yields 0 leetcodeScore regardless of contest anomalies', () => {
      const res = calculateOverallLeetcodeScore(0, 0, 0, 2000);
      expect(res.leetcodeScore).toBe(0);
    });

    it('12. Without contest rating, final score equals pure problemScore', () => {
      // 50 Easy, 100 Med, 25 Hard = 65 problemScore
      const res = calculateOverallLeetcodeScore(50, 100, 25, null);
      expect(res.rawSolvePoints).toBe(325);
      expect(res.problemScore).toBe(65);
      expect(res.contestScore).toBeNull();
      expect(res.leetcodeScore).toBe(65);
    });

    it('13. Hand-calculated fixture: 65% problemScore + 35% contestScore', () => {
      // Problem points: 100 Easy + 100 Med + 34 Hard = 100 + 200 + 102 = 402 pts -> 402/500 = 80.4 -> 80
      // Contest rating: 1850 -> contestScore = 65
      // Combined: 80 * 0.65 + 65 * 0.35 = 52 + 22.75 = 74.75 -> round = 75
      const res = calculateOverallLeetcodeScore(100, 100, 34, 1850);
      expect(res.problemScore).toBe(80);
      expect(res.contestScore).toBe(65);
      expect(res.leetcodeScore).toBe(75);
    });

    it('14. Result is always an integer between 0 and 100 (DB check-constraint compliance)', () => {
      const res = calculateOverallLeetcodeScore(73, 119, 41, 1943);
      expect(Number.isInteger(res.leetcodeScore)).toBe(true);
      expect(res.leetcodeScore).toBeGreaterThanOrEqual(0);
      expect(res.leetcodeScore).toBeLessThanOrEqual(100);
    });
  });

  describe('processTopicPerformance & Weakness Detection', () => {
    it('15. Classifies topics according to PRD criteria (<3 = Not Started, <10 = Weak, >=10 = Proficient)', () => {
      const tagCounts = {
        fundamental: [
          { tagName: 'Arrays', tagSlug: 'arrays', problemsSolved: 25 },
          { tagName: 'Strings', tagSlug: 'strings', problemsSolved: 5 },
          { tagName: 'Math', tagSlug: 'math', problemsSolved: 1 },
        ],
        intermediate: [
          { tagName: 'Trees', tagSlug: 'trees', problemsSolved: 12 },
          { tagName: 'Graphs', tagSlug: 'graphs', problemsSolved: 8 },
        ],
        advanced: [
          { tagName: 'Dynamic Programming', tagSlug: 'dynamic-programming', problemsSolved: 0 },
        ],
      };

      const { topicPerformance, weakTopics } = processTopicPerformance(tagCounts);

      expect(topicPerformance['Arrays'].status).toBe('Proficient');
      expect(topicPerformance['Trees'].status).toBe('Proficient');

      expect(topicPerformance['Strings'].status).toBe('Weak');
      expect(topicPerformance['Graphs'].status).toBe('Weak');

      expect(topicPerformance['Math'].status).toBe('Not Started');
      expect(topicPerformance['Dynamic Programming'].status).toBe('Not Started');

      expect(weakTopics).toContain('Strings');
      expect(weakTopics).toContain('Graphs');
      expect(weakTopics).toContain('Math');
      expect(weakTopics).toContain('Dynamic Programming');
      expect(weakTopics).not.toContain('Arrays');
    });
  });

  describe('generateLeetcodeRecommendations', () => {
    it('16. Excludes already solved problems and targets weak topics', () => {
      const weakTopics = ['Dynamic Programming', 'Graphs'];
      const solvedSlugs = ['two-sum', 'coin-change'];

      const recs = generateLeetcodeRecommendations(weakTopics, solvedSlugs);

      expect(recs.length).toBeGreaterThan(0);
      expect(recs.some((r) => r.slug === 'two-sum')).toBe(false);
      expect(recs.some((r) => r.slug === 'coin-change')).toBe(false);

      // Top recommendations should prioritize weak topics
      const firstTopic = recs[0].topic;
      expect(['Dynamic Programming', 'Graphs']).toContain(firstTopic);
    });
  });

  describe('LeetcodeService Orchestration & Rate Limiting', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    it('17. assertSyncAllowed throws RATE_LIMITED when profile was synced less than 24h ago', async () => {
      const service = new LeetcodeService(userId);
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      await expect(
        service.assertSyncAllowed({
          id: 'mock-id',
          userId,
          leetcodeUsername: 'alex',
          leetcodeScore: 50,
          totalSolved: 100,
          easySolved: 50,
          mediumSolved: 40,
          hardSolved: 10,
          contestRating: null,
          contestRanking: null,
          streakDays: 5,
          topicPerformance: null,
          weakTopics: [],
          recommendations: null,
          contestHistory: null,
          lastSyncedAt: recentDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).rejects.toMatchObject({
        code: 'RATE_LIMITED',
      });
    });

    it('18. assertSyncAllowed succeeds when profile has never been synced or last sync > 24h', async () => {
      const service = new LeetcodeService(userId);
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      await expect(
        service.assertSyncAllowed({
          id: 'mock-id',
          userId,
          leetcodeUsername: 'alex',
          leetcodeScore: 50,
          totalSolved: 100,
          easySolved: 50,
          mediumSolved: 40,
          hardSolved: 10,
          contestRating: null,
          contestRanking: null,
          streakDays: 5,
          topicPerformance: null,
          weakTopics: [],
          recommendations: null,
          contestHistory: null,
          lastSyncedAt: oldDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).resolves.toBeUndefined();
    });
  });
});
