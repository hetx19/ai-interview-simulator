// github jsonb column shapes
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

// github sync payload
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
  githubScore: number; // composite 0-100
  repoHealthScore: number; // 0-100
  openSourceScore: number; // 0-100
}
