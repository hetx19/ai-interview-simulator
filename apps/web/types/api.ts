// ---------------------------------------------------------------------------
// Standard API response envelope
// ---------------------------------------------------------------------------
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string; // machine-readable code
  message: string; // human-readable description
  details?: unknown; // Zod validation errors, etc.
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Common error codes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Specific API request/response shapes
// ---------------------------------------------------------------------------

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
  /** GitHub username to sync */
  githubUsername: string;
}

export interface UploadResumeResponse {
  resumeId: string;
  fileName: string;
  status: "pending";
}
