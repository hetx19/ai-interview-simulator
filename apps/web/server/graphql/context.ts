import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth/options';
import type { GraphQLContext, AuthenticatedUser } from '@/types/graphql';
import { getCorrelationId, setUserId } from '@/server/logging/correlationStore';
import { logger } from '@/server/logging/logger';

export async function createContext(): Promise<GraphQLContext> {
  const session = await getServerSession(authOptions);
  const user: AuthenticatedUser | null = session?.user?.id && session?.user?.email
    ? {
        id: session.user.id,
        email: session.user.email,
        username: (session.user as any).username || session.user.email.split('@')[0],
        name: session.user.name ?? null,
        avatarUrl: (session.user as any).image ?? null,
        targetRole: (session.user as any).targetRole ?? null,
        targetCompanies: (session.user as any).targetCompanies ?? [],
        createdAt: (session.user as any).createdAt ?? new Date(),
      }
    : null;

  const correlationId = getCorrelationId();
  if (user) {
    setUserId(user.id);
  }

  return {
    user,
    correlationId,
    logger: logger.child({
      correlationId,
      ...(user ? { userId: user.id } : {}),
    }),
  };
}
