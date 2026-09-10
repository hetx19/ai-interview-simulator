import { describe, it, expect, vi } from 'vitest';
import {
  runWithCorrelation,
  getCorrelationId,
  getUserIdFromStore,
  setUserId,
  resolveCorrelationId,
} from '@/server/logging/correlationStore';
import { logger } from '@/server/logging/logger';
import { createRequestLogger, logRequest } from '@/server/logging/requestLogger';

describe('Logging & Correlation Context', () => {
  it('19. ID generated when not present matches UUID format', () => {
    const generated = resolveCorrelationId(null);
    expect(generated).toBeDefined();
    // UUID v4 format regex
    expect(generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('20. ID propagated from header when present', () => {
    const customId = 'test-id-123';
    const resolved = resolveCorrelationId(customId);
    expect(resolved).toBe(customId);

    const childLogger = createRequestLogger(customId, 'user-xyz');
    expect(childLogger).toBeDefined();
  });

  it('21. userId included after auth', async () => {
    await runWithCorrelation({ correlationId: 'corr-1' }, async () => {
      expect(getUserIdFromStore()).toBeUndefined();
      setUserId('user-uuid-123');
      expect(getUserIdFromStore()).toBe('user-uuid-123');
      expect(getCorrelationId()).toBe('corr-1');
    });
  });

  it('22. Unauthenticated context has no userId', async () => {
    await runWithCorrelation({ correlationId: 'corr-unauth' }, async () => {
      expect(getCorrelationId()).toBe('corr-unauth');
      expect(getUserIdFromStore()).toBeUndefined();
    });
  });

  it('23. Concurrent requests do not share correlation IDs (AsyncLocalStorage isolation)', async () => {
    const taskA = async () => {
      await new Promise((res) => setTimeout(res, 30));
      return { corr: getCorrelationId(), user: getUserIdFromStore() };
    };

    const taskB = async () => {
      setUserId('user-B');
      await new Promise((res) => setTimeout(res, 10));
      return { corr: getCorrelationId(), user: getUserIdFromStore() };
    };

    const [resA, resB] = await Promise.all([
      runWithCorrelation({ correlationId: 'ID-A' }, taskA),
      runWithCorrelation({ correlationId: 'ID-B' }, taskB),
    ]);

    expect(resA.corr).toBe('ID-A');
    expect(resA.user).toBeUndefined();

    expect(resB.corr).toBe('ID-B');
    expect(resB.user).toBe('user-B');
  });

  it('24. All required fields in log entry', () => {
    const infoSpy = vi.spyOn(logger, 'info');

    runWithCorrelation({ correlationId: 'test-corr-456' }, () => {
      setUserId('test-user-456');
      logRequest('POST', '/api/graphql', 200, 45);
    });

    expect(infoSpy).toHaveBeenCalled();
    const loggedPayload = infoSpy.mock.calls[infoSpy.mock.calls.length - 1][0] as Record<string, any>;

    expect(loggedPayload.correlationId).toBe('test-corr-456');
    expect(loggedPayload.userId).toBe('test-user-456');
    expect(loggedPayload.method).toBe('POST');
    expect(loggedPayload.path).toBe('/api/graphql');
    expect(loggedPayload.statusCode).toBe(200);
    expect(loggedPayload.durationMs).toBe(45);
    expect(loggedPayload.message).toBe('GraphQL request completed');

    infoSpy.mockRestore();
  });

  it('25. Error log preserves correlationId', () => {
    const errorSpy = vi.spyOn(logger, 'error');

    runWithCorrelation({ correlationId: 'err-corr-789' }, () => {
      setUserId('err-user-789');
      const err = new Error('Database timeout');
      logger.error(
        {
          correlationId: getCorrelationId(),
          userId: getUserIdFromStore(),
          error: { message: err.message },
        },
        'Request failed',
      );
    });

    expect(errorSpy).toHaveBeenCalled();
    const errorPayload = errorSpy.mock.calls[errorSpy.mock.calls.length - 1][0] as Record<string, any>;
    expect(errorPayload.correlationId).toBe('err-corr-789');
    expect(errorPayload.userId).toBe('err-user-789');
    expect(errorPayload.error.message).toBe('Database timeout');

    errorSpy.mockRestore();
  });
});
