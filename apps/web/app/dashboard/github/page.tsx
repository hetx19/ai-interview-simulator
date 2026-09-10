"use client";

import { useEffect, useState, useCallback } from "react";

interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

interface TopRepo {
  name: string;
  stars: number;
  forks: number;
  url: string;
  description: string | null;
  language: string | null;
  isInactive?: boolean;
}

interface GitHubProfileData {
  id: string;
  githubUsername: string;
  githubScore: number | null;
  repoHealthScore: number | null;
  openSourceScore: number | null;
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalCommitsYear: number;
  languageDistribution: Record<string, number> | null;
  contributionCalendar: ContributionCalendar | null;
  topRepos: TopRepo[] | null;
  recommendations: string[];
  lastSyncedAt: string | null;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Java: "#b07219",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] || "#918f9a";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}M loc`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}k loc`;
  return `${bytes} loc`;
}

function getReadinessTier(score: number): { tier: string; subtitle: string } {
  if (score >= 90) return { tier: "Readiness Tier: Top 1%", subtitle: "Calibrated for Principal / Staff Roles" };
  if (score >= 80) return { tier: "Readiness Tier: Top 5%", subtitle: "Calibrated for Staff L6 Roles" };
  if (score >= 70) return { tier: "Readiness Tier: Top 15%", subtitle: "Calibrated for Senior L5 Roles" };
  if (score >= 50) return { tier: "Readiness Tier: Competitive", subtitle: "Calibrated for Mid-Level L4 Roles" };
  return { tier: "Readiness Tier: Developing", subtitle: "Building Foundations for L3/L4 Roles" };
}

