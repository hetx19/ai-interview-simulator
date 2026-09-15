"use client";

import { useState, useRef, useEffect } from "react";

interface TopicPerformanceEntry {
  solved: number;
  category?: string;
  status: string;
}

interface TopicBreakdownProps {
  topicPerformance: Record<string, TopicPerformanceEntry> | null;
  weakTopics: string[];
}

export function TopicBreakdown({ topicPerformance, weakTopics }: TopicBreakdownProps) {
  const [activeTab, setActiveTab] = useState<"saturation" | "growth" | "all">("saturation");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const defaultTopics = [
    { name: "Arrays & Strings", solved: 0, status: "Not Started" },
    { name: "Dynamic Programming", solved: 0, status: "Not Started" },
    { name: "Trees & Binary Search", solved: 0, status: "Not Started" },
    { name: "Graphs & Topological Sort", solved: 0, status: "Not Started" },
    { name: "Two Pointers & Sliding Window", solved: 0, status: "Not Started" },
    { name: "Stack & Monotonic Stack", solved: 0, status: "Not Started" },
  ];

  const topicsList =
    topicPerformance && Object.keys(topicPerformance).length > 0
      ? Object.entries(topicPerformance).map(([name, data]) => ({
          name,
          solved: data.solved || 0,
          status: data.status || "Not Started",
          category: data.category || "intermediate",
        }))
      : defaultTopics;

  // Filter lists
  const saturatedTopics = [...topicsList]
    .filter((t) => t.solved >= 10)
    .sort((a, b) => b.solved - a.solved);

  const growthTopics = [...topicsList]
    .filter((t) => t.solved < 10)
    .sort((a, b) => {
      // Prioritize topics that have at least 1 solve over untouched 0
      if (a.solved > 0 && b.solved === 0) return -1;
      if (b.solved > 0 && a.solved === 0) return 1;
      return b.solved - a.solved;
    });

  const allTopicsSorted = [...topicsList].sort((a, b) => b.solved - a.solved);

  let currentList = saturatedTopics;
  if (activeTab === "growth") currentList = growthTopics;
  else if (activeTab === "all") currentList = allTopicsSorted;

  // If active tab has no items (e.g. beginner has no saturated topics), fallback to all
  if (currentList.length === 0) {
    currentList = allTopicsSorted;
  }

  // Show all topics in the dedicated scrollable view
  const displayTopics = currentList;

  // Smooth scroll back to top of container when tab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-5 sm:p-6 border border-[#46464f]/20 shadow-xl flex flex-col justify-between">
      {/* Section Header & Compact Navigation */}
      <div className="space-y-2.5 pb-3.5 border-b border-[#46464f]/15">
        {/* Title & Badge */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#e4e1ed] tracking-tight">
            Saturation &amp; Mastery
          </h2>
          {weakTopics.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-[#e1dfff] bg-[#131449] border border-[#c0c1ff]/25 shadow-xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]" />
              {weakTopics.length} Focus Areas
            </span>
          )}
        </div>

        {/* Supporting description */}
        <p className="text-[12px] leading-[18px] text-[#918f9a]">
          {activeTab === "saturation"
            ? "Your strongest algorithmic pillars with deep problem-solving coverage."
            : activeTab === "growth"
              ? "Targeted growth areas where additional practice will expand interview coverage."
              : "Comprehensive catalog of all evaluated LeetCode topic tags."}
        </p>

        {/* Compact Tabs - Proportional and Aligned to Content */}
        <div className="flex items-center overflow-x-auto no-scrollbar pt-1">
          <div
            role="tablist"
            aria-label="Topic saturation categories"
            className="inline-flex items-center p-0.5 rounded-lg bg-[#0d0d15] border border-[#46464f]/30 gap-1 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "saturation"}
              onClick={() => setActiveTab("saturation")}
              className={`h-7 px-3 rounded-md text-[11px] sm:text-xs font-medium inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none ${
                activeTab === "saturation"
                  ? "bg-[#c0c1ff] text-[#131449] font-semibold shadow-xs"
                  : "text-[#918f9a] hover:text-[#e4e1ed] hover:bg-[#1b1b23]"
              }`}
            >
              Saturation ({saturatedTopics.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "growth"}
              onClick={() => setActiveTab("growth")}
              className={`h-7 px-3 rounded-md text-[11px] sm:text-xs font-medium inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none ${
                activeTab === "growth"
                  ? "bg-[#c0c1ff] text-[#131449] font-semibold shadow-xs"
                  : "text-[#918f9a] hover:text-[#e4e1ed] hover:bg-[#1b1b23]"
              }`}
            >
              Growth Areas ({growthTopics.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              className={`h-7 px-3 rounded-md text-[11px] sm:text-xs font-medium inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none ${
                activeTab === "all"
                  ? "bg-[#c0c1ff] text-[#131449] font-semibold shadow-xs"
                  : "text-[#918f9a] hover:text-[#e4e1ed] hover:bg-[#1b1b23]"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Scrollable Topics list container */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Topic list"
        className="mt-3 overflow-y-auto max-h-[320px] pr-2 space-y-3 subtle-scrollbar overscroll-contain focus:outline-none"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {displayTopics.length > 0 ? (
          displayTopics.map((topic) => {
            // Saturation calculations
            let statusLabel = "Proficient";
            let barColor = "bg-[#6bde80]";
            let tagColor = "text-[#6bde80] bg-[#6bde80]/10 border-[#6bde80]/20";
            let pct = 100;

            if (topic.solved >= 50) {
              statusLabel = "Mastered";
              barColor = "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]";
              tagColor = "text-emerald-300 bg-emerald-500/10 border-emerald-500/30 font-semibold";
              pct = 100;
            } else if (topic.solved >= 25) {
              statusLabel = "Saturated";
              barColor = "bg-[#6bde80]";
              tagColor = "text-[#6bde80] bg-[#6bde80]/10 border-[#6bde80]/20 font-medium";
              pct = Math.min(100, Math.round((topic.solved / 50) * 100));
            } else if (topic.solved >= 10) {
              statusLabel = "Proficient";
              barColor = "bg-[#80b5ff]";
              tagColor = "text-[#80b5ff] bg-[#80b5ff]/10 border-[#80b5ff]/20 font-medium";
              pct = Math.min(100, Math.round((topic.solved / 25) * 100));
            } else if (topic.solved >= 3) {
              statusLabel = "Focus Area";
              barColor = "bg-[#ffb867]";
              tagColor = "text-[#ffb867] bg-[#ffb867]/10 border-[#ffb867]/20 font-medium";
              pct = Math.min(100, Math.round((topic.solved / 15) * 100));
            } else {
              statusLabel = topic.solved > 0 ? "Developing" : "Not Started";
              barColor = "bg-[#918f9a]";
              tagColor = "text-[#918f9a] bg-[#918f9a]/10 border-[#918f9a]/20";
              pct = topic.solved > 0 ? Math.round((topic.solved / 15) * 100) : 5;
            }

            return (
              <div key={topic.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px] gap-2">
                  <span className="text-[#e4e1ed] font-medium flex items-center gap-1.5 truncate pr-2">
                    <span className="truncate">{topic.name}</span>
                    {topic.solved >= 50 && (
                      <span className="text-emerald-400 text-xs shrink-0" title="Mastered (50+ solved)">
                        ★
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#918f9a] text-[11px] font-mono">
                      {topic.solved} solved
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${tagColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[#918f9a] text-center py-6">No topics available in this category.</p>
        )}
        {/* Bottom padding spacer so the final topic item is completely accessible and not clipped */}
        <div className="h-1 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
