"use client";

import { useEffect, useState, useCallback } from "react";
import { DifficultyBreakdown } from "./components/DifficultyBreakdown";
import { TopicBreakdown } from "./components/TopicBreakdown";
import { RecommendationsList } from "./components/RecommendationsList";
import { ManualEntryModal } from "./components/ManualEntryModal";

interface LeetcodeProfileData {
  id: string;
  leetcodeUsername: string;
  leetcodeScore: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number | null;
  contestRanking: number | null;
  streakDays: number;
  topicPerformance: Record<string, any> | null;
  weakTopics: string[];
  recommendations: any[] | null;
  contestHistory: any[] | null;
  lastSyncedAt: string | null;
}

function getReadinessTier(score: number): { tier: string; subtitle: string } {
  if (score >= 90)
    return {
      tier: "Readiness Tier: Top 1%",
      subtitle: "Calibrated for Principal / Staff Algorithm Rounds",
    };
  if (score >= 80)
    return {
      tier: "Readiness Tier: Top 5%",
      subtitle: "Calibrated for Staff L6 Hard Problem Bars",
    };
  if (score >= 70)
    return {
      tier: "Readiness Tier: Top 15%",
      subtitle: "Calibrated for Senior L5 DSA Loops",
    };
  if (score >= 50)
    return {
      tier: "Readiness Tier: Competitive",
      subtitle: "Calibrated for Mid-Level L4 Problem Sets",
    };
  return {
    tier: "Readiness Tier: Developing",
    subtitle: "Building Core Data Structure & Algorithm Foundations",
  };
}

