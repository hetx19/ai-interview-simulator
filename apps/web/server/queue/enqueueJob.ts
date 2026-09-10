import { qstash } from './qstashClient';
import { JobType, JobPayload, QStashMessage } from './jobTypes';
import { env } from '@/lib/env';
import { getCorrelationId } from '@/server/logging/correlationStore';
import { logger } from '@/server/logging/logger';

export interface EnqueueOptions {
  retries?: number; // Default: 3
  delay?: number; // Seconds before delivery. Default: 0
  deduplicationId?: string; // QStash message deduplication
}

export async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayload[T],
  options?: EnqueueOptions,
): Promise<{ messageId: string }> {
  const correlationId = getCorrelationId();
  const destinationUrl = `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash`;

  const message: QStashMessage<JobPayload[T]> = {
    type,
    payload,
    correlationId,
    userId: payload.userId,
    enqueuedAt: new Date().toISOString(),
  };

  logger.debug(
    { type, correlationId, userId: message.userId },
    'Enqueuing QStash job',
  );

  const result = await qstash.publishJSON({
    url: destinationUrl,
    body: message,
    retries: options?.retries ?? 3,
    delay: options?.delay ?? 0,
    deduplicationId: options?.deduplicationId,
    headers: {
      'X-Correlation-ID': correlationId,
    },
  });

  return { messageId: result.messageId };
}
