"use client";

import { useState } from "react";

interface ManualEntryModalProps {
  isOpen: boolean;
  initialUsername?: string;
  initialEasy?: number;
  initialMedium?: number;
  initialHard?: number;
  initialRating?: number | null;
  initialStreak?: number;
  onClose: () => void;
  onSave: (data: {
    leetcodeUsername: string;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    contestRating?: number | null;
    streakDays?: number;
  }) => Promise<void>;
}

export function ManualEntryModal({
  isOpen,
  initialUsername = "",
  initialEasy = 0,
  initialMedium = 0,
  initialHard = 0,
  initialRating = null,
  initialStreak = 0,
  onClose,
  onSave,
}: ManualEntryModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [easy, setEasy] = useState(initialEasy.toString());
  const [medium, setMedium] = useState(initialMedium.toString());
  const [hard, setHard] = useState(initialHard.toString());
  const [rating, setRating] = useState(initialRating?.toString() || "");
  const [streak, setStreak] = useState(initialStreak.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please provide your LeetCode username.");
      return;
    }

    const easyVal = Math.max(0, parseInt(easy || "0", 10) || 0);
    const medVal = Math.max(0, parseInt(medium || "0", 10) || 0);
    const hardVal = Math.max(0, parseInt(hard || "0", 10) || 0);
    const ratingVal = rating.trim() ? parseInt(rating.trim(), 10) : null;
    const streakVal = Math.max(0, parseInt(streak || "0", 10) || 0);

    setIsSubmitting(true);
    try {
      await onSave({
        leetcodeUsername: trimmedUsername,
        easySolved: easyVal,
        mediumSolved: medVal,
        hardSolved: hardVal,
        contestRating: ratingVal,
        streakDays: streakVal,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#1b1b23] border border-[#46464f]/30 p-6 shadow-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#ffb867] uppercase tracking-wider bg-[#ffb867]/10 px-2 py-0.5 rounded border border-[#ffb867]/20">
                Self-Reported Fallback
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#e4e1ed] mt-1">
              Manual LeetCode Telemetry
            </h2>
            <p className="text-xs text-[#918f9a] mt-0.5">
              Enter your problem-solving metrics directly if automated sync is throttled or blocked.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#918f9a] hover:text-[#e4e1ed] transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c7c5d0] mb-1">
              LeetCode Username *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. neetcode_fan"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0d15] border border-[#46464f]/30 text-[#e4e1ed] placeholder-[#918f9a] text-sm focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6bde80] mb-1">
                Easy Solved
              </label>
              <input
                type="number"
                min="0"
                value={easy}
                onChange={(e) => setEasy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0d15] border border-[#6bde80]/30 text-[#e4e1ed] text-sm focus:outline-none focus:border-[#6bde80]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#ffb867] mb-1">
                Medium Solved
              </label>
              <input
                type="number"
                min="0"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0d15] border border-[#ffb867]/30 text-[#e4e1ed] text-sm focus:outline-none focus:border-[#ffb867]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#ffb4ab] mb-1">
                Hard Solved
              </label>
              <input
                type="number"
                min="0"
                value={hard}
                onChange={(e) => setHard(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0d15] border border-[#ffb4ab]/30 text-[#e4e1ed] text-sm focus:outline-none focus:border-[#ffb4ab]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#c7c5d0] mb-1">
                Contest Rating (Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1850"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0d15] border border-[#46464f]/30 text-[#e4e1ed] placeholder-[#918f9a] text-sm focus:outline-none focus:border-[#c0c1ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c7c5d0] mb-1">
                Active Streak (Days)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 30"
                value={streak}
                onChange={(e) => setStreak(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0d15] border border-[#46464f]/30 text-[#e4e1ed] placeholder-[#918f9a] text-sm focus:outline-none focus:border-[#c0c1ff]"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0d0d15] border border-[#46464f]/20 text-[11px] text-[#918f9a] space-y-1">
            <span className="font-semibold text-[#e1dfff] block">
              Transparency Notice
            </span>
            <p>
              Self-reported telemetry will be displayed with a visible &quot;Self-Reported&quot; badge to preserve data integrity across hiring evaluations.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#46464f]/30 text-[#c7c5d0] hover:text-[#e4e1ed] text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] text-xs font-semibold transition shadow-[0_0_12px_rgba(192,193,255,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? "Calculating & Saving..." : "Save Metrics"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
