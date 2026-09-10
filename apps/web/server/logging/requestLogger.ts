import { logger } from './logger';
import { getCorrelationId, getUserIdFromStore } from './correlationStore';

export function createRequestLogger(correlationId: string, userId?: string) {
  return logger.child({
    correlationId,
    ...(userId ? { userId } : {}),
  });
}

export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  extra?: Record<string, unknown>
) {
  const correlationId = getCorrelationId();
  const userId = getUserIdFromStore();

  logger.info({
    correlationId,
    ...(userId ? { userId } : {}),
    method,
    path,
    statusCode,
    durationMs,
    message: 'GraphQL request completed',
    ...extra,
  });
}