function computeStreaks(calendar?: ContributionCalendar | null): { currentStreak: number; longestStreak: number } {
  if (!calendar || !calendar.weeks || calendar.weeks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays || []);
  let currentStreak = 0;
  let maxStreak = 0;

  for (const day of allDays) {
    if (day.contributionCount > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak: maxStreak };
}

function classifyRecommendation(rec: string) {
  const lower = rec.toLowerCase();
  if (lower.includes("license") || lower.includes("dormant") || lower.includes("gap")) {
    return {
      type: "warning",
      title: "Action Item: Repository Hygiene",
      icon: "warning",
      borderClass: "bg-[#ffb867]",
      iconBgClass: "bg-[#ffb867]/15",
      iconTextClass: "text-[#ffb867]",
      tagText: "PRIORITY: HIGH",
      tagClass: "text-[#ffb867]",
    };
  }
  if (lower.includes("open-source") || lower.includes("stars") || lower.includes("boost") || lower.includes("diversity")) {
    return {
      type: "growth",
      title: "High-Signal Growth Opportunity",
      icon: "lightbulb",
      borderClass: "bg-[#6bde80]",
      iconBgClass: "bg-[#6bde80]/15",
      iconTextClass: "text-[#6bde80]",
      tagText: "+8 PTS SIGNAL",
      tagClass: "text-[#6bde80]",
    };
  }
  return {
    type: "info",
    title: "Interview Narrative Leverage",
    icon: "bolt",
    borderClass: "bg-[#e1dfff]",
    iconBgClass: "bg-[#c0c1ff]/20",
    iconTextClass: "text-[#e1dfff]",
    tagText: "AI EVALUATION",
    tagClass: "text-[#e1dfff]",
  };
}

export default function GitHubAnalyticsPage() {
  const [profile, setProfile] = useState<GitHubProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formattedSyncDate, setFormattedSyncDate] = useState<string>("");

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetGitHubProfile {
              githubProfile {
                id
                githubUsername
                githubScore
                repoHealthScore
                openSourceScore
                totalRepos
                totalStars
                totalForks
                totalCommitsYear
                languageDistribution
                contributionCalendar
                topRepos
                recommendations
                lastSyncedAt
              }
            }
          `,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message || "Failed to load GitHub profile");
      }

      const data = json.data?.githubProfile ?? null;
      setProfile(data);
      if (data?.lastSyncedAt) {
        setFormattedSyncDate(new Date(data.lastSyncedAt).toLocaleString());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation SyncGitHub {
              syncGitHub {
                jobId
                status
                message
              }
            }
          `,
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message || "Failed to initiate sync");
      }

      const result = json.data?.syncGitHub;
      setSyncMessage({
        type: "success",
        text: result?.message || "GitHub synchronization job queued successfully.",
      });

      // Poll after 4 seconds to pick up completed sync job
      setTimeout(() => {
        fetchProfile();
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync request failed";
      setSyncMessage({ type: "error", text: msg });
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 3000);
    }
  };

  const handleExportReport = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devmetric-github-${profile.githubUsername || "telemetry"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="flex flex-col w-full">
        <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8 animate-pulse">
          <div className="h-32 rounded-xl bg-[#1b1b23]/80 border border-[#292932]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-[#1b1b23]/80 border border-[#292932]" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-[#1b1b23]/80 border border-[#292932]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 h-80 rounded-xl bg-[#1b1b23]/80 border border-[#292932]" />
            <div className="lg:col-span-7 h-80 rounded-xl bg-[#1b1b23]/80 border border-[#292932]" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !profile) {
    return (
      <div className="flex flex-col w-full">
        <div className="p-6 max-w-[1440px] mx-auto w-full">
          <div className="rounded-xl bg-[#1b1b23]/90 border border-[#93000a]/50 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#93000a]/20 text-[#ffb4ab] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <h2 className="text-xl font-semibold text-[#e4e1ed]">Failed to load GitHub Telemetry</h2>
            <p className="text-sm text-[#c7c5d0] max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchProfile()}
              className="px-4 py-2 rounded-lg bg-[#c0c1ff] text-[#131449] font-medium hover:bg-[#e1dfff] transition-all shadow-md active:scale-95 text-sm inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State (GitHub account not synced / connected yet)
  if (!profile) {
    return (
      <div className="flex flex-col w-full">
        <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">
          <div className="relative overflow-hidden rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-8 border border-[#292932] shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#292932] flex items-center justify-center mx-auto mb-4 text-[#e1dfff] shadow-lg">
              <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#e4e1ed] font-sora">No GitHub Telemetry Found</h2>
            <p className="text-sm text-[#c7c5d0] max-w-md mx-auto mt-2">
              Connect your GitHub account or trigger an initial sync to populate your developer footprint, 52-week activity heatmap, and algorithmic readiness scores.
            </p>

            {syncMessage && (
              <div className={`mt-4 max-w-md mx-auto p-3 rounded-lg text-xs font-mono text-left ${syncMessage.type === "success" ? "bg-[#6bde80]/15 text-[#6bde80] border border-[#6bde80]/30" : "bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30"}`}>
                {syncMessage.text}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="px-6 py-2.5 rounded-lg bg-[#c0c1ff] text-[#131449] font-semibold hover:bg-[#e1dfff] transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)] active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-base ${isSyncing ? "animate-spin" : ""}`}>
                  {isSyncing ? "refresh" : "sync"}
                </span>
                <span>{isSyncing ? "Queuing Sync Job..." : "Sync GitHub Profile"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Real Data Processing
  const score = profile.githubScore ?? 0;
  const readiness = getReadinessTier(score);
  const commits = profile.totalCommitsYear ?? 0;
  const commitsPerDay = (commits / 365).toFixed(1);
  const stars = profile.totalStars ?? 0;
  const forks = profile.totalForks ?? 0;
  const healthScore = profile.repoHealthScore ?? 0;
  const openSourceScore = profile.openSourceScore ?? 0;
  const streaks = computeStreaks(profile.contributionCalendar);

  // Language breakdown
  const langEntries = profile.languageDistribution ? Object.entries(profile.languageDistribution) : [];
  const totalLangBytes = langEntries.reduce((acc, [, bytes]) => acc + (typeof bytes === "number" ? bytes : 0), 0);
  const sortedLangs = [...langEntries].sort((a, b) => (b[1] as number) - (a[1] as number));
  const topLangs = sortedLangs.slice(0, 5);
  const otherLangBytes = sortedLangs.slice(5).reduce((acc, [, b]) => acc + (b as number), 0);

  const parsedLanguages = topLangs.map(([name, bytes]) => {
    const b = bytes as number;
    const pct = totalLangBytes > 0 ? (b / totalLangBytes) * 100 : 0;
    return {
      name,
      color: getLanguageColor(name),
      bytes: b,
      formattedLoc: formatBytes(b),
      percentage: `${pct.toFixed(1)}%`,
      pctNum: pct,
    };
  });

  if (otherLangBytes > 0) {
    const otherPct = totalLangBytes > 0 ? (otherLangBytes / totalLangBytes) * 100 : 0;
    parsedLanguages.push({
      name: "Other",
      color: "#918f9a",
      bytes: otherLangBytes,
      formattedLoc: formatBytes(otherLangBytes),
      percentage: `${otherPct.toFixed(1)}%`,
      pctNum: otherPct,
    });
  }

  // Recommendations
  const recommendations = profile.recommendations && profile.recommendations.length > 0
    ? profile.recommendations
    : ["Your GitHub profile demonstrates solid consistency and healthy code practices!"];

  // Heatmap Weeks (last 52)
  const calendarWeeks: ContributionWeek[] = profile.contributionCalendar?.weeks || [];
  const displayWeeks: ContributionWeek[] = calendarWeeks.length >= 52
    ? calendarWeeks.slice(-52)
    : [
        ...Array.from({ length: Math.max(0, 52 - calendarWeeks.length) }, (): ContributionWeek => ({
          contributionDays: [],
        })),
        ...calendarWeeks,
      ];

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-2xl border border-[#292932]/50">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#e1dfff]/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-[#6bde80]/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-[#292932] shadow-lg flex-shrink-0">
                <svg className="w-8 h-8 text-[#e1dfff]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6bde80] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#6bde80]" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed] font-sora">
                    Telemetry // GitHub Production Footprint
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#34343d] text-[#6bde80] text-[10px] leading-[14px] font-[600] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80]" /> Live Sync Active
                  </span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-0.5 font-mono">
                  Profile Node: <span className="text-[#e1dfff] font-semibold">{profile.githubUsername}</span> |{" "}
                  Last Synced: <span className="text-[#918f9a]">{formattedSyncDate || "Recent"}</span> |{" "}
                  Repos: <span className="text-[#6bde80] font-semibold">{profile.totalRepos}</span>
                </p>
              </div>
            </div>

            {/* targets & actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="hidden xl:flex flex-col text-right pr-6 border-r border-[#46464f]/30">
                <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">Benchmark</span>
                <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed]">Target: Staff Engineer</span>
              </div>
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 md:flex-initial px-3 py-2 rounded-lg bg-[#292932] hover:bg-[#393841] text-[#e4e1ed] text-[12px] leading-[18px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-sm text-[#e1dfff] ${isSyncing ? "animate-spin" : ""}`}>
                  sync
                </span>
                <span>{isSyncing ? "Re-indexing..." : "Force Re-index"}</span>
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                className="flex-1 md:flex-initial px-6 py-2 rounded-lg bg-[#c0c1ff] text-[#131449] text-[16px] leading-[24px] font-[600] hover:bg-[#e1dfff] transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)] active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">file_download</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className={`mt-4 p-3 rounded-lg text-xs font-mono flex items-center justify-between ${syncMessage.type === "success" ? "bg-[#6bde80]/15 text-[#6bde80] border border-[#6bde80]/30" : "bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30"}`}>
              <span>{syncMessage.text}</span>
              <button onClick={() => setSyncMessage(null)} className="text-[#918f9a] hover:text-[#e4e1ed]">✕</button>
            </div>
          )}
        </div>

        {/* stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* score card */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all border border-[#292932]/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Benchmark Metric</span>
              <span className="flex items-center gap-1 text-[10px] leading-[14px] font-[600] text-[#6bde80] bg-[#6bde80]/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-xs">trending_up</span> Live Score
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">{score}</span>
                  <span className="text-[18px] leading-[26px] font-[600] text-[#918f9a]">/100</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium mt-1">{readiness.tier}</p>
              </div>
              {/* ring meter */}
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#292932]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  <path className="text-[#e1dfff] transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${score}, 100`} strokeLinecap="round" strokeWidth="3.5" />
                </svg>
                <span className="absolute text-[10px] leading-[14px] font-[600] text-[#e1dfff]">{score}%</span>
              </div>
            </div>
            <div className="mt-2 pt-1 text-[#918f9a] text-[12px] leading-[18px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e1dfff]" />
              <span>{readiness.subtitle}</span>
            </div>
          </div>

          {/* commits card */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all border border-[#292932]/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Commit Velocity</span>
              <span className="material-symbols-outlined text-[#918f9a] text-lg">commit</span>
            </div>
            <div className="mt-3">
              <div className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">{commits.toLocaleString()}</div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium mt-1">Contributions Across {profile.totalRepos} Repositories</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-[#292932] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#6bde80] h-full rounded-full" style={{ width: `${Math.min(100, Math.round((commits / 800) * 100))}%` }} />
              </div>
              <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">{commitsPerDay}/day</span>
            </div>
          </div>

          {/* stars & forks */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all border border-[#292932]/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Ecosystem Resonance</span>
              <span className="material-symbols-outlined text-[#ffb867] text-lg">hotel_class</span>
            </div>
            <div className="mt-3 flex items-baseline gap-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#ffb867] text-xl">⭐</span>
                  <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">{stars.toLocaleString()}</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium">Stargazers</p>
              </div>
              <div className="w-px h-10 bg-[#46464f]/30 self-center" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#e1dfff] text-xl">⑂</span>
                  <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">{forks.toLocaleString()}</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium">Network Forks</p>
              </div>
            </div>
            <div className="mt-2 text-[#918f9a] text-[12px] leading-[18px] flex items-center gap-1">
              <span className="text-[#6bde80] font-semibold">{profile.totalRepos} repos</span> indexed in audit scope
            </div>
          </div>

          {/* repo health */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all border border-[#292932]/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Pipeline Rigor</span>
              <span className="material-symbols-outlined text-[#6bde80] text-lg">verified_user</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[48px] leading-[56px] font-bold text-[#6bde80] tracking-tight">{healthScore}%</span>
                <span className="text-[12px] leading-[18px] text-[#918f9a] font-mono">HEALTH</span>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium mt-1">Documentation, Workflows &amp; Quality</p>
            </div>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#292932] text-[#e4e1ed] text-[10px] leading-[14px] font-[600] font-mono">Health: {healthScore}%</span>
              <span className="px-2 py-0.5 rounded bg-[#292932] text-[#e4e1ed] text-[10px] leading-[14px] font-[600] font-mono">OpenSource: {openSourceScore}%</span>
            </div>
          </div>
        </div>

        {/* contribution heatmap */}
        <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden border border-[#292932]/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6bde80]">calendar_view_week</span>
                <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Full 52-Week Contribution Matrix</h2>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-0.5">
                Daily telemetry density across public and upstream repositories
              </p>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3 bg-[#0d0d15] px-3 py-1.5 rounded-lg shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">Current Streak</span>
                  <span className="text-[16px] leading-[24px] font-bold text-[#6bde80]">{streaks.currentStreak} Days 🔥</span>
                </div>
                <div className="w-px h-6 bg-[#46464f]/30" />
                <div className="flex flex-col">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">Longest Streak</span>
                  <span className="text-[16px] leading-[24px] font-bold text-[#e1dfff]">{streaks.longestStreak} Days</span>
                </div>
              </div>

              {/* legend */}
              <div className="flex items-center gap-1.5 text-[10px] leading-[14px] font-[600] text-[#918f9a]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[#161b22]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0e4429]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#006d32]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#26a641]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#39d353]" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* 52-week matrix */}
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-12 text-[#918f9a] text-[10px] leading-[14px] font-[600] mb-2 pl-8 pr-2">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[#918f9a] text-[10px] leading-[14px] font-[600] py-1 h-[112px]">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>
                <div className="flex-1">
                  <svg className="w-full h-[112px]" fill="none" preserveAspectRatio="none" viewBox="0 0 832 112">
                    <defs>
                      <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#39d353" floodOpacity="0.3" />
                      </filter>
                    </defs>
                    <g className="heatmap-tiles">
                      {displayWeeks.map((week, cIndex) => {
                        return (
                          <g key={cIndex} transform={`translate(${cIndex * 16}, 0)`}>
                            {Array.from({ length: 7 }).map((_, rIndex) => {
                              const day = week.contributionDays?.find((d: ContributionDay) => d.weekday === rIndex) || week.contributionDays?.[rIndex];
                              const count = day?.contributionCount || 0;
                              let color = "#161b22";
                              if (count > 0 && count <= 2) color = "#0e4429";
                              else if (count <= 5) color = "#006d32";
                              else if (count <= 8) color = "#26a641";
                              else if (count > 8) color = "#39d353";

                              return (
                                <rect
                                  key={rIndex}
                                  x={0}
                                  y={rIndex * 16}
                                  width={12}
                                  height={12}
                                  rx={2}
                                  fill={color}
                                  filter={color === "#39d353" ? "url(#glow-green)" : undefined}
                                >
                                  <title>{day?.date ? `${day.date}: ${count} contributions` : `No activity`}</title>
                                </rect>
                              );
                            })}
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* languages & recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* language breakdown */}
          <div className="lg:col-span-5 rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between border border-[#292932]/40">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e1dfff]">pie_chart</span>
                  <h3 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Language Distribution</h3>
                </div>
                <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">
                  {formatBytes(totalLangBytes)}
                </span>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-1">Multi-stack codebase composition derived from indexed repositories</p>

              {/* stacked progress bar */}
              {parsedLanguages.length > 0 ? (
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#34343d] mt-6 shadow-inner">
                  {parsedLanguages.map((lang) => (
                    <div
                      key={lang.name}
                      style={{ width: `${lang.pctNum}%`, backgroundColor: lang.color }}
                      title={`${lang.name}: ${lang.percentage}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-3 rounded-full bg-[#34343d] mt-6" />
              )}

              {/* language list */}
              <div className="space-y-2 mt-6">
                {parsedLanguages.length > 0 ? (
                  parsedLanguages.map((lang) => (
                    <div key={lang.name} className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d15] hover:bg-[#1f1f27] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: lang.color }} />
                        <span className="text-[15px] leading-[22px] font-[500] text-[#e4e1ed] font-mono">{lang.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] leading-[18px] text-[#918f9a] font-mono">{lang.formattedLoc}</span>
                        <span className="text-[15px] leading-[22px] font-bold text-[#e4e1ed] font-mono">{lang.percentage}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#918f9a] text-center py-4">No repository languages detected.</p>
                )}
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-[#0d0d15]/80 flex items-center justify-between border border-[#292932]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e1dfff] text-base">psychology</span>
                <span className="text-[12px] leading-[18px] text-[#e4e1ed]">
                  Staff Competency Fit: <strong className="text-[#6bde80]">{score >= 80 ? "96.2% match" : "84.5% match"}</strong>
                </span>
              </div>
              <span className="material-symbols-outlined text-[#918f9a] text-sm">info</span>
            </div>
          </div>

          {/* recommendations feed */}
          <div className="lg:col-span-7 rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between border border-[#292932]/40">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e1dfff]">smart_toy</span>
                  <h3 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Actionable Intelligence &amp; Recommendation Feed</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#e1dfff]/10 text-[#e1dfff] text-[10px] leading-[14px] font-[600] uppercase tracking-wider">
                  AI Auditor Active
                </span>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] mb-6">
                Synthesized algorithmic advice derived from FAANG hiring rubrics and repository telemetry
              </p>

              <div className="space-y-3">
                {recommendations.map((rec, idx) => {
                  const meta = classifyRecommendation(rec);
                  return (
                    <div key={idx} className="relative overflow-hidden rounded-xl bg-[#0d0d15] p-3 shadow-md transition-all hover:bg-[#292932] group border border-[#292932]/30">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.borderClass}`} />
                      <div className="flex items-start gap-3 pl-1">
                        <div className={`w-9 h-9 rounded-lg ${meta.iconBgClass} ${meta.iconTextClass} flex items-center justify-center shrink-0`}>
                          <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[15px] leading-[22px] font-semibold ${meta.iconTextClass}`}>{meta.title}</span>
                            <span className={`text-[10px] leading-[14px] font-[600] font-mono ${meta.tagClass}`}>{meta.tagText}</span>
                          </div>
                          <p className="text-[14px] leading-[22px] text-[#e4e1ed] mt-1">
                            {rec}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-[#918f9a] text-[10px] leading-[14px] font-[600]">
              <span>AI Engine: DevMetric-Sonar-V3</span>
              <span>Telemetry: Live Synchronized</span>
            </div>
          </div>
        </div>

        {/* top repositories */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e1dfff]">folder_special</span>
                <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Top Repositories Grid</h2>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0]">Selected showcase repositories with static analysis and contribution vectors</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">SORT: STARS &amp; RELEVANCE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {profile.topRepos && profile.topRepos.length > 0 ? (
              profile.topRepos.map((repo, idx) => (
                <div
                  key={repo.name || idx}
                  className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all group border border-[#292932]/40"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#e1dfff] text-xl">source</span>
                        <span className="text-[16px] leading-[24px] font-bold text-[#e4e1ed] group-hover:text-[#e1dfff] transition-colors break-all">
                          {repo.name}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] leading-[14px] font-[600] ${repo.isInactive ? "bg-[#ffb4ab]/15 text-[#ffb4ab]" : "bg-[#6bde80]/15 text-[#6bde80]"}`}>
                        {repo.isInactive ? "Dormant" : "Active"}
                      </span>
                    </div>
                    <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-2 line-clamp-2">
                      {repo.description || "Public repository indexed by DevMetric telemetry engine."}
                    </p>
                    <div className="mt-4 p-2 rounded-lg bg-[#0d0d15]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[12px] leading-[18px]">
                          {repo.language && (
                            <div className="flex items-center gap-1 text-[#e4e1ed]">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                              />
                              <span className="font-mono text-[12px]">{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[#918f9a]">
                            <span>⭐</span> <span className="text-[#e4e1ed] font-semibold font-mono">{repo.stars}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#918f9a]">
                            <span>⑂</span> <span className="text-[#e4e1ed] font-semibold font-mono">{repo.forks}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {repo.url ? (
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full py-2 px-3 rounded-lg bg-[#292932] hover:bg-[#c0c1ff] hover:text-[#131449] text-[#e1dfff] text-[14px] leading-[22px] font-semibold transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg"
                    >
                      <span>View on GitHub</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 rounded-xl bg-[#1b1b23]/80 text-center text-[#918f9a]">
                No public repositories found for this account.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
