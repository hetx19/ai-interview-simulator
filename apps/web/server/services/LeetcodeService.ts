import { LeetcodeApiClient, leetcodeApiClient, LeetcodeRawData, LeetcodeTagCount } from '@/server/external/LeetcodeApiClient';
import { LeetcodeRepository } from '@/server/repositories/LeetcodeRepository';
import { cacheKeys, cacheTags, cacheTTL } from '@/lib/cache/cacheKeys';
import { redis, getCached, invalidateCache, invalidateByTag } from '@/server/cache/redisClient';
import { AppError } from '@/server/graphql/errors';
import { logger } from '@/server/logging/logger';
import { getCorrelationId, runWithCorrelation } from '@/server/logging/correlationStore';
import type { LeetcodeProfile } from '@prisma/client';

export interface LeetcodeScoreBreakdown {
  rawSolvePoints: number;
  problemScore: number;
  contestScore: number | null;
  leetcodeScore: number; // 0-100 bounded
}

export interface CuratedProblem {
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  url: string;
}

export const CURATED_PROBLEM_BANK: CuratedProblem[] = [
  // Sliding Window
  {
    slug: 'longest-repeating-character-replacement',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    url: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
  },
  {
    slug: 'permutation-in-string',
    title: 'Permutation in String',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    url: 'https://leetcode.com/problems/permutation-in-string/',
  },
  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    topic: 'Sliding Window',
    url: 'https://leetcode.com/problems/minimum-window-substring/',
  },
  {
    slug: 'sliding-window-maximum',
    title: 'Sliding Window Maximum',
    difficulty: 'Hard',
    topic: 'Sliding Window',
    url: 'https://leetcode.com/problems/sliding-window-maximum/',
  },
  {
    slug: 'minimum-size-subarray-sum',
    title: 'Minimum Size Subarray Sum',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    url: 'https://leetcode.com/problems/minimum-size-subarray-sum/',
  },

  // Monotonic Stack / Queue
  {
    slug: 'daily-temperatures',
    title: 'Daily Temperatures',
    difficulty: 'Medium',
    topic: 'Monotonic Stack',
    url: 'https://leetcode.com/problems/daily-temperatures/',
  },
  {
    slug: 'next-greater-element-ii',
    title: 'Next Greater Element II',
    difficulty: 'Medium',
    topic: 'Monotonic Stack',
    url: 'https://leetcode.com/problems/next-greater-element-ii/',
  },
  {
    slug: 'online-stock-span',
    title: 'Online Stock Span',
    difficulty: 'Medium',
    topic: 'Monotonic Stack',
    url: 'https://leetcode.com/problems/online-stock-span/',
  },
  {
    slug: 'largest-rectangle-in-histogram',
    title: 'Largest Rectangle in Histogram',
    difficulty: 'Hard',
    topic: 'Monotonic Stack',
    url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/',
  },
  {
    slug: 'maximal-rectangle',
    title: 'Maximal Rectangle',
    difficulty: 'Hard',
    topic: 'Monotonic Stack',
    url: 'https://leetcode.com/problems/maximal-rectangle/',
  },

  // Topological Sort
  {
    slug: 'course-schedule-ii',
    title: 'Course Schedule II',
    difficulty: 'Medium',
    topic: 'Topological Sort',
    url: 'https://leetcode.com/problems/course-schedule-ii/',
  },
  {
    slug: 'alien-dictionary',
    title: 'Alien Dictionary',
    difficulty: 'Hard',
    topic: 'Topological Sort',
    url: 'https://leetcode.com/problems/alien-dictionary/',
  },
  {
    slug: 'minimum-height-trees',
    title: 'Minimum Height Trees',
    difficulty: 'Medium',
    topic: 'Topological Sort',
    url: 'https://leetcode.com/problems/minimum-height-trees/',
  },
  {
    slug: 'find-eventual-safe-states',
    title: 'Find Eventual Safe States',
    difficulty: 'Medium',
    topic: 'Topological Sort',
    url: 'https://leetcode.com/problems/find-eventual-safe-states/',
  },

  // Shortest Path / Advanced Graphs
  {
    slug: 'network-delay-time',
    title: 'Network Delay Time',
    difficulty: 'Medium',
    topic: 'Shortest Path',
    url: 'https://leetcode.com/problems/network-delay-time/',
  },
  {
    slug: 'cheapest-flights-within-k-stops',
    title: 'Cheapest Flights Within K Stops',
    difficulty: 'Medium',
    topic: 'Shortest Path',
    url: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/',
  },
  {
    slug: 'path-with-maximum-probability',
    title: 'Path with Maximum Probability',
    difficulty: 'Medium',
    topic: 'Shortest Path',
    url: 'https://leetcode.com/problems/path-with-maximum-probability/',
  },
  {
    slug: 'swim-in-rising-water',
    title: 'Swim in Rising Water',
    difficulty: 'Hard',
    topic: 'Shortest Path',
    url: 'https://leetcode.com/problems/swim-in-rising-water/',
  },

  // Segment Tree & Binary Indexed Tree
  {
    slug: 'range-sum-query-mutable',
    title: 'Range Sum Query - Mutable',
    difficulty: 'Medium',
    topic: 'Segment Tree',
    url: 'https://leetcode.com/problems/range-sum-query-mutable/',
  },
  {
    slug: 'count-of-smaller-numbers-after-self',
    title: 'Count of Smaller Numbers After Self',
    difficulty: 'Hard',
    topic: 'Segment Tree',
    url: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/',
  },
  {
    slug: 'the-skyline-problem',
    title: 'The Skyline Problem',
    difficulty: 'Hard',
    topic: 'Segment Tree',
    url: 'https://leetcode.com/problems/the-skyline-problem/',
  },

  // Trie
  {
    slug: 'implement-trie-prefix-tree',
    title: 'Implement Trie (Prefix Tree)',
    difficulty: 'Medium',
    topic: 'Trie',
    url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
  },
  {
    slug: 'design-add-and-search-words-data-structure',
    title: 'Design Add and Search Words Data Structure',
    difficulty: 'Medium',
    topic: 'Trie',
    url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/',
  },
  {
    slug: 'word-search-ii',
    title: 'Word Search II',
    difficulty: 'Hard',
    topic: 'Trie',
    url: 'https://leetcode.com/problems/word-search-ii/',
  },

  // Union-Find / Disjoint Set
  {
    slug: 'redundant-connection',
    title: 'Redundant Connection',
    difficulty: 'Medium',
    topic: 'Union-Find',
    url: 'https://leetcode.com/problems/redundant-connection/',
  },
  {
    slug: 'number-of-provinces',
    title: 'Number of Provinces',
    difficulty: 'Medium',
    topic: 'Union-Find',
    url: 'https://leetcode.com/problems/number-of-provinces/',
  },
  {
    slug: 'accounts-merge',
    title: 'Accounts Merge',
    difficulty: 'Medium',
    topic: 'Union-Find',
    url: 'https://leetcode.com/problems/accounts-merge/',
  },

  // Queue & Design
  {
    slug: 'design-circular-queue',
    title: 'Design Circular Queue',
    difficulty: 'Medium',
    topic: 'Queue',
    url: 'https://leetcode.com/problems/design-circular-queue/',
  },
  {
    slug: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    topic: 'Design',
    url: 'https://leetcode.com/problems/lru-cache/',
  },
  {
    slug: 'lfu-cache',
    title: 'LFU Cache',
    difficulty: 'Hard',
    topic: 'Design',
    url: 'https://leetcode.com/problems/lfu-cache/',
  },

  // Dynamic Programming
  {
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    url: 'https://leetcode.com/problems/coin-change/',
  },
  {
    slug: 'target-sum',
    title: 'Target Sum',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    url: 'https://leetcode.com/problems/target-sum/',
  },
  {
    slug: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    url: 'https://leetcode.com/problems/longest-increasing-subsequence/',
  },
  {
    slug: 'edit-distance',
    title: 'Edit Distance',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    url: 'https://leetcode.com/problems/edit-distance/',
  },
  {
    slug: 'maximum-profit-in-job-scheduling',
    title: 'Maximum Profit in Job Scheduling',
    difficulty: 'Hard',
    topic: 'Dynamic Programming',
    url: 'https://leetcode.com/problems/maximum-profit-in-job-scheduling/',
  },

  // Graphs
  {
    slug: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'Medium',
    topic: 'Graphs',
    url: 'https://leetcode.com/problems/number-of-islands/',
  },
  {
    slug: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Medium',
    topic: 'Graphs',
    url: 'https://leetcode.com/problems/course-schedule/',
  },
  {
    slug: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'Hard',
    topic: 'Graphs',
    url: 'https://leetcode.com/problems/word-ladder/',
  },

  // Binary Search
  {
    slug: 'koko-eating-bananas',
    title: 'Koko Eating Bananas',
    difficulty: 'Medium',
    topic: 'Binary Search',
    url: 'https://leetcode.com/problems/koko-eating-bananas/',
  },
  {
    slug: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    topic: 'Binary Search',
    url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
  },
  {
    slug: 'median-of-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    topic: 'Binary Search',
    url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
  },

  // Trees
  {
    slug: 'lowest-common-ancestor-of-a-binary-tree',
    title: 'Lowest Common Ancestor of a Binary Tree',
    difficulty: 'Medium',
    topic: 'Trees',
    url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
  },
  {
    slug: 'binary-tree-maximum-path-sum',
    title: 'Binary Tree Maximum Path Sum',
    difficulty: 'Hard',
    topic: 'Trees',
    url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
  },

  // Two Pointers & Arrays
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    topic: 'Two Pointers',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
  },
  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    url: 'https://leetcode.com/problems/container-with-most-water/',
  },
  {
    slug: '3sum',
    title: '3Sum',
    difficulty: 'Medium',
    topic: 'Arrays',
    url: 'https://leetcode.com/problems/3sum/',
  },
  {
    slug: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    difficulty: 'Hard',
    topic: 'Heaps',
    url: 'https://leetcode.com/problems/merge-k-sorted-lists/',
  },

  // Foundational Benchmarks
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays',
    url: 'https://leetcode.com/problems/two-sum/',
  },
  {
    slug: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    topic: 'Arrays',
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  },
  {
    slug: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    topic: 'Strings',
    url: 'https://leetcode.com/problems/valid-anagram/',
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Strings',
    url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
  },
];

