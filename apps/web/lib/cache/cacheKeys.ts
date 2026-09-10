// user cache keys
export const cacheKeys = {
  // invalidate on github sync
  githubProfile: (userId: string) => `user:${userId}:github` as const,

  // invalidate on leetcode sync
  leetcodeProfile: (userId: string) => `user:${userId}:leetcode` as const,

  // invalidate on score recalc
  hiringScore: (userId: string) => `user:${userId}:score` as const,

  // refresh on profile update
  publicProfile: (username: string) => `profile:${username}` as const,

  // active resume cache
  activeResume: (userId: string) => `user:${userId}:resume:active` as const,

  // invalidate on settings update
  userSettings: (userId: string) => `user:${userId}:settings` as const,

  // interview caches
  interviewProblem: (sessionId: string) =>
    `session:${sessionId}:problem` as const,

  // final interview scores
  interviewScores: (sessionId: string) =>
    `session:${sessionId}:scores` as const,

  // problem bank caches
  problemBankEntry: (problemBankId: string) => `bank:${problemBankId}` as const,

  // problem list by difficulty and topic
  problemBankList: (difficulty: string, topic: string) =>
    `bank:list:${difficulty}:${topic}` as const,

  // rate limit prefixes
  rateLimitApi: "rl:api",
  rateLimitResume: "rl:resume",
  rateLimitInterview: "rl:interview",
  rateLimitGithubSync: "rl:github",

  // cache purge helper
  userScanPattern: (userId: string) => `user:${userId}:*` as const,
} as const;

export type CacheKeys = typeof cacheKeys;

// Tag name generators — tag keys live in "tag:" namespace to avoid collisions
export const cacheTags = {
  user: (userId: string) => `tag:user:${userId}` as const,
  session: (sessionId: string) => `tag:session:${sessionId}` as const,
  profile: (username: string) => `tag:profile:${username}` as const,
} as const;

export type CacheTags = typeof cacheTags;

// TTL constants in seconds — referenced by call sites
export const cacheTTL = {
  githubProfile: 24 * 60 * 60,
  leetcodeProfile: 24 * 60 * 60,
  activeResume: 60 * 60,
  hiringScore: 60 * 60,
  publicProfile: 5 * 60,
  interviewSession: 15 * 60,
  problemBank: 7 * 24 * 60 * 60,
} as const;

export type CacheTTL = typeof cacheTTL;
