import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/prisma';
import { BaseRepository } from '@/server/repositories/BaseRepository';
import { UserRepository } from '@/server/repositories/UserRepository';
import crypto from 'node:crypto';

describe('BaseRepository & UserRepository Scoping', () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let userDeleted: { id: string; email: string };

  beforeAll(async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    // Create User A
    userA = await db.user.create({
      data: {
        email: `test-user-a-${runId}@example.com`,
        username: `user_a_${runId}`,
        name: 'User A',
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });

    // Create User B
    userB = await db.user.create({
      data: {
        email: `test-user-b-${runId}@example.com`,
        username: `user_b_${runId}`,
        name: 'User B',
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });

    // Create Soft-deleted user
    userDeleted = await db.user.create({
      data: {
        email: `test-user-del-${runId}@example.com`,
        username: `user_del_${runId}`,
        name: 'Deleted User',
        deletedAt: new Date(),
        targetCompanies: [],
      },
      select: { id: true, email: true },
    });
  });

  afterAll(async () => {
    // Cleanup created users
    const ids = [userA?.id, userB?.id, userDeleted?.id].filter(Boolean);
    if (ids.length > 0) {
      await db.session.deleteMany({ where: { userId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('26. findFirst scopes to userId and returns A record', async () => {
    const repoA = new UserRepository(userA.id);
    const result = await repoA.findMe();

    expect(result).not.toBeNull();
    expect(result?.id).toBe(userA.id);
    expect(result?.email).toBe(userA.email);
    expect(result?.id).not.toBe(userB.id);
  });

  it('27. update rejects cross-user update attempt with FORBIDDEN AppError', async () => {
    const repoA = new UserRepository(userA.id);
    // User A attempts to update User B
    await expect(
      repoA.update(userB.id, { name: 'Compromised Name' }),
    ).rejects.toThrow('Access denied');

    // Verify User B was NOT modified
    const currentB = await db.user.findUnique({ where: { id: userB.id } });
    expect(currentB?.name).toBe('User B');
  });

  it('28. delete rejects cross-user hardDelete attempt with FORBIDDEN AppError', async () => {
    const repoA = new UserRepository(userA.id);
    // User A attempts to delete User B
    await expect(repoA.hardDelete(userB.id)).rejects.toThrow('Access denied');

    // Verify User B was NOT deleted
    const currentB = await db.user.findUnique({ where: { id: userB.id } });
    expect(currentB).not.toBeNull();
    expect(currentB?.id).toBe(userB.id);
  });

  it('29. deleteMany scopes to userId (only A sessions deleted)', async () => {
    // Create 3 sessions for A, 2 for B
    const sessionExpires = new Date(Date.now() + 86400000);
    await db.session.createMany({
      data: [
        { sessionToken: `token-a1-${crypto.randomUUID()}`, userId: userA.id, expires: sessionExpires },
        { sessionToken: `token-a2-${crypto.randomUUID()}`, userId: userA.id, expires: sessionExpires },
        { sessionToken: `token-a3-${crypto.randomUUID()}`, userId: userA.id, expires: sessionExpires },
        { sessionToken: `token-b1-${crypto.randomUUID()}`, userId: userB.id, expires: sessionExpires },
        { sessionToken: `token-b2-${crypto.randomUUID()}`, userId: userB.id, expires: sessionExpires },
      ],
    });

    const repoA = new UserRepository(userA.id);
    const deletedCount = await repoA.deleteManySessions();
    expect(deletedCount).toBe(3);

    // Verify B's sessions are intact
    const remainingB = await db.session.count({ where: { userId: userB.id } });
    expect(remainingB).toBe(2);
  });

  it('30. userId cannot be omitted (throws at runtime when omitted)', () => {
    expect(() => new UserRepository(undefined as any)).toThrow(
      'BaseRepository requires a userId',
    );
  });

  it('31. User cannot read another user record (User isolation)', async () => {
    const repoA = new UserRepository(userA.id);
    const me = await repoA.findMe();
    expect(me?.id).toBe(userA.id);
    expect(me?.id).not.toBe(userB.id);
  });

  it('32. Soft-deleted user returns null', async () => {
    const repoDel = new UserRepository(userDeleted.id);
    const result = await repoDel.findMe();
    expect(result).toBeNull();
  });

  it('33. Empty userId throws immediately', () => {
    expect(() => new UserRepository('')).toThrow(
      'BaseRepository requires a userId',
    );
    expect(() => new UserRepository('   ')).toThrow(
      'BaseRepository requires a userId',
    );
  });

  it('34. queries non-User model (GithubProfile) without throwing unknown argument deletedAt', async () => {
    class TestGithubRepo extends BaseRepository {
      public async findProfile() {
        return this.findFirst(this.db.githubProfile);
      }
    }

    const repo = new TestGithubRepo(userA.id);
    const profile = await repo.findProfile();
    expect(profile).toBeNull();
  });
});