/**
 * Calculates raw problem points based on standard FAANG weighting:
 * Easy = 1 pt, Medium = 2 pts, Hard = 3 pts.
 * Reference maximum is 500 points for a full 100 problemScore.
 */
export function calculateSolveScore(
  easySolved: number,
  mediumSolved: number,
  hardSolved: number,
): { rawSolvePoints: number; problemScore: number } {
  const easy = Math.max(0, Math.floor(easySolved || 0));
  const medium = Math.max(0, Math.floor(mediumSolved || 0));
  const hard = Math.max(0, Math.floor(hardSolved || 0));

  const total = easy + medium + hard;
  if (total === 0) {
    return { rawSolvePoints: 0, problemScore: 0 };
  }

  const rawSolvePoints = easy * 1 + medium * 2 + hard * 3;
  // 500 points is calibrated for senior/FAANG bar (e.g. 100 Easy + 150 Medium + 50 Hard)
  const normalized = (rawSolvePoints / 500) * 100;
  const problemScore = Math.max(0, Math.min(100, Math.round(normalized)));

  return { rawSolvePoints, problemScore };
}

/**
 * Normalizes LeetCode contest rating (1200 floor to 2200 Guardian top percentile).
 * Returns null if no contest rating exists.
 */
export function calculateContestScore(contestRating?: number | null): number | null {
  if (!contestRating || contestRating <= 0) {
    return null;
  }

  // Scale: 1200 rating -> 0 score, 2200 rating -> 100 score
  const normalized = ((contestRating - 1200) / (2200 - 1200)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/**
 * Combines problem score and contest rating into a single integer between 0 and 100.
 * If contest data is unavailable, 100% of score comes from problems solved.
 * If contest data is present: 65% problem score + 35% contest score.
 */
export function calculateOverallLeetcodeScore(
  easySolved: number,
  mediumSolved: number,
  hardSolved: number,
  contestRating?: number | null,
): LeetcodeScoreBreakdown {
  const { rawSolvePoints, problemScore } = calculateSolveScore(
    easySolved,
    mediumSolved,
    hardSolved,
  );

  if (rawSolvePoints === 0) {
    return {
      rawSolvePoints: 0,
      problemScore: 0,
      contestScore: null,
      leetcodeScore: 0,
    };
  }

  const contestScore = calculateContestScore(contestRating);

  let finalScore: number;
  if (contestScore === null) {
    finalScore = problemScore;
  } else {
    finalScore = Math.round(problemScore * 0.65 + contestScore * 0.35);
  }

  const leetcodeScore = Math.max(0, Math.min(100, finalScore));

  return {
    rawSolvePoints,
    problemScore,
    contestScore,
    leetcodeScore,
  };
}

/**
 * Categorizes topic performance and identifies weak areas:
 * - < 3 solved in category = "Not Started"
 * - < 10 solved (or low coverage) = "Weak"
 * - >= 10 solved = "Proficient"
 */
const CORE_PRIORITY_TOPICS = [
  'Sliding Window',
  'Monotonic Stack',
  'Topological Sort',
  'Segment Tree',
  'Binary Indexed Tree',
  'Shortest Path',
  'Trie',
  'Union-Find',
  'Dynamic Programming',
  'Binary Search',
  'Two Pointers',
  'Trees',
  'Tree',
  'Graphs',
  'Graph Theory',
  'Heaps',
  'Queue',
  'Stack',
  'Backtracking',
  'Recursion',
  'Bit Manipulation',
  'Linked List',
];

export function processTopicPerformance(tagCounts?: {
  fundamental?: LeetcodeTagCount[];
  intermediate?: LeetcodeTagCount[];
  advanced?: LeetcodeTagCount[];
}): {
  topicPerformance: Record<string, { solved: number; category: string; status: string }>;
  weakTopics: string[];
} {
  const performance: Record<string, { solved: number; category: string; status: string }> = {};
  const weakTopics: string[] = [];

  const categories: Array<['fundamental' | 'intermediate' | 'advanced', LeetcodeTagCount[]]> = [
    ['fundamental', tagCounts?.fundamental || []],
    ['intermediate', tagCounts?.intermediate || []],
    ['advanced', tagCounts?.advanced || []],
  ];

  for (const [category, tags] of categories) {
    for (const tag of tags) {
      const solved = tag.problemsSolved || 0;
      let status = 'Proficient';

      if (solved < 3) {
        status = 'Not Started';
        weakTopics.push(tag.tagName);
      } else if (solved < 10) {
        status = 'Weak';
        weakTopics.push(tag.tagName);
      }

      performance[tag.tagName] = {
        solved,
        category,
        status,
      };
    }
  }

  // Prioritize core high-yield interview topics in weakTopics
  weakTopics.sort((a, b) => {
    const aIdx = CORE_PRIORITY_TOPICS.indexOf(a);
    const bIdx = CORE_PRIORITY_TOPICS.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });

  return { topicPerformance: performance, weakTopics };
}

/**
 * Generates personalized recommendations focused on weak or untouched topics,
 * avoiding already solved problems and matching the user's proficiency level.
 */
export function generateLeetcodeRecommendations(
  weakTopics: string[],
  solvedSlugs: string[] = [],
  totalSolved = 0,
): CuratedProblem[] {
  const solvedSet = new Set(solvedSlugs.map((s) => s.toLowerCase()));
  const weakSet = new Set(weakTopics.map((t) => t.toLowerCase()));

  // Prioritize problems matching user's weak topics
  const targeted: CuratedProblem[] = [];
  const general: CuratedProblem[] = [];

  // For experienced users (>100 problems solved), avoid recommending elementary Easy problems
  const isExperienced = totalSolved > 100;

  for (const prob of CURATED_PROBLEM_BANK) {
    if (solvedSet.has(prob.slug.toLowerCase())) {
      continue;
    }

    if (isExperienced && prob.difficulty === 'Easy') {
      continue;
    }

    const probTopicLower = prob.topic.toLowerCase();
    const matchesWeakTopic =
      weakSet.has(probTopicLower) ||
      Array.from(weakSet).some(
        (w) => probTopicLower.includes(w) || w.includes(probTopicLower),
      );

    if (matchesWeakTopic) {
      targeted.push(prob);
    } else {
      general.push(prob);
    }
  }

  const combined = [...targeted, ...general];

  // If filtered too strictly, backfill with remaining bank problems not yet solved
  if (combined.length < 6) {
    for (const prob of CURATED_PROBLEM_BANK) {
      if (solvedSet.has(prob.slug.toLowerCase())) continue;
      if (!combined.some((c) => c.slug === prob.slug)) {
        combined.push(prob);
      }
      if (combined.length >= 6) break;
    }
  }

  return combined.slice(0, 6);
}

export class LeetcodeService {
  private userId: string;
  private repository: LeetcodeRepository;
  private apiClient: LeetcodeApiClient;

  constructor(userId: string, apiClient: LeetcodeApiClient = leetcodeApiClient) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('LeetcodeService requires a userId');
    }
    this.userId = userId;
    this.repository = new LeetcodeRepository(userId);
    this.apiClient = apiClient;
  }

  /**
   * Retrieves profile from cache or database via tenant repository.
   */
  public async getProfile(): Promise<LeetcodeProfile | null> {
    const key = cacheKeys.leetcodeProfile(this.userId);
    return getCached(
      key,
      async () => {
        return this.repository.findByUserId();
      },
      {
        ttl: cacheTTL.leetcodeProfile,
        tags: [cacheTags.user(this.userId)],
      },
    );
  }

  /**
   * Enforces 24-hour rate limit on synchronization triggers.
   */
  public async assertSyncAllowed(existingProfile?: LeetcodeProfile | null): Promise<void> {
    const profile =
      existingProfile !== undefined
        ? existingProfile
        : await this.repository.findByUserId();

    if (profile?.lastSyncedAt) {
      const now = Date.now();
      const elapsedMs = now - new Date(profile.lastSyncedAt).getTime();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      if (elapsedMs < twentyFourHoursMs) {
        const retryAfterSeconds = Math.ceil((twentyFourHoursMs - elapsedMs) / 1000);
        throw new AppError(
          'RATE_LIMITED',
          `LeetCode sync can only be triggered once every 24 hours. Retry after ${retryAfterSeconds} seconds.`,
          'lastSyncedAt',
        );
      }
    }
  }

  /**
   * Acquires a 2-minute distributed lock to reject concurrent sync requests.
   * Throws AppError('RATE_LIMITED') if another sync is already in progress.
   */
  public async acquireSyncLock(): Promise<void> {
    const lockKey = `sync:lock:leetcode:${this.userId}`;
    const acquired = await redis.set(lockKey, '1', { nx: true, ex: 120 });
    if (!acquired) {
      throw new AppError(
        'RATE_LIMITED',
        'A LeetCode sync is already in progress. Please wait for it to complete.',
      );
    }
  }

  /**
   * Releases the distributed sync lock.
   */
  public async releaseSyncLock(): Promise<void> {
    const lockKey = `sync:lock:leetcode:${this.userId}`;
    await redis.del(lockKey);
  }

  /**
   * Synchronizes LeetCode profile data from public API, evaluates scoring, and persists.
   */
  public async syncProfile(
    username: string,
    options?: { throwOnRateLimit?: boolean },
  ): Promise<LeetcodeProfile> {
    const correlationId = getCorrelationId();

    // Acquire distributed lock to prevent concurrent sync floods
    await this.acquireSyncLock();

    try {
    return await runWithCorrelation({ correlationId, userId: this.userId }, async () => {
      const existing = await this.repository.findByUserId();
      const now = new Date();

      // 24-hour rate limit check
      if (existing?.lastSyncedAt) {
        const elapsedMs = now.getTime() - new Date(existing.lastSyncedAt).getTime();
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;

        if (elapsedMs < twentyFourHoursMs) {
          const retryAfterSeconds = Math.ceil((twentyFourHoursMs - elapsedMs) / 1000);
          logger.info(
            {
              userId: this.userId,
              lastSyncedAt: existing.lastSyncedAt,
              retryAfterSeconds,
              correlationId,
            },
            'LeetCode profile sync throttled (24h cooldown)',
          );

          if (options?.throwOnRateLimit) {
            throw new AppError(
              'RATE_LIMITED',
              `LeetCode sync can only be triggered once every 24 hours. Retry after ${retryAfterSeconds} seconds.`,
              'lastSyncedAt',
            );
          }
          return existing;
        }
      }

      logger.info(
        { userId: this.userId, username, correlationId },
        'Starting LeetCode profile synchronization',
      );

      let rawData: LeetcodeRawData;
      try {
        rawData = await this.apiClient.getUserProfile(username);
      } catch (err: any) {
        // If LeetCode API rate limit hit mid-sync, return cached profile if available
        if (err instanceof AppError && err.code === 'RATE_LIMITED' && existing) {
          logger.warn(
            { userId: this.userId, err, correlationId },
            'LeetCode API rate limit encountered. Serving cached profile.',
          );
          return existing;
        }
        throw err;
      }

      // Compute scores
      const breakdown = calculateOverallLeetcodeScore(
        rawData.easySolved,
        rawData.mediumSolved,
        rawData.hardSolved,
        rawData.contestRating,
      );

      // Analyze topics and weaknesses
      const { topicPerformance, weakTopics } = processTopicPerformance(
        rawData.tagProblemCounts,
      );

      // Generate problem recommendations avoiding recent solved problems and calibrated by experience
      const recommendations = generateLeetcodeRecommendations(
        weakTopics,
        rawData.recentAcSlugs || [],
        rawData.totalSolved,
      );

      // Persist to database via repository
      const profile = await this.repository.upsertProfile(this.userId, {
        userId: this.userId,
        leetcodeUsername: rawData.username,
        leetcodeScore: breakdown.leetcodeScore,
        totalSolved: rawData.totalSolved,
        easySolved: rawData.easySolved,
        mediumSolved: rawData.mediumSolved,
        hardSolved: rawData.hardSolved,
        contestRating: rawData.contestRating ?? null,
        contestRanking: rawData.contestRanking ?? null,
        streakDays: rawData.streakDays,
        topicPerformance: topicPerformance as any,
        weakTopics,
        recommendations: recommendations as any,
        contestHistory: (rawData.contestHistory || []) as any,
        lastSyncedAt: now,
      });

      // Invalidate and write through to Redis cache
      const cacheKey = cacheKeys.leetcodeProfile(this.userId);
      try {
        await invalidateCache(cacheKey);
        await redis.set(cacheKey, profile, { ex: cacheTTL.leetcodeProfile });
        await invalidateByTag(cacheTags.user(this.userId));
      } catch (cacheErr) {
        logger.warn(
          { userId: this.userId, cacheErr, correlationId },
          'Failed to update LeetCode profile cache after sync',
        );
      }

      logger.info(
        {
          userId: this.userId,
          leetcodeScore: breakdown.leetcodeScore,
          totalSolved: rawData.totalSolved,
          correlationId,
        },
        'LeetCode profile sync completed successfully',
      );

      return profile;
    });
    } finally {
      await this.releaseSyncLock();
    }
  }

  /**
   * Supports manual profile entry / self-reporting fallback when public API is unavailable.
   */
  public async saveManualProfile(data: {
    leetcodeUsername: string;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    contestRating?: number | null;
    streakDays?: number;
    topicPerformance?: Record<string, any>;
  }): Promise<LeetcodeProfile> {
    const correlationId = getCorrelationId();

    return runWithCorrelation({ correlationId, userId: this.userId }, async () => {
      const username = data.leetcodeUsername?.trim();
      if (!username) {
        throw new AppError('VALIDATION_ERROR', 'LeetCode username is required', 'leetcodeUsername');
      }

      const easy = Math.max(0, Math.floor(data.easySolved || 0));
      const medium = Math.max(0, Math.floor(data.mediumSolved || 0));
      const hard = Math.max(0, Math.floor(data.hardSolved || 0));
      const total = easy + medium + hard;

      const breakdown = calculateOverallLeetcodeScore(
        easy,
        medium,
        hard,
        data.contestRating,
      );

      const weakTopics = Object.entries(data.topicPerformance || {})
        .filter(([, val]) => val?.status === 'Weak' || val?.status === 'Not Started')
        .map(([key]) => key);

      const recommendations = generateLeetcodeRecommendations(weakTopics, [], total);

      const profile = await this.repository.upsertProfile(this.userId, {
        userId: this.userId,
        leetcodeUsername: username,
        leetcodeScore: breakdown.leetcodeScore,
        totalSolved: total,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        contestRating: data.contestRating ?? null,
        contestRanking: null,
        streakDays: data.streakDays ?? 0,
        topicPerformance: data.topicPerformance || {},
        weakTopics,
        recommendations: recommendations as any,
        contestHistory: [],
        lastSyncedAt: new Date(),
      });

      const cacheKey = cacheKeys.leetcodeProfile(this.userId);
      try {
        await invalidateCache(cacheKey);
        await redis.set(cacheKey, profile, { ex: cacheTTL.leetcodeProfile });
        await invalidateByTag(cacheTags.user(this.userId));
      } catch (cacheErr) {
        logger.warn(
          { userId: this.userId, cacheErr, correlationId },
          'Failed to update LeetCode profile cache after manual save',
        );
      }

      return profile;
    });
  }
}