export default function LeetCodeMetricsPage() {
  const [profile, setProfile] = useState<LeetcodeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectUsername, setConnectUsername] = useState("");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [syncNotification, setSyncNotification] = useState<{
    type: "success" | "error" | "info" | "cloudflare";
    text: string;
  } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetLeetcodeProfile {
              leetcodeProfile {
                id
                leetcodeUsername
                leetcodeScore
                totalSolved
                easySolved
                mediumSolved
                hardSolved
                contestRating
                contestRanking
                streakDays
                topicPerformance
                weakTopics
                recommendations
                contestHistory
                lastSyncedAt
              }
            }
          `,
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        setError(json.errors[0]?.message || "Failed to load LeetCode profile");
        return;
      }

      setProfile(json?.data?.leetcodeProfile ?? null);
    } catch (err: any) {
      setError(err?.message || "Network error loading LeetCode analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSync = async (usernameToSync?: string) => {
    const targetUsername = usernameToSync || profile?.leetcodeUsername || connectUsername.trim();
    if (!targetUsername) {
      setSyncNotification({
        type: "error",
        text: "Please provide a LeetCode username to sync.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncNotification(null);

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation TriggerLeetcodeSync($username: String!) {
              syncLeetcode(username: $username) {
                jobId
                status
                message
              }
            }
          `,
          variables: { username: targetUsername },
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        const msg = json.errors[0]?.message || "Sync failed";
        const code = json.errors[0]?.extensions?.code || "";
        const isForbidden = code === "FORBIDDEN" || msg.toLowerCase().includes("cloudflare") || msg.toLowerCase().includes("blocked");
        if (isForbidden) {
          setSyncNotification({
            type: "cloudflare" as any,
            text: msg,
          });
        } else {
          setSyncNotification({ type: "error", text: msg });
        }
        return;
      }

      setSyncNotification({
        type: "success",
        text: "Synchronization queued. Processing algorithmic metrics in the background...",
      });

      // Poll after 3s to refresh state
      setTimeout(() => {
        fetchProfile();
      }, 3000);
    } catch (err: any) {
      setSyncNotification({
        type: "error",
        text: err?.message || "Failed to trigger synchronization",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveManual = async (manualData: {
    leetcodeUsername: string;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    contestRating?: number | null;
    streakDays?: number;
  }) => {
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation SaveManualProfile($input: ManualLeetcodeProfileInput!) {
            saveManualLeetcodeProfile(input: $input) {
              id
              leetcodeUsername
              leetcodeScore
              totalSolved
              easySolved
              mediumSolved
              hardSolved
              contestRating
              contestRanking
              streakDays
              topicPerformance
              weakTopics
              recommendations
              contestHistory
              lastSyncedAt
            }
          }
        `,
        variables: { input: manualData },
      }),
    });

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0]?.message || "Failed to save manual profile");
    }

    setProfile(json.data.saveManualLeetcodeProfile);
    setSyncNotification({
      type: "success",
      text: "Self-reported LeetCode metrics saved successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full animate-pulse p-6 max-w-[1440px] mx-auto space-y-8">
        <div className="h-10 bg-[#1b1b23] rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="h-36 bg-[#1b1b23] rounded-xl" />
          <div className="h-36 bg-[#1b1b23] rounded-xl" />
          <div className="h-36 bg-[#1b1b23] rounded-xl" />
          <div className="h-36 bg-[#1b1b23] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 h-64 bg-[#1b1b23] rounded-xl" />
          <div className="lg:col-span-6 h-64 bg-[#1b1b23] rounded-xl" />
        </div>
      </div>
    );
  }

  // Not connected state
  if (!profile) {
    return (
      <div className="flex flex-col w-full p-6 max-w-[1440px] mx-auto space-y-8">
        <div className="text-center max-w-xl mx-auto py-12 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-3xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            💡
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e4e1ed] tracking-tight">
              Connect LeetCode Telemetry
            </h1>
            <p className="text-sm text-[#c7c5d0] mt-2">
              DevMetric analyzes your problem-solving velocity, topic mastery, and contest ratings to benchmark your readiness against FAANG engineering standards.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
              {error}
            </div>
          )}

          {syncNotification && (
            <div
              className={`p-3 rounded-lg text-xs text-left ${
                syncNotification.type === "error"
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              }`}
            >
              {syncNotification.text}
            </div>
          )}

          <div className="bg-[#1b1b23]/90 border border-[#46464f]/30 p-6 rounded-2xl space-y-4 shadow-xl text-left">
            <label className="block text-xs font-semibold text-[#e1dfff] uppercase tracking-wider">
              LeetCode Public Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={connectUsername}
                onChange={(e) => setConnectUsername(e.target.value)}
                placeholder="e.g. neetcode"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d0d15] border border-[#46464f]/30 text-[#e4e1ed] placeholder-[#918f9a] text-sm focus:outline-none focus:border-[#c0c1ff]"
              />
              <button
                type="button"
                disabled={isSyncing || !connectUsername.trim()}
                onClick={() => handleSync(connectUsername.trim())}
                className="px-5 py-2.5 rounded-xl bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] font-bold text-xs transition shadow-[0_0_16px_rgba(192,193,255,0.3)] disabled:opacity-50"
              >
                {isSyncing ? "Syncing..." : "Connect & Ingest"}
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#46464f]/20">
              <span className="text-[11px] text-[#918f9a]">
                Or enter metrics manually if behind a firewall:
              </span>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="text-xs font-semibold text-[#c0c1ff] hover:underline"
              >
                Self-Report Fallback →
              </button>
            </div>
          </div>
        </div>

        <ManualEntryModal
          isOpen={isManualModalOpen}
          initialUsername={connectUsername}
          onClose={() => setIsManualModalOpen(false)}
          onSave={handleSaveManual}
        />
      </div>
    );
  }

  const score = profile.leetcodeScore ?? 0;
  const { tier, subtitle } = getReadinessTier(score);
  const formattedSyncDate = profile.lastSyncedAt
    ? new Date(profile.lastSyncedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not synced";

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] leading-[14px] font-[600] text-[#e1dfff] uppercase tracking-widest">
                Algorithmic Telemetry
              </span>
              <span className="w-1 h-1 rounded-full bg-[#918f9a]" />
              <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] uppercase tracking-wider">
                Daily Sync Active
              </span>
            </div>
            <h1 className="text-[32px] leading-[40px] font-[600] text-[#e4e1ed] tracking-tight">
              LeetCode Problem Mastery
            </h1>
            <p className="text-[14px] leading-[22px] text-[#c7c5d0]">
              Continuous tracking of data structures, paradigms, contest rating, and interview problem coverage.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto shrink-0">
            <a
              href={`https://leetcode.com/${profile.leetcodeUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-lg bg-[#0d0d15] border border-[#46464f]/30 inline-flex items-center gap-2 hover:border-[#c0c1ff]/50 transition text-xs whitespace-nowrap text-[#e4e1ed]"
            >
              <span className="w-2 h-2 rounded-full bg-[#6bde80] shrink-0" />
              <span className="font-mono">
                @{profile.leetcodeUsername}
              </span>
              <span className="text-[#918f9a] text-[10px]">↗</span>
            </a>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="h-9 px-3.5 rounded-lg border border-[#46464f]/30 hover:border-[#c0c1ff]/40 text-xs text-[#c7c5d0] hover:text-[#e4e1ed] transition font-medium inline-flex items-center justify-center whitespace-nowrap active:scale-95"
            >
              Manual Update
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={() => handleSync()}
              className="h-9 px-4 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] font-semibold text-xs transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)] disabled:opacity-50 inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              {isSyncing && <span className="animate-spin text-xs">⟳</span>}
              <span>{isSyncing ? "Syncing..." : "Sync Profile"}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {syncNotification && (
          syncNotification.type === "cloudflare" ? (
            <div className="p-4 rounded-xl text-xs bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-base">⚠️</span>
                  <span className="font-semibold text-amber-300">Cloudflare Protection Detected</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncNotification(null)}
                  className="hover:opacity-75 font-bold text-amber-400"
                >
                  ✕
                </button>
              </div>
              <p>{syncNotification.text}</p>
              <button
                type="button"
                onClick={() => {
                  setSyncNotification(null);
                  setIsManualModalOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold transition"
              >
                Open Manual Metrics Entry →
              </button>
            </div>
          ) : (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between ${
              syncNotification.type === "error"
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
            }`}
          >
            <span>{syncNotification.text}</span>
            <button
              type="button"
              onClick={() => setSyncNotification(null)}
              className="hover:opacity-75 ml-2 font-bold"
            >
              ✕
            </button>
          </div>
          )
        )}

        {/* Overall Score Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#1b1b23] via-[#1f1f2e] to-[#1b1b23] border border-[#c0c1ff]/20 p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#c0c1ff] font-semibold">
              {tier}
            </span>
            <h2 className="text-2xl font-bold text-[#e4e1ed]">{subtitle}</h2>
            <p className="text-xs text-[#918f9a]">
              Last synced: {formattedSyncDate} • Evaluated against 500-point FAANG problem bar
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs uppercase text-[#918f9a] font-semibold tracking-wider block">
                LeetCode Score
              </span>
              <span className="text-4xl font-black text-[#e1dfff] tracking-tight">
                {score}
                <span className="text-base text-[#918f9a] font-normal"> / 100</span>
              </span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#131449] border border-[#c0c1ff]/40 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(192,193,255,0.2)]">
              ⚡
            </div>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">
              Total Solved
            </span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed]">
                {profile.totalSolved}
              </span>
              <span className="text-[16px] text-[#918f9a]">/ 3,200+</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#6bde80] flex items-center gap-1">
              {profile.totalSolved > 300
                ? "Top 5% Problem Volume"
                : profile.totalSolved > 100
                  ? "Intermediate Solve Volume"
                  : "Foundation Phase"}
            </span>
          </div>

          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">
              Contest Rating
            </span>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-[48px] leading-[56px] font-bold text-[#e1dfff]">
                {profile.contestRating ? profile.contestRating.toLocaleString() : "—"}
              </span>
              {profile.contestRating && profile.contestRating >= 1850 && (
                <span className="text-[12px] font-mono text-[#6bde80] bg-[#6bde80]/10 px-1.5 py-0.5 rounded border border-[#6bde80]/20">
                  {profile.contestRating >= 2150 ? "Guardian" : "Knight"}
                </span>
              )}
            </div>
            <span className="text-[12px] leading-[18px] text-[#918f9a]">
              {profile.contestRanking
                ? `Global Rank #${profile.contestRanking.toLocaleString()}`
                : profile.contestRating
                  ? "Competitive Track Active"
                  : "No Contests Recorded"}
            </span>
          </div>

          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">
              Hard Problems
            </span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#ffb4ab]">
                {profile.hardSolved}
              </span>
              <span className="text-[16px] text-[#918f9a]">Solved</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#c7c5d0]">
              High-signal FAANG differentiator
            </span>
          </div>

          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">
              Active Streak
            </span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#ffb867]">
                {profile.streakDays}
              </span>
              <span className="text-xl">🔥</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#918f9a]">
              Consistency and problem retention
            </span>
          </div>
        </div>

        {/* Difficulty and Topic Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <DifficultyBreakdown
              easySolved={profile.easySolved}
              mediumSolved={profile.mediumSolved}
              hardSolved={profile.hardSolved}
              totalSolved={profile.totalSolved}
            />
          </div>

          <div className="lg:col-span-6">
            <TopicBreakdown
              topicPerformance={profile.topicPerformance}
              weakTopics={profile.weakTopics}
            />
          </div>
        </div>

        {/* Recommendations */}
        <RecommendationsList
          recommendations={profile.recommendations}
          weakTopics={profile.weakTopics}
        />

        {/* Manual entry modal */}
        <ManualEntryModal
          isOpen={isManualModalOpen}
          initialUsername={profile.leetcodeUsername}
          initialEasy={profile.easySolved}
          initialMedium={profile.mediumSolved}
          initialHard={profile.hardSolved}
          initialRating={profile.contestRating}
          initialStreak={profile.streakDays}
          onClose={() => setIsManualModalOpen(false)}
          onSave={handleSaveManual}
        />
      </div>
    </div>
  );
}
