import { JobType, QStashMessage } from './jobTypes';
import { logger } from '@/server/logging/logger';
import { getDecryptedAccessToken } from '@/server/auth/encryption';
import { GithubService } from '@/server/services/GithubService';
import { invalidateByTag, invalidateCache } from '@/server/cache/redisClient';
import { cacheKeys, cacheTags } from '@/lib/cache/cacheKeys';
import { AppError } from '@/server/graphql/errors';
import { refreshGitHubAccessToken } from '@/server/auth/tokenRefresh';

export async function dispatchJob(message: QStashMessage<any>): Promise<void> {
  logger.info(
    {
      type: message.type,
      correlationId: message.correlationId,
      userId: message.userId,
    },
    'Dispatching QStash job',
  );

  switch (message.type) {
    case JobType.GITHUB_SYNC: {
      const { userId } = message.payload;
      const token = await getDecryptedAccessToken(userId, 'github');
      if (!token) {
        logger.error(
          { userId, correlationId: message.correlationId },
          'No GitHub OAuth token available for user. Reconnect required.',
        );
        throw new AppError('UNAUTHENTICATED', `No GitHub OAuth token available for user ${userId}`);
      }
      const githubService = new GithubService(userId);
      try {
        await githubService.syncProfile(token);
      } catch (err: any) {
        if (err instanceof AppError && err.code === 'UNAUTHENTICATED') {
          const refreshedToken = await refreshGitHubAccessToken(userId);
          if (refreshedToken) {
            try {
              await githubService.syncProfile(refreshedToken);
              await invalidateCache(cacheKeys.githubProfile(userId));
              await invalidateByTag(cacheTags.user(userId));
              break;
            } catch (retryErr: any) {
              if (retryErr instanceof AppError && retryErr.code === 'UNAUTHENTICATED') {
                logger.warn(
                  { userId, correlationId: message.correlationId },
                  'GitHub OAuth token expired or revoked during background sync. Reconnection prompt required.',
                );
                return;
              }
              throw retryErr;
            }
          }
          logger.warn(
            { userId, correlationId: message.correlationId },
            'GitHub OAuth token expired or revoked during background sync. Reconnection prompt required.',
          );
          return;
        }
        throw err;
      }
      await invalidateCache(cacheKeys.githubProfile(userId));
      await invalidateByTag(cacheTags.user(userId));
      break;
    }
    case JobType.LEETCODE_SYNC:
      logger.debug({ payload: message.payload }, 'Leetcode sync job received (stub)');
      break;
    case JobType.RESUME_ANALYSIS:
      logger.debug({ payload: message.payload }, 'Resume analysis job received (stub)');
      break;
    default:
      throw new Error(`Unknown job type: ${(message as any).type}`);
  }
}
