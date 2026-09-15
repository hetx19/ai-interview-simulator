"use client";

interface DifficultyBreakdownProps {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
}

export function DifficultyBreakdown({
  easySolved,
  mediumSolved,
  hardSolved,
  totalSolved,
}: DifficultyBreakdownProps) {
  const totalSafe = Math.max(1, totalSolved);
  const easyPct = ((easySolved / totalSafe) * 100).toFixed(1);
  const medPct = ((mediumSolved / totalSafe) * 100).toFixed(1);
  const hardPct = ((hardSolved / totalSafe) * 100).toFixed(1);

  return (
    <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">
          Difficulty Breakdown
        </h2>
        <span className="text-[10px] font-mono text-[#918f9a]">
          {totalSolved} Problems Solved
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-[#0d0d15] rounded-full overflow-hidden flex gap-0.5">
        <div
          className="bg-[#6bde80] h-full rounded-l-full transition-all duration-500"
          style={{ width: `${totalSolved === 0 ? 33.3 : easyPct}%` }}
          title={`Easy: ${easySolved}`}
        />
        <div
          className="bg-[#ffb867] h-full transition-all duration-500"
          style={{ width: `${totalSolved === 0 ? 33.3 : medPct}%` }}
          title={`Medium: ${mediumSolved}`}
        />
        <div
          className="bg-[#ffb4ab] h-full rounded-r-full transition-all duration-500"
          style={{ width: `${totalSolved === 0 ? 33.4 : hardPct}%` }}
          title={`Hard: ${hardSolved}`}
        />
      </div>

      {/* Difficulty Counts Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-[#0d0d15] p-3 rounded-lg border border-[#6bde80]/20">
          <span className="text-[10px] font-semibold text-[#6bde80] uppercase block tracking-wider">
            Easy
          </span>
          <span className="text-[24px] font-bold text-[#e4e1ed]">
            {easySolved}
          </span>
          <span className="text-[10px] text-[#918f9a] block">
            {easyPct}% of solved
          </span>
        </div>
        <div className="bg-[#0d0d15] p-3 rounded-lg border border-[#ffb867]/20">
          <span className="text-[10px] font-semibold text-[#ffdcba] uppercase block tracking-wider">
            Medium
          </span>
          <span className="text-[24px] font-bold text-[#e4e1ed]">
            {mediumSolved}
          </span>
          <span className="text-[10px] text-[#918f9a] block">
            {medPct}% of solved
          </span>
        </div>
        <div className="bg-[#0d0d15] p-3 rounded-lg border border-[#ffb4ab]/20">
          <span className="text-[10px] font-semibold text-[#ffb4ab] uppercase block tracking-wider">
            Hard
          </span>
          <span className="text-[24px] font-bold text-[#e4e1ed]">
            {hardSolved}
          </span>
          <span className="text-[10px] text-[#918f9a] block">
            {hardPct}% of solved
          </span>
        </div>
      </div>

      {/* Calibration Insight */}
      <div className="p-3 bg-[#0d0d15] rounded-lg border border-[#46464f]/20 space-y-1">
        <div className="flex items-center gap-1.5 text-[#e1dfff] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#c0c1ff]" />
          <span>FAANG Calibration Rubric</span>
        </div>
        <p className="text-[12px] leading-[18px] text-[#c7c5d0]">
          {hardSolved < 15 ? (
            <>
              Aim for at least <strong>15–20 Hard problems</strong> in Graphs, Trees, and Dynamic Programming to reach the top tier for Senior L5+ interviews.
            </>
          ) : (
            <>
              Strong problem volume! Maintain momentum with mock contest timing and speed optimization.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
