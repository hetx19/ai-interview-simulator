export default function LeetCodeMetricsPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">

        {/* header */}
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

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#0d0d15] border border-[#46464f]/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6bde80]" />
              <span className="font-mono text-xs text-[#e4e1ed]">@alex_mercer_code</span>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] font-semibold text-xs transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)]"
            >
              Sync Profile
            </button>
          </div>
        </div>

        {/* stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">Total Solved</span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed]">412</span>
              <span className="text-[16px] text-[#918f9a]">/ 3,100</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#6bde80] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> Top 5.2% Globally
            </span>
          </div>

          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">Contest Rating</span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#e1dfff]">1,942</span>
              <span className="text-[12px] font-mono text-[#6bde80] bg-[#6bde80]/10 px-1.5 py-0.5 rounded">Knight</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#918f9a]">Top 4.8% (24 Contests)</span>
          </div>

          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">Acceptance Rate</span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#6bde80]">68.4%</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#c7c5d0]">First-try submissions</span>
          </div>

          <div className="rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl">
            <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">Active Streak</span>
            <div className="my-3 flex items-baseline gap-1">
              <span className="text-[48px] leading-[56px] font-bold text-[#ffb867]">64 Days</span>
              <span className="text-xl">🔥</span>
            </div>
            <span className="text-[12px] leading-[18px] text-[#918f9a]">Daily Problem solved today</span>
          </div>
        </div>

        {/* difficulty & topic breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* difficulty breakdown */}
          <div className="lg:col-span-6 rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Difficulty Breakdown</h2>
              <span className="text-[10px] font-mono text-[#918f9a]">412 Problems</span>
            </div>

            {/* progress bar */}
            <div className="w-full h-3 bg-[#0d0d15] rounded-full overflow-hidden flex gap-0.5">
              <div className="bg-[#6bde80] h-full rounded-l-full" style={{ width: "29.1%" }} />
              <div className="bg-[#ffb867] h-full" style={{ width: "54.3%" }} />
              <div className="bg-[#ffb4ab] h-full rounded-r-full" style={{ width: "16.5%" }} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#0d0d15] p-3 rounded-lg border border-[#6bde80]/20">
                <span className="text-[10px] font-semibold text-[#6bde80] uppercase block">Easy</span>
                <span className="text-[24px] font-bold text-[#e4e1ed]">120</span>
                <span className="text-[10px] text-[#918f9a]">/ 810</span>
              </div>
              <div className="bg-[#0d0d15] p-3 rounded-lg border border-[#ffb867]/20">
                <span className="text-[10px] font-semibold text-[#ffdcba] uppercase block">Medium</span>
                <span className="text-[24px] font-bold text-[#e4e1ed]">224</span>
                <span className="text-[10px] text-[#918f9a]">/ 1,650</span>
              </div>
              <div className="bg-[#0d0d15] p-3 rounded-lg border border-[#ffb4ab]/20">
                <span className="text-[10px] font-semibold text-[#ffb4ab] uppercase block">Hard</span>
                <span className="text-[24px] font-bold text-[#e4e1ed]">68</span>
                <span className="text-[10px] text-[#918f9a]">/ 640</span>
              </div>
            </div>

            {/* recommendations */}
            <div className="p-3 bg-[#0d0d15] rounded-lg border border-[#46464f]/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[#e1dfff] text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                <span>Recommendation for Staff Round</span>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0]">
                Solve 12 more <strong>Hard Dynamic Programming</strong> &amp; <strong>Concurrency</strong> problems to achieve the 95th percentile benchmark.
              </p>
            </div>
          </div>

          {/* topic breakdown */}
          <div className="lg:col-span-6 rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Topic Saturation</h2>
              <span className="text-[10px] font-mono text-[#6bde80]">FAANG Rubric</span>
            </div>

            <div className="space-y-3">
              {[
                { name: "Dynamic Programming", pct: 91, count: "58 solved", color: "bg-[#6bde80]" },
                { name: "Graphs / BFS / DFS", pct: 88, count: "47 solved", color: "bg-[#6bde80]" },
                { name: "Trees & Binary Search", pct: 84, count: "62 solved", color: "bg-[#e1dfff]" },
                { name: "System Design Invariants", pct: 78, count: "24 solved", color: "bg-[#c0c1ff]" },
                { name: "Heaps / Priority Queues", pct: 72, count: "31 solved", color: "bg-[#ffb867]" },
                { name: "Bit Manipulation", pct: 54, count: "16 solved", color: "bg-[#ffb4ab]" },
              ].map((t) => (
                <div key={t.name} className="space-y-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#e4e1ed] font-medium">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#918f9a] text-[10px]">{t.count}</span>
                      <span className="font-mono font-semibold text-[#e1dfff]">{t.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                    <div className={`${t.color} h-full rounded-full`} style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
