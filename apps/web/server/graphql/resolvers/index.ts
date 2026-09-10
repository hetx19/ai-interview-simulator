import { userResolvers } from './userResolvers';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
  },
};
