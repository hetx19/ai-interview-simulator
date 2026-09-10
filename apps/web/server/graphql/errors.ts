import { createGraphQLError } from 'graphql-yoga';
import { AppErrorCode, GraphQLContext, AuthenticatedUser } from '@/types/graphql';
import { getCorrelationId } from '@/server/logging/correlationStore';
import { logger } from '@/server/logging/logger';

export { type AppErrorCode };

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function requireAuth(
  ctx: GraphQLContext,
): asserts ctx is GraphQLContext & { user: AuthenticatedUser } {
  if (!ctx.user) {
    throw new AppError('UNAUTHENTICATED', 'Authentication required');
  }
}

export function formatError(error: any) {
  const original =
    error instanceof AppError
      ? error
      : error?.originalError instanceof AppError
        ? error.originalError
        : null;

  const correlationId = getCorrelationId();

  if (original) {
    return createGraphQLError(original.message, {
      extensions: {
        code: original.code,
        field: original.field ?? null,
        correlationId,
      },
    });
  }

  // Unknown or unhandled error — log full details and sanitize client response
  logger.error({ correlationId, error }, 'Unexpected GraphQL error');
  return createGraphQLError('An unexpected error occurred', {
    extensions: {
      code: 'INTERNAL_ERROR',
      field: null,
      correlationId,
    },
  });
}
