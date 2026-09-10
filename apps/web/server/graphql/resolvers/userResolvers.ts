import { requireAuth } from '../errors';
import { UserService } from '@/server/services/UserService';
import type { GraphQLContext } from '@/types/graphql';

export const userResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const userService = new UserService(ctx.user.id, ctx.logger);
      const user = await userService.getAuthenticatedUser();
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        targetRole: user.targetRole,
        targetCompanies: user.targetCompanies ?? [],
        createdAt: user.createdAt,
      };
    },
  },
};
