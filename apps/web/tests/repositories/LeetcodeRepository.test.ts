import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/prisma';
import { LeetcodeRepository } from '@/server/repositories/LeetcodeRepository';
import crypto from 'node:crypto';

describe('LeetcodeRepository Tenant Isolation', () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeAll(async () => {
    const runId = crypto.randomUUID().slice(0, 8);

    userA = await db.user.create({
      data: {
        email: `lc-repo-user-a-${runId}@example.com`,
        username: `lc_a_${runId}`,
        name: 'User A',
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });

    userB = await db.user.create({
      data: {
        email: `lc-repo-user-b-${runId}@example.com`,
        username: `lc_b_${runId}`,
        name: 'User B',
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });

    // Seed profile for User B
    await db.leetcodeProfile.create({
      data: {
        userId: userB.id,
        leetcodeUsername: 'user_b_leetcode',
        leetcodeScore: 82,
        totalSolved: 350,
        easySolved: 100,
        mediumSolved: 200,
        hardSolved: 50,
        contestRating: 1950,
        streakDays: 45,
        topicPerformance: { Arrays: { solved: 50, category: 'fundamental', status: 'Proficient' } },
        weakTopics: ['Dynamic Programming'],
      },
    });
  });

  afterAll(async () => {
    const ids = [userA?.id, userB?.id].filter(Boolean);
    if (ids.length > 0) {
      await db.leetcodeProfile.deleteMany({ where: { userId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('1. Constructor throws if userId is empty or missing', () => {
    expect(() => new LeetcodeRepository('')).toThrow('BaseRepository requires a userId');
    expect(() => new LeetcodeRepository('   ')).toThrow('BaseRepository requires a userId');
  });

  it('2. findByUserId returns null for User A before any profile is created (does not bleed User B)', async () => {
    const repoA = new LeetcodeRepository(userA.id);
    const profileA = await repoA.findByUserId();

    expect(profileA).toBeNull();
  });

  it('3. User A is forbidden from querying User B profile explicitly', async () => {
    const repoA = new LeetcodeRepository(userA.id);

    await expect(repoA.findByUserId(userB.id)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('4. User A can create and read back their own LeetCode profile', async () => {
    const repoA = new LeetcodeRepository(userA.id);

    const created = await repoA.upsertProfile(userA.id, {
      leetcodeUsername: 'user_a_leetcode',
      leetcodeScore: 65,
      totalSolved: 150,
      easySolved: 50,
      mediumSolved: 80,
      hardSolved: 20,
      contestRating: 1600,
      streakDays: 14,
      topicPerformance: { Strings: { solved: 30, category: 'fundamental', status: 'Proficient' } },
      weakTopics: ['Graphs'],
    });

    expect(created.userId).toBe(userA.id);
    expect(created.leetcodeUsername).toBe('user_a_leetcode');
    expect(created.leetcodeScore).toBe(65);

    const fetched = await repoA.findByUserId();
    expect(fetched).not.toBeNull();
    expect(fetched?.userId).toBe(userA.id);
    expect(fetched?.leetcodeUsername).toBe('user_a_leetcode');
  });

  it('5. User A cannot overwrite or upsert User B profile (cross-tenant write rejected)', async () => {
    const repoA = new LeetcodeRepository(userA.id);

    // Attempting cross-tenant upsert
    await expect(
      repoA.upsertProfile(userB.id, {
        leetcodeUsername: 'hacked_b',
        leetcodeScore: 10,
        totalSolved: 1,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    // Verify User B profile was untouched
    const bProfile = await db.leetcodeProfile.findUnique({ where: { userId: userB.id } });
    expect(bProfile?.leetcodeUsername).toBe('user_b_leetcode');
    expect(bProfile?.leetcodeScore).toBe(82);
  });
});
