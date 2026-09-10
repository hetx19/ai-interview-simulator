export enum JobType {
  GITHUB_SYNC = 'github_sync',
  LEETCODE_SYNC = 'leetcode_sync',
  RESUME_ANALYSIS = 'resume_analysis',
}

export interface GithubSyncPayload {
  userId: string;
  githubUsername?: string;
}

export interface LeetcodeSyncPayload {
  userId: string;
  leetcodeUsername?: string;
}

export interface ResumeAnalysisPayload {
  userId: string;
  resumeId: string;
}

export type JobPayload = {
  [JobType.GITHUB_SYNC]: GithubSyncPayload;
  [JobType.LEETCODE_SYNC]: LeetcodeSyncPayload;
  [JobType.RESUME_ANALYSIS]: ResumeAnalysisPayload;
};

export interface QStashMessage<T = unknown> {
  type: JobType;
  payload: T;
  correlationId: string;
  userId: string;
  enqueuedAt: string;
}
