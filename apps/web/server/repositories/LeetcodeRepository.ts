import { BaseRepository } from './BaseRepository';
import { AppError } from '@/server/graphql/errors';
import type { LeetcodeProfile, Prisma } from '@prisma/client';

export class LeetcodeRepository extends BaseRepository {
  constructor(userId: string) {
    super(userId);
  }

  /**
   * Retrieves the LeetCode profile strictly scoped to the tenant userId.
   * Attempting to query another user's profile raises a FORBIDDEN error.
   */
  public async findByUserId(targetUserId?: string): Promise<LeetcodeProfile | null> {
    if (targetUserId && targetUserId !== this.userId) {
      throw new AppError('FORBIDDEN', 'Access denied: cannot access another user profile');
    }

    return this.findFirst<LeetcodeProfile>(this.db.leetcodeProfile, {
      userId: this.userId,
    });
  }

  /**
   * Upserts the LeetCode profile for the authenticated tenant.
   * Strict tenant isolation prevents cross-user writes.
   */
  public async upsertProfile(
    userId: string,
    data: Omit<Prisma.LeetcodeProfileUncheckedCreateInput, 'userId'> & { userId?: string },
  ): Promise<LeetcodeProfile> {
    if (userId !== this.userId) {
      throw new AppError('FORBIDDEN', 'Access denied: cross-tenant profile updates are forbidden');
    }

    return this.db.leetcodeProfile.upsert({
      where: { userId: this.userId },
      create: {
        ...data,
        userId: this.userId,
      },
      update: {
        ...data,
        userId: this.userId,
      },
    });
  }
}
