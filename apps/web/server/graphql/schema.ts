export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    username: String!
    name: String
    avatarUrl: String
    targetRole: String
    targetCompanies: [String!]!
    createdAt: DateTime!
  }

  type AppError {
    code: String!
    message: String!
    field: String
    correlationId: String!
  }

  type Query {
    me: User
  }
`;
