"use client";

import { useState, useEffect } from "react";

interface RecommendationItem {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  topic?: string;
  url: string;
}

interface RecommendationsListProps {
  recommendations: RecommendationItem[] | null;
  weakTopics: string[];
}

const STORAGE_KEY = "devmetric_user_solved_problems";

export function RecommendationsList({
  recommendations,
  weakTopics,
}: RecommendationsListProps) {
  const [dismissedSlugs, setDismissedSlugs] = useState<string[]>([]);
  const [justDismissed, setJustDismissed] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissedSlugs(JSON.parse(stored));
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  const handleMarkSolved = (slug: string) => {
    const updated = Array.from(new Set([...dismissedSlugs, slug.toLowerCase()]));
    setDismissedSlugs(updated);
    setJustDismissed(slug);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
    setTimeout(() => {
      setJustDismissed(null);
    }, 2500);
  };

  const handleResetDismissed = () => {
    setDismissedSlugs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const allItems = recommendations || [];
  const activeItems = allItems.filter(
    (item) => !dismissedSlugs.includes(item.slug.toLowerCase()),
  );

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">
              Recommended Practice Problems
            </h2>
            {justDismissed && (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-in fade-in">
                ✓ Marked as solved!
              </span>
            )}
          </div>
          <p className="text-[12px] leading-[18px] text-[#918f9a]">
            Curated high-signal FAANG interview problems specifically targeting your identified growth areas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {weakTopics.length > 0 && (
            <span className="text-[11px] font-mono text-[#e1dfff] bg-[#131449] border border-[#c0c1ff]/30 px-2.5 py-1 rounded-md">
              Focus: {weakTopics.slice(0, 2).join(", ")}
            </span>
          )}
          {dismissedSlugs.length > 0 && (
            <button
              type="button"
              onClick={handleResetDismissed}
              className="text-[11px] text-[#918f9a] hover:text-[#c0c1ff] underline"
            >
              Reset Solved Filters ({dismissedSlugs.length})
            </button>
          )}
        </div>
      </div>

      {activeItems.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#0d0d15] border border-[#46464f]/30 text-center space-y-3">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-[#e4e1ed] font-medium">
            You have solved all currently recommended practice problems!
          </p>
          <p className="text-xs text-[#918f9a]">
            Trigger a fresh sync to evaluate updated problem coverage or reset filtered problems.
          </p>
          <button
            type="button"
            onClick={handleResetDismissed}
            className="px-4 py-2 rounded-lg bg-[#c0c1ff] text-[#131449] font-bold text-xs hover:bg-[#e1dfff] transition"
          >
            Show All Curated Problems
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeItems.map((prob) => {
            let diffBadge = "text-[#6bde80] bg-[#6bde80]/10 border-[#6bde80]/20";
            if (prob.difficulty === "Medium") {
              diffBadge = "text-[#ffb867] bg-[#ffb867]/10 border-[#ffb867]/20";
            } else if (prob.difficulty === "Hard") {
              diffBadge = "text-[#ffb4ab] bg-[#ffb4ab]/10 border-[#ffb4ab]/20";
            }

            const isWeakMatch =
              prob.topic &&
              weakTopics.some(
                (w) =>
                  w.toLowerCase().includes(prob.topic!.toLowerCase()) ||
                  prob.topic!.toLowerCase().includes(w.toLowerCase()),
              );

            return (
              <div
                key={prob.slug}
                className="group p-4 rounded-xl bg-[#0d0d15] border border-[#46464f]/20 hover:border-[#c0c1ff]/50 transition-all flex flex-col justify-between hover:shadow-[0_0_15px_rgba(192,193,255,0.1)] relative"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${diffBadge}`}
                      >
                        {prob.difficulty}
                      </span>
                      {prob.topic && (
                        <span className="text-[10px] font-mono text-[#918f9a]">
                          {prob.topic}
                        </span>
                      )}
                    </div>
                    {isWeakMatch && (
                      <span className="text-[10px] font-mono text-[#ffb867] bg-[#ffb867]/10 px-1.5 py-0.5 rounded border border-[#ffb867]/20">
                        Growth Target
                      </span>
                    )}
                  </div>

                  <a
                    href={prob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="text-[14px] font-semibold text-[#e4e1ed] group-hover:text-[#c0c1ff] transition-colors leading-snug">
                      {prob.title}
                    </h3>
                  </a>
                </div>

                <div className="mt-4 pt-3 border-t border-[#46464f]/15 flex items-center justify-between text-xs text-[#918f9a]">
                  <a
                    href={prob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#e4e1ed] flex items-center gap-1"
                  >
                    <span>Solve on LeetCode</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      ↗
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleMarkSolved(prob.slug)}
                    title="Mark this problem as already solved to remove it from recommendations"
                    className="text-[11px] text-[#918f9a] hover:text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-500/10 transition flex items-center gap-1"
                  >
                    <span>✓</span>
                    <span>Already Solved</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
