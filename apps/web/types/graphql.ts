import type { Logger } from 'pino';

export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  targetRole?: string | null;
  targetCompanies?: string[];
  createdAt: Date;
}

export interface GraphQLContext {
  user: AuthenticatedUser | null;
  correlationId: string;
  logger: Logger;
}
