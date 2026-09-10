import { BaseRepository } from './BaseRepository';
import type { GithubProfile, Prisma } from '@prisma/client';

export class GithubRepository extends BaseRepository {
  constructor(userId: string) {
    super(userId);
  }

  public async findByUserId(userId?: string): Promise<GithubProfile | null> {
    const targetUserId = userId ?? this.userId;
    return this.findFirst<GithubProfile>(this.db.githubProfile, {
      userId: targetUserId,
    });
  }

  public async upsertProfile(
    userId: string,
    data: Omit<Prisma.GithubProfileUncheckedCreateInput, 'userId'> & { userId?: string },
  ): Promise<GithubProfile> {
    const targetUserId = userId ?? this.userId;
    return this.db.githubProfile.upsert({
      where: { userId: targetUserId },
      create: {
        ...data,
        userId: targetUserId,
      },
      update: {
        ...data,
        userId: targetUserId,
      },
    });
  }
}
