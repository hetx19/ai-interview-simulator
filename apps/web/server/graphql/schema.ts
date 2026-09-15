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

  type LeetCodeProfile {
    id: ID!
    leetcodeUsername: String!
    leetcodeScore: Int
    totalSolved: Int!
    easySolved: Int!
    mediumSolved: Int!
    hardSolved: Int!
    contestRating: Int
    contestRanking: Int
    streakDays: Int!
    topicPerformance: JSON
    weakTopics: [String!]!
    recommendations: JSON
    contestHistory: JSON
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

  input ManualLeetcodeProfileInput {
    leetcodeUsername: String!
    easySolved: Int!
    mediumSolved: Int!
    hardSolved: Int!
    contestRating: Int
    streakDays: Int
  }

  type Query {
    me: User
    githubProfile: GitHubProfile
    leetcodeProfile: LeetCodeProfile
  }

  type Mutation {
    syncGitHub: SyncJobResponse!
    syncLeetcode(username: String): SyncJobResponse!
    syncLeetCode(username: String): SyncJobResponse!
    saveManualLeetcodeProfile(input: ManualLeetcodeProfileInput!): LeetCodeProfile!
  }
`;
