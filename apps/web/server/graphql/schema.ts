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

  type GitHubProfile {
    id: ID!
    githubUsername: String!
    githubScore: Int
    repoHealthScore: Int
    openSourceScore: Int
    totalRepos: Int!
    totalStars: Int!
    totalForks: Int!
    totalCommitsYear: Int!
    languageDistribution: JSON
    contributionCalendar: JSON
    topRepos: JSON
    recommendations: [String!]!
    lastSyncedAt: DateTime
  }

  type SyncJobResponse {
    jobId: String!
    status: String!
    message: String!
  }

  type AppError {
    code: String!
    message: String!
    field: String
    correlationId: String!
  }

  type Query {
    me: User
    githubProfile: GitHubProfile
  }

  type Mutation {
    syncGitHub: SyncJobResponse!
  }
`;
