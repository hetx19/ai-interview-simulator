import { userResolvers } from './userResolvers';
import { githubResolvers } from './githubResolvers';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...githubResolvers.Query,
  },
  Mutation: {
    ...githubResolvers.Mutation,
  },
};
