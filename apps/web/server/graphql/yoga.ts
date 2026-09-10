import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { formatError } from './errors';

export const schema = createSchema({
  typeDefs,
  resolvers,
});

export const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: '/api/graphql',
  landingPage: process.env.NODE_ENV === 'development',
  maskedErrors: {
    maskError: (error: any) => formatError(error),
  },
});
