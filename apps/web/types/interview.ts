import type {
  InterviewSession as PrismaInterviewSession,
  InterviewProblem as PrismaInterviewProblem,
  InterviewSubmission as PrismaInterviewSubmission,
  InterviewScores as PrismaInterviewScores,
  VoiceTranscript as PrismaVoiceTranscript,
  ProblemBank as PrismaProblemBank,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Re-exported Prisma types
// ---------------------------------------------------------------------------
export type InterviewSession = PrismaInterviewSession;
export type InterviewProblem = PrismaInterviewProblem;
export type InterviewSubmission = PrismaInterviewSubmission;
export type InterviewScores = PrismaInterviewScores;
export type VoiceTranscript = PrismaVoiceTranscript;
export type ProblemBank = PrismaProblemBank;

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------
export const INTERVIEW_DIFFICULTY = ["easy", "medium", "hard"] as const;
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTY)[number];

export const INTERVIEW_STATUS = [
  "in_progress",
  "completed",
  "abandoned",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUS)[number];

export const TRANSCRIPT_SPEAKER = ["user", "ai"] as const;
export type TranscriptSpeaker = (typeof TRANSCRIPT_SPEAKER)[number];

// ---------------------------------------------------------------------------
// Composite / enriched types used across service and API layers
// ---------------------------------------------------------------------------

export type InterviewSessionWithDetails = InterviewSession & {
  problem: InterviewProblem | null;
  scores: InterviewScores | null;
  submissions: InterviewSubmission[];
};

export interface StartInterviewOptions {
  difficulty: InterviewDifficulty;
  topic?: string;
  voiceEnabled: boolean;
  language: string;
}

export interface FinalSubmission {
  code: string;
  language: string;
}

export interface InterviewReport {
  sessionId: string;
  userId: string;
  scores: {
    communication: number;
    dsa: number;
    codeQuality: number;
    optimization: number;
    overall: number;
  };
  feedback: Record<string, string>;
  improvements: string[];
  edgeCases: unknown;
  durationSeconds: number;
}

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  time: string | null; // seconds as string from Judge0
  memory: number | null; // KB
  status: { id: number; description: string };
  testCases: Array<{
    input: string;
    expected: string;
    actual: string | null;
    passed: boolean;
  }>;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemHint {
  level: 1 | 2 | 3;
  text: string;
}
