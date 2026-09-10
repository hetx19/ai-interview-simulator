import { JobType, QStashMessage } from './jobTypes';
import { logger } from '@/server/logging/logger';
import { getDecryptedAccessToken } from '@/server/auth/encryption';
import { GithubService } from '@/server/services/GithubService';
import { invalidateByTag } from '@/server/cache/redisClient';
import { cacheTags } from '@/lib/cache/cacheKeys';

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
        throw new Error(`No GitHub OAuth token available for user ${userId}`);
      }
      const githubService = new GithubService(userId);
      await githubService.syncProfile(token);
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
