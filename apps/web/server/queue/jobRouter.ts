import { JobType, QStashMessage } from './jobTypes';
import { logger } from '@/server/logging/logger';

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
    case JobType.GITHUB_SYNC:
      logger.debug({ payload: message.payload }, 'Github sync job received (stub)');
      break;
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
