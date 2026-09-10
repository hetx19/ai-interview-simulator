import { verifyQStashSignature } from '@/server/queue/verifyQStash';
import { dispatchJob } from '@/server/queue/jobRouter';
import { JobType } from '@/server/queue/jobTypes';
import { logger } from '@/server/logging/logger';
import { runWithCorrelation, resolveCorrelationId } from '@/server/logging/correlationStore';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const correlationId = resolveCorrelationId(
    request.headers.get('X-Correlation-ID') || request.headers.get('x-correlation-id'),
  );

  // 1. MUST read text() BEFORE any JSON parsing
  const rawBody = await request.text();

  // 2. Verify signature before any processing
  try {
    await verifyQStashSignature(rawBody, request.headers);
  } catch (err) {
    logger.warn({ err, correlationId }, 'QStash signature verification failed');
    return Response.json(
      { error: 'FORBIDDEN', message: 'Invalid signature', correlationId },
      { status: 403, headers: { 'X-Correlation-ID': correlationId } },
    );
  }

  // 3. Parse JSON safely
  let message: any;
  try {
    message = JSON.parse(rawBody);
  } catch (err) {
    logger.warn({ err, correlationId }, 'Malformed JSON in QStash webhook body');
    return Response.json(
      { error: 'BAD_REQUEST', message: 'Malformed JSON', correlationId },
      { status: 400, headers: { 'X-Correlation-ID': correlationId } },
    );
  }

  // 4. Validate job type
  if (!message || !message.type || !Object.values(JobType).includes(message.type)) {
    logger.warn({ type: message?.type, correlationId }, 'Unknown or invalid job type');
    return Response.json(
      { error: 'BAD_REQUEST', message: 'Unknown or invalid job type', correlationId },
      { status: 400, headers: { 'X-Correlation-ID': correlationId } },
    );
  }

  // 5. Dispatch job
  const jobCorrelationId = message.correlationId || correlationId;
  try {
    await runWithCorrelation(
      { correlationId: jobCorrelationId, userId: message.userId },
      () => dispatchJob(message),
    );

    return Response.json(
      { success: true, correlationId: jobCorrelationId },
      { status: 200, headers: { 'X-Correlation-ID': jobCorrelationId } },
    );
  } catch (err) {
    logger.error({ err, correlationId: jobCorrelationId }, 'QStash job handler failed');
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Job processing failed', correlationId: jobCorrelationId },
      { status: 500, headers: { 'X-Correlation-ID': jobCorrelationId } },
    );
  }
}
