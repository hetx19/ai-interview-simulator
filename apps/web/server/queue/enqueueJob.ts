import { qstash } from './qstashClient';
import { JobType, JobPayload, QStashMessage } from './jobTypes';
import { env } from '@/lib/env';
import { getCorrelationId } from '@/server/logging/correlationStore';
import { logger } from '@/server/logging/logger';
import { AppError } from '@/server/graphql/errors';
import { randomUUID } from 'node:crypto';

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

  // Local development / mock QStash fallback:
  // When using mock QStash credentials or targeting localhost, dispatch asynchronously in-process
  const isMockToken = !env.QSTASH_TOKEN || env.QSTASH_TOKEN === 'mock_qstash_token' || env.QSTASH_TOKEN.startsWith('mock');
  if (isMockToken || (process.env.NODE_ENV === 'development' && destinationUrl.includes('localhost'))) {
    logger.info(
      { type, correlationId, userId: message.userId },
      'Mock or local QStash environment detected: executing job in-process asynchronously',
    );
    const mockMessageId = `local-job-${randomUUID()}`;
    void (async () => {
      try {
        const { dispatchJob } = await import('./jobRouter');
        await dispatchJob(message);
      } catch (err) {
        logger.error(
          { err, type, correlationId, userId: message.userId },
          'Failed executing local in-process background job',
        );
      }
    })();

    return { messageId: mockMessageId };
  }

  try {
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
  } catch (err: any) {
    logger.error(
      { err, type, correlationId, userId: message.userId },
      'Failed to publish job to QStash',
    );
    throw new AppError(
      'INTERNAL_ERROR',
      `Failed to queue background job: ${err?.message || 'QStash queue unavailable'}`,
    );
  }
}

