import { requireAuth } from '../errors';
import { GithubRepository } from '@/server/repositories/GithubRepository';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import type { GraphQLContext } from '@/types/graphql';

export const githubResolvers = {
  Query: {
    githubProfile: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const repo = new GithubRepository(ctx.user.id);
      const profile = await repo.findByUserId();
      if (!profile) return null;

      return {
        id: profile.id,
        githubUsername: profile.githubUsername,
        githubScore: profile.githubScore,
        repoHealthScore: profile.repoHealthScore,
        openSourceScore: profile.openSourceScore,
        totalRepos: profile.totalRepos,
        totalStars: profile.totalStars,
        totalForks: profile.totalForks ?? 0,
        totalCommitsYear: profile.totalCommitsYear,
        languageDistribution: profile.languageDistribution,
        contributionCalendar: profile.contributionCalendar,
        topRepos: profile.topRepos,
        recommendations: profile.recommendations ?? [],
        lastSyncedAt: profile.lastSyncedAt,
      };
    },
  },
  Mutation: {
    syncGitHub: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const result = await enqueueJob(JobType.GITHUB_SYNC, {
        userId: ctx.user.id,
      });

      return {
        jobId: result.messageId,
        status: 'QUEUED',
        message: 'GitHub synchronization job queued successfully',
      };
    },
  },
};
