// standard api envelope
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string; // error code
  message: string; // description
  details?: unknown; // validation errors / details
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// pagination
export interface PaginationParams {
  limit: number; // max 100
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// error codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONFLICT: "CONFLICT",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// request and response shapes
export interface StartInterviewRequest {
  difficulty: "easy" | "medium" | "hard";
  topic?: string;
  voiceEnabled: boolean;
  language: string;
}

export interface StartInterviewResponse {
  sessionId: string;
  problem: {
    id: string;
    title: string;
    description: string;
    examples: unknown;
    constraints: string[];
    optimalTimeComplexity: string | null;
    optimalSpaceComplexity: string | null;
    hints: unknown;
    tags: string[];
  };
}

export interface SubmitInterviewRequest {
  code: string;
  language: string;
}

export interface SyncGitHubRequest {
  // github username to sync
  githubUsername: string;
}

export interface UploadResumeResponse {
  resumeId: string;
  fileName: string;
  status: "pending";
}
