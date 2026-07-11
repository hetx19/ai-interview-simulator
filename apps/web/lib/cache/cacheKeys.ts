// ---------------------------------------------------------------------------
// User cache keys
// ---------------------------------------------------------------------------

export const cacheKeys = {
  /** GitHub profile cache. Clear after a GitHub sync finishes. */
  githubProfile: (userId: string) => `user:${userId}:github` as const,

  /** LeetCode profile cache. Clear after a LeetCode sync finishes. */
  leetcodeProfile: (userId: string) => `user:${userId}:leetcode` as const,

  /** Cached hiring score. Clear whenever the score is recalculated. */
  hiringScore: (userId: string) => `user:${userId}:score` as const,

  /** Public profile page cache. Refresh after profile or score changes. */
  publicProfile: (username: string) => `profile:${username}` as const,

  /** Currently active resume. Clear after uploading or switching resumes. */
  activeResume: (userId: string) => `user:${userId}:resume:active` as const,

  /** User settings cache. Clear after any settings update. */
  userSettings: (userId: string) => `user:${userId}:settings` as const,

  // ---------------------------------------------------------------------------
  // Interview cache keys
  // ---------------------------------------------------------------------------

  /** Cached interview problem for an active session. */
  interviewProblem: (sessionId: string) =>
    `session:${sessionId}:problem` as const,

  /** Final interview scores. Written once the interview is complete. */
  interviewScores: (sessionId: string) =>
    `session:${sessionId}:scores` as const,

  // ---------------------------------------------------------------------------
  // Problem bank cache keys
  // ---------------------------------------------------------------------------

  /** Cached problem details. Clear after the problem is edited. */
  problemBankEntry: (problemBankId: string) => `bank:${problemBankId}` as const,

  /** Cached problem list for a difficulty/topic combination. */
  problemBankList: (difficulty: string, topic: string) =>
    `bank:list:${difficulty}:${topic}` as const,

  // ---------------------------------------------------------------------------
  // Rate limit prefixes
  // ---------------------------------------------------------------------------

  /** Prefix used for API rate limiting. */
  rateLimitApi: "rl:api",

  /** Prefix used for resume upload rate limiting. */
  rateLimitResume: "rl:resume",

  /** Prefix used for interview start rate limiting. */
  rateLimitInterview: "rl:interview",

  /** Prefix used for GitHub sync rate limiting. */
  rateLimitGithubSync: "rl:github",

  // ---------------------------------------------------------------------------
  // Erasure helper
  // ---------------------------------------------------------------------------

  userScanPattern: (userId: string) => `user:${userId}:*` as const,
} as const;

export type CacheKeys = typeof cacheKeys;
