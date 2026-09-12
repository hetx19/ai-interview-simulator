import { requireAuth, AppError } from '../errors';
import { GithubRepository } from '@/server/repositories/GithubRepository';
import { GithubService } from '@/server/services/GithubService';
import { gitHubApiClient } from '@/server/external/GitHubApiClient';
import { getDecryptedAccessToken } from '@/server/auth/encryption';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import type { GraphQLContext } from '@/types/graphql';

import { refreshGitHubAccessToken } from '@/server/auth/tokenRefresh';

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
    syncGitHub: async (
      _parent: unknown,
      args: { force?: boolean } = {},
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);

      const token = await getDecryptedAccessToken(ctx.user.id, 'github');
      if (!token) {
        throw new AppError(
          'UNAUTHENTICATED',
          'No GitHub account connected. Please connect your GitHub account to sync telemetry.',
        );
      }

      // Proactively validate token against GitHub to catch expired/revoked credentials
      try {
        await gitHubApiClient.getUserProfile(token);
      } catch (err: any) {
        if (err instanceof AppError && err.code === 'UNAUTHENTICATED') {
          const refreshedToken = await refreshGitHubAccessToken(ctx.user.id);
          if (refreshedToken) {
            try {
              await gitHubApiClient.getUserProfile(refreshedToken);
            } catch {
              throw new AppError(
                'UNAUTHENTICATED',
                'GitHub authorization expired or was revoked. Please reconnect your GitHub account.',
              );
            }
          } else {
            throw new AppError(
              'UNAUTHENTICATED',
              'GitHub authorization expired or was revoked. Please reconnect your GitHub account.',
            );
          }
        }
        if (err instanceof AppError && err.code === 'RATE_LIMITED') {
          throw err;
        }
      }

      const githubService = new GithubService(ctx.user.id);
      if (!args?.force) {
        await githubService.assertSyncAllowed();
      }

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
