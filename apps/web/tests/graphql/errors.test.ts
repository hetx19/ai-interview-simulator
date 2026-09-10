import { describe, it, expect } from 'vitest';
import { requireAuth, formatError, AppError } from '@/server/graphql/errors';
import { runWithCorrelation } from '@/server/logging/correlationStore';
import type { GraphQLContext } from '@/types/graphql';

describe('GraphQL Errors & Authentication Guard', () => {
  it('40. requireAuth throws AppError(UNAUTHENTICATED) when user is null', () => {
    const fakeContext: GraphQLContext = {
      user: null,
      correlationId: 'test-corr-40',
      logger: { child: () => ({}) } as any,
    };

    expect(() => requireAuth(fakeContext)).toThrowError(AppError);
    try {
      requireAuth(fakeContext);
    } catch (err) {
      expect((err as AppError).code).toBe('UNAUTHENTICATED');
      expect((err as AppError).message).toBe('Authentication required');
    }
  });

  it('requireAuth narrows context when user is present', () => {
    const fakeContext: GraphQLContext = {
      user: {
        id: 'u123',
        email: 'user@example.com',
        username: 'user123',
        createdAt: new Date(),
      },
      correlationId: 'test-corr-valid',
      logger: {} as any,
    };

    expect(() => requireAuth(fakeContext)).not.toThrow();
    requireAuth(fakeContext);
    expect(fakeContext.user.id).toBe('u123');
  });

  it('37. formatError formats AppError with code, message, field, and correlationId', async () => {
    await runWithCorrelation({ correlationId: 'corr-fmt-37' }, async () => {
      const appErr = new AppError('VALIDATION_ERROR', 'Invalid username length', 'username');
      const formatted = formatError(appErr);

      expect(formatted.message).toBe('Invalid username length');
      expect(formatted.extensions).toEqual({
        code: 'VALIDATION_ERROR',
        field: 'username',
        correlationId: 'corr-fmt-37',
      });
    });
  });

  it('39. formatError sanitizes generic Error to INTERNAL_ERROR and suppresses stack trace', async () => {
    await runWithCorrelation({ correlationId: 'corr-fmt-39' }, async () => {
      const genericErr = new Error('Sensitive database connection string: postgresql://secret');
      const formatted = formatError(genericErr);

      expect(formatted.message).toBe('An unexpected error occurred');
      expect(formatted.extensions).toEqual({
        code: 'INTERNAL_ERROR',
        field: null,
        correlationId: 'corr-fmt-39',
      });
      // Ensure raw error message does not leak
      expect(formatted.message).not.toContain('postgresql://secret');
    });
  });
});
