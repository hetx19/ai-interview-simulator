// ---------------------------------------------------------------------------
// JSONB column shapes for github_profiles
// ---------------------------------------------------------------------------
export type LanguageDistribution = Record<string, number>;

export type ContributionCalendar = Record<string, number>;

export interface TopRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
}

// ---------------------------------------------------------------------------
// GitHub API sync payload
// ---------------------------------------------------------------------------
export interface GitHubSyncPayload {
  githubUsername: string;
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalCommitsYear: number;
  languageDistribution: LanguageDistribution;
  contributionCalendar: ContributionCalendar;
  topRepos: TopRepo[];
  recommendations: string[];
}

export interface GitHubScores {
  githubScore: number; // 0–100 composite
  repoHealthScore: number; // 0–100
  openSourceScore: number; // 0–100
}
