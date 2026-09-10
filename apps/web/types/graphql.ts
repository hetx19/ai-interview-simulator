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

export interface GitHubProfileGql {
  id: string;
  githubUsername: string;
  githubScore: number | null;
  repoHealthScore: number | null;
  openSourceScore: number | null;
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalCommitsYear: number;
  languageDistribution: Record<string, any> | null;
  contributionCalendar: Record<string, any> | null;
  topRepos: Record<string, any>[] | null;
  recommendations: string[];
  lastSyncedAt: Date | null;
}

export interface SyncJobResponseGql {
  jobId: string;
  status: string;
  message: string;
}
