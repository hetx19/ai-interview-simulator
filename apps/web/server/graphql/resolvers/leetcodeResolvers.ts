import { requireAuth, AppError } from '../errors';
import { LeetcodeRepository } from '@/server/repositories/LeetcodeRepository';
import { LeetcodeService } from '@/server/services/LeetcodeService';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import type { GraphQLContext } from '@/types/graphql';

export const leetcodeResolvers = {
  Query: {
    leetcodeProfile: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const repo = new LeetcodeRepository(ctx.user.id);
      const profile = await repo.findByUserId();
      if (!profile) return null;

      return {
        id: profile.id,
        leetcodeUsername: profile.leetcodeUsername,
        leetcodeScore: profile.leetcodeScore,
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        contestRating: profile.contestRating,
        contestRanking: profile.contestRanking,
        streakDays: profile.streakDays,
        topicPerformance: profile.topicPerformance,
        weakTopics: profile.weakTopics ?? [],
        recommendations: profile.recommendations,
        contestHistory: profile.contestHistory,
        lastSyncedAt: profile.lastSyncedAt,
      };
    },
  },
  Mutation: {
    syncLeetcode: async (
      _parent: unknown,
      args: { username?: string } = {},
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);

      const service = new LeetcodeService(ctx.user.id);
      let username = args.username?.trim();

      if (!username) {
        const existing = await service.getProfile();
        username = existing?.leetcodeUsername;
      }

      if (!username) {
        throw new AppError(
          'VALIDATION_ERROR',
          'LeetCode username is required. Please provide a username to synchronize.',
          'username',
        );
      }

      await service.assertSyncAllowed();

      const result = await enqueueJob(JobType.LEETCODE_SYNC, {
        userId: ctx.user.id,
        leetcodeUsername: username,
      });

      return {
        jobId: result.messageId,
        status: 'QUEUED',
        message: 'LeetCode synchronization job queued successfully',
      };
    },
    syncLeetCode: async (
      parent: unknown,
      args: { username?: string } = {},
      ctx: GraphQLContext,
    ) => {
      return leetcodeResolvers.Mutation.syncLeetcode(parent, args, ctx);
    },
    saveManualLeetcodeProfile: async (
      _parent: unknown,
      args: {
        input: {
          leetcodeUsername: string;
          easySolved: number;
          mediumSolved: number;
          hardSolved: number;
          contestRating?: number | null;
          streakDays?: number;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new LeetcodeService(ctx.user.id);
      const profile = await service.saveManualProfile(args.input);

      return {
        id: profile.id,
        leetcodeUsername: profile.leetcodeUsername,
        leetcodeScore: profile.leetcodeScore,
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        contestRating: profile.contestRating,
        contestRanking: profile.contestRanking,
        streakDays: profile.streakDays,
        topicPerformance: profile.topicPerformance,
        weakTopics: profile.weakTopics ?? [],
        recommendations: profile.recommendations,
        contestHistory: profile.contestHistory,
        lastSyncedAt: profile.lastSyncedAt,
      };
    },
  },
};
