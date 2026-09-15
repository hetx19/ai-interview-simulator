import { userResolvers } from './userResolvers';
import { githubResolvers } from './githubResolvers';
import { leetcodeResolvers } from './leetcodeResolvers';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...githubResolvers.Query,
    ...leetcodeResolvers.Query,
  },
  Mutation: {
    ...githubResolvers.Mutation,
    ...leetcodeResolvers.Mutation,
  },
};
