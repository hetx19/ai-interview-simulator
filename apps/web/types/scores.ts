import type {
  HiringReadinessScore as PrismaHiringReadinessScore,
  GithubProfile as PrismaGithubProfile,
  LeetcodeProfile as PrismaLeetcodeProfile,
  Resume as PrismaResume,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Re-exported Prisma types
// ---------------------------------------------------------------------------
export type HiringReadinessScore = PrismaHiringReadinessScore;
export type GithubProfile = PrismaGithubProfile;
export type LeetcodeProfile = PrismaLeetcodeProfile;
export type Resume = PrismaResume;

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------
export const HIRING_LEVEL = [
  "not_ready",
  "building",
  "interview_ready",
  "competitive",
  "faang_ready",
] as const;
export type HiringLevel = (typeof HIRING_LEVEL)[number];

export const RESUME_ANALYSIS_STATUS = [
  "pending",
  "processing",
  "complete",
  "failed",
] as const;
export type ResumeAnalysisStatus = (typeof RESUME_ANALYSIS_STATUS)[number];

// ---------------------------------------------------------------------------
// Score component weights
// ---------------------------------------------------------------------------
export interface ScoreComponents {
  github?: number | null; // 0–100
  leetcode?: number | null; // 0–100
  resume?: number | null; // 0–100
  interview?: number | null; // 0–100
}

export interface ComputedHiringScore {
  overallScore: number; // 0–100
  level: HiringLevel;
  components: ScoreComponents;
  roadmap: RoadmapWeek[];
  improvementQueue: ImprovementItem[];
}

export interface RoadmapWeek {
  week: number;
  tasks: Array<{
    title: string;
    description: string;
    link?: string;
  }>;
}

export interface ImprovementItem {
  area: "github" | "leetcode" | "resume" | "interview";
  action: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
}

export interface WeakBullet {
  original: string;
  suggestion: string;
  reason: string;
}
