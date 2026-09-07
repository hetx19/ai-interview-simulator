// dashboard overview page

// inline svg components

function ScoreGauge({ score }: { score: number }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="scoreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c0c1ff" />
          <stop offset="60%" stopColor="#8083ff" />
          <stop offset="100%" stopColor="#6bde80" />
        </linearGradient>
        <filter id="gaugeNeon" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#c0c1ff" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* track */}
      <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#1f1f27" strokeWidth="12" />
      {/* score ring */}
      <circle
        cx="80" cy="80" r={radius}
        fill="transparent"
        stroke="url(#scoreGlow)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        filter="url(#gaugeNeon)"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
}

function MiniRingMeter({ value, color = "text-[#e1dfff]" }: { value: number; color?: string }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className={`w-16 h-16 transform -rotate-90 ${color}`} viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="currentColor" strokeWidth="3.5"
          className="text-[#292932] opacity-80"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="currentColor" strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${value}, 100`}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <span className="absolute text-[10px] leading-[14px] font-[600] tracking-[0.06em]">{value}%</span>
    </div>
  );
}

// contribution heatmap demo
const HEATMAP_DATA = [
  [0,0.3,0.8,1,0,0.5],[1,0.6,0,0.4,1,0.8],[0.4,1,1,0.9,0,0.5],[0,0,0.6,1,0.8,1],
  [1,1,0.4,0,0.7,1],[0.3,1,1,0.8,0,1],[1,1,0,0.5,1,1],[0.9,0,0.7,1,1,0.4],
  [1,1,1,0,0.6,1],[0,0.4,1,1,1,0.8],[1,1,0.5,1,0,1],[0.7,0,1,1,1,0.4],
  [1,1,1,1,0,1],[0.8,1,0,0.3,1,1],[1,1,1,1,0,0.9],[0,0.3,1,1,1,1],
  [0.8,1,0,1,1,0.6],[1,1,1,1,0,1],[0,1,0.9,1,1,1],[1,1,1,0,1,1],
  [1,1,1,1,0,1],[1,0.8,1,0,1,1],[1,1,0,0.9,1,1],  [0.7,1,1,1,0,1],
  [1,1,1,1,0.5,1],[1,1,1,1,1,1],
];

const HEATMAP_CELLS = [
  1, 2, 0, 3, 2, 1, 3, 2, 0, 1, 2, 3,
  2, 3, 1, 0, 2, 3, 3, 2, 1, 2, 3, 3,
];

function ContribHeatmap() {
  return (
    <svg className="w-full h-24 min-w-[300px]" viewBox="0 0 312 80">
      <g>
        {HEATMAP_DATA.map((col, ci) =>
          col.map((v, ri) => (
            <rect
              key={`${ci}-${ri}`}
              x={ci * 12}
              y={ri * 11 + 4}
              width="8"
              height="8"
              rx="2"
              fill={v === 0 ? "#34343d" : "#6bde80"}
              fillOpacity={v === 0 ? 1 : v}
            />
          ))
        )}
      </g>
    </svg>
  );
}

function RadarChart() {
  const points = "120,38 182,78 182,162 120,202 58,162 58,78";
  const benchmark = "120,52 170,86 170,154 120,188 70,154 70,86";
  return (
    <svg className="w-full h-full" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="radarGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c0c1ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6bde80" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* background grid rings */}
      <polygon points="120,20 206,70 206,170 120,220 34,170 34,70" fill="none" stroke="#292932" strokeWidth="1" strokeDasharray="3 3" />
      <polygon points="120,50 178,83 178,150 120,183 62,150 62,83" fill="none" stroke="#292932" strokeWidth="1" strokeDasharray="3 3" />
      <polygon points="120,80 150,97 150,130 120,147 90,130 90,97" fill="none" stroke="#1f1f27" strokeWidth="1" />
      {/* axes */}
      <line x1="120" y1="20" x2="120" y2="220" stroke="#292932" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="34" y1="70" x2="206" y2="170" stroke="#292932" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="34" y1="170" x2="206" y2="70" stroke="#292932" strokeWidth="1" strokeDasharray="2 2" />
      {/* benchmark polygon (faded target) */}
      <polygon points={benchmark} fill="none" stroke="#c0c1ff" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
      {/* candidate polygon */}
      <polygon points={points} fill="url(#radarGlow)" stroke="#6bde80" strokeWidth="2" />
      {/* vertex dots */}
      <circle cx="120" cy="38" r="3.5" fill="#6bde80" />
      <circle cx="182" cy="78" r="3.5" fill="#6bde80" />
      <circle cx="182" cy="162" r="3.5" fill="#6bde80" />
      <circle cx="120" cy="202" r="3.5" fill="#6bde80" />
      <circle cx="58" cy="162" r="3.5" fill="#6bde80" />
      <circle cx="58" cy="78" r="3.5" fill="#6bde80" />
      {/* labels */}
      <g className="text-[10px] fill-[#c7c5d0] font-[500]" textAnchor="middle">
        <text x="120" y="14">System Arch (90)</text>
        <text x="215" y="74">DSA (88)</text>
        <text x="215" y="174">Comm (82)</text>
        <text x="120" y="234">Concurrency (76)</text>
        <text x="22" y="174">Testing (70)</text>
        <text x="22" y="74">Speed (85)</text>
      </g>
    </svg>
  );
}

// signal component cards
const SIGNAL_COMPONENTS = [
  {
    icon: "terminal",
    label: "GitHub Activity",
    weight: "20% weight",
    subtitle: "Excellent commit velocity",
    subtitleColor: "text-[#6bde80]",
    iconColor: "text-[#e1dfff]",
    score: 88,
    scoreColor: "text-[#e1dfff]",
    barClass: "from-[#e1dfff] via-[#c0c1ff] to-[#6bde80]",
  },
  {
    icon: "code_blocks",
    label: "LeetCode Mastery",
    weight: "30% weight",
    subtitle: "Strong graph & DP fundamentals",
    subtitleColor: "text-[#c7c5d0]",
    iconColor: "text-[#6bde80]",
    score: 82,
    scoreColor: "text-[#e1dfff]",
    barClass: "from-[#e1dfff] to-[#6bde80]",
  },
  {
    icon: "document_scanner",
    label: "Resume ATS Fit",
    weight: "20% weight",
    subtitle: "Needs 3 high-impact keywords",
    subtitleColor: "text-[#ffdcba]",
    iconColor: "text-[#ffb867]",
    score: 79,
    scoreColor: "text-[#ffb867]",
    barClass: "from-[#ffb867] to-[#ffdcba]",
  },
  {
    icon: "mic",
    label: "AI Mock Interview",
    weight: "30% weight",
    subtitle: "Top communication clarity",
    subtitleColor: "text-[#6bde80]",
    iconColor: "text-[#c0c1ff]",
    score: 86,
    scoreColor: "text-[#e1dfff]",
    barClass: "from-[#e1dfff] via-[#c0c1ff] to-[#6bde80]",
  },
];

// mock interview sessions
const SESSIONS = [
  { title: "Concurrent Rate Limiter (Token Bucket)", score: "94%", color: "bg-[#6bde80]", pass: true },
  { title: "LRU Cache with TTL Eviction", score: "88%", color: "bg-[#6bde80]", pass: true },
  { title: "Consensus Algorithm (Raft Simplified)", score: "71%", color: "bg-[#ffb867]", pass: false },
];

// page
export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="px-6 py-8 flex flex-col gap-8 max-w-[1440px] mx-auto w-full">

        {/* header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#6bde80] shadow-[0_0_10px_rgba(107,222,128,0.7)] animate-pulse" />
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">
                Telemetry Hub / Live Candidate Vector
              </span>
            </div>
            <h1 className="text-[32px] leading-[40px] font-[600] tracking-[-0.015em] text-[#e4e1ed] flex items-center gap-2 flex-wrap">
              Engineering Readiness Pulse
              <span className="bg-[#292932] text-[#e1dfff] px-2 py-0.5 rounded-full text-[12px] leading-[16px] font-[400]">
                Q2 Target Cycle
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[12px] leading-[18px] text-[#918f9a]">Last algorithmic sync:</span>
            <span className="bg-[#1f1f27] px-2 py-1 rounded-lg text-[#6bde80] text-[12px] leading-[16px] font-[600]">
              2 mins ago
            </span>
          </div>
        </div>

        {/* readiness card */}
        <div className="relative bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-6 lg:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.45)] overflow-hidden">
          {/* ambient glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#c0c1ff]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-[#6bde80]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* radial gauge */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-8 bg-[#0d0d15]/80 p-6 rounded-xl shadow-inner">
              <div className="relative flex items-center justify-center flex-shrink-0">
                <ScoreGauge score={84} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">
                    Composite Index
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[48px] leading-[56px] font-[600] tracking-[-0.02em] text-[#e1dfff] font-bold">84</span>
                    <span className="text-[18px] leading-[26px] font-[600] text-[#918f9a]">/100</span>
                  </div>
                  <span className="text-[12px] leading-[16px] font-[500] text-[#6bde80] flex items-center gap-0.5 mt-0.5">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    +12 pts this month
                  </span>
                </div>
              </div>

              {/* tier stats */}
              <div className="flex flex-col items-center sm:items-start lg:items-center xl:items-start gap-3 text-center sm:text-left lg:text-center xl:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6bde80]/15 text-[#6bde80] shadow-[0_0_16px_rgba(107,222,128,0.25)]">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span className="text-[12px] leading-[16px] font-[600] tracking-wider uppercase">FAANG Ready</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Tier 1 Target Reachable</span>
                  <p className="text-[12px] leading-[18px] text-[#918f9a] mt-0.5">
                    Ranked in the <span className="text-[#e1dfff] font-semibold">Top 4% of Candidates</span> across Meta, Apple, Amazon, Netflix, and Google telemetry benchmarks.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Global Rank</span>
                    <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">#1,482</span>
                  </div>
                  <div className="w-px h-6 bg-[#46464f]/40" />
                  <div className="flex flex-col">
                    <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Confidence</span>
                    <span className="text-[16px] leading-[24px] font-[500] text-[#6bde80] font-semibold">97.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* breakdown cards */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] leading-[16px] font-[500] uppercase tracking-wider text-[#918f9a]">
                  Multi-Vector Signal Breakdown
                </span>
                <span className="text-[12px] leading-[16px] font-[500] text-[#c0c1ff]">
                  Weighted Scoring Model v4.2
                </span>
              </div>

              {SIGNAL_COMPONENTS.map((s) => (
                <div
                  key={s.label}
                  className="bg-[#1f1f27]/70 rounded-xl p-3 flex flex-col gap-1.5 hover:bg-[#292932]/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#34343d] flex items-center justify-center">
                        <span className={`material-symbols-outlined text-lg ${s.iconColor}`}>{s.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">{s.label}</span>
                          <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] bg-[#0d0d15] px-1.5 py-0.5 rounded">
                            {s.weight}
                          </span>
                        </div>
                        <span className={`text-[12px] leading-[18px] ${s.subtitleColor}`}>{s.subtitle}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[18px] leading-[26px] font-[600] ${s.scoreColor} font-bold`}>{s.score}</span>
                      <span className="text-[12px] leading-[18px] text-[#918f9a]">/100</span>
                    </div>
                  </div>
                  {/* progress bar */}
                  <div className="w-full h-2 bg-[#0d0d15] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${s.barClass} rounded-full`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* action toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-[#1f1f27]/80 backdrop-blur-md p-3 rounded-xl shadow-lg">
          {/* primary action */}
          <button
            type="button"
            className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-[#c0c1ff] text-[#292b5e] text-[16px] leading-[24px] font-[500] font-bold shadow-[0_0_24px_rgba(192,193,255,0.4)] hover:shadow-[0_0_32px_rgba(192,193,255,0.65)] hover:bg-[#e1dfff] transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">smart_toy</span>
            <span>Start AI Mock Interview</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          {/* secondary actions */}
          {[
            { icon: "sync", label: "Sync GitHub Activity" },
            { icon: "upload_file", label: "Upload New Resume" },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              className="flex items-center gap-1.5 px-3 py-3 rounded-lg bg-[#292932]/80 text-[#e4e1ed] text-[14px] leading-[22px] hover:bg-[#34343d] hover:text-[#e1dfff] transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#918f9a] text-base">{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-3 rounded-lg bg-[#292932]/80 text-[#e4e1ed] text-[14px] leading-[22px] hover:bg-[#34343d] hover:text-[#e1dfff] transition-all active:scale-[0.98] sm:ml-auto"
          >
            <span className="material-symbols-outlined text-[#918f9a] text-base">public</span>
            <span>View Public Profile</span>
            <span className="material-symbols-outlined text-[#918f9a] text-xs">open_in_new</span>
          </button>
        </div>

        {/* analytics grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

          {/* github widget */}
          <div className="bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-6 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#46464f]/30">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#6bde80]">terminal</span>
                  <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">GitHub Engine</span>
                </div>
                <span className="bg-[#6bde80]/10 text-[#6bde80] px-1.5 py-0.5 rounded text-[10px] leading-[14px] font-[600] uppercase">
                  Active Trace
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6 bg-[#0d0d15]/70 p-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Past Year Commits</span>
                  <span className="text-[28px] leading-[36px] font-[600] tracking-[-0.01em] text-[#e4e1ed] font-bold">1,248</span>
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#6bde80] mt-0.5">Top 3% percentile</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Weekly Pace</span>
                  <span className="text-[28px] leading-[36px] font-[600] tracking-[-0.01em] text-[#c0c1ff] font-bold">34.2</span>
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] mt-0.5">commits / week</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Recent Pulse</span>
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a]">24 Weeks</span>
                </div>
                <div className="grid grid-cols-12 gap-1 p-2 bg-[#0d0d15]/50 rounded-lg">
                  {HEATMAP_CELLS.map((intensity, i) => (
                    <div
                      key={i}
                      className={`h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer ${
                        intensity === 0
                          ? "bg-[#1f1f27]"
                          : intensity === 1
                          ? "bg-[#6bde80]/25"
                          : intensity === 2
                          ? "bg-[#6bde80]/55"
                          : "bg-[#6bde80] shadow-[0_0_6px_rgba(107,222,128,0.6)]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between">
              <span className="text-[12px] leading-[18px] text-[#918f9a]">Branch Health: Optimal</span>
              <a href="#" className="text-[#6bde80] text-[12px] leading-[18px] hover:underline flex items-center gap-1">
                Full GitHub Report <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          </div>

          {/* leetcode widget */}
          <div className="bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-6 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#46464f]/30">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#e1dfff]">code_blocks</span>
                  <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">LeetCode Mastery</span>
                </div>
                <span className="bg-[#e1dfff]/10 text-[#e1dfff] px-1.5 py-0.5 rounded text-[10px] leading-[14px] font-[600]">
                  Rating 1,942
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-[48px] leading-[56px] font-[600] tracking-[-0.02em] text-[#e4e1ed] font-bold">412</span>
                  <span className="text-[14px] leading-[22px] text-[#918f9a]">/ 3,100 Solved</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a] block">Acceptance</span>
                  <span className="text-[16px] leading-[24px] font-[500] text-[#6bde80] font-semibold">68.4%</span>
                </div>
              </div>

              {/* difficulty bar */}
              <div className="w-full h-3 bg-[#0d0d15] rounded-full overflow-hidden flex gap-0.5 mb-4">
                <div className="bg-[#6bde80] h-full rounded-l-full" style={{ width: "29.1%" }} title="120 Easy" />
                <div className="bg-[#ffb867] h-full" style={{ width: "54.3%" }} title="224 Medium" />
                <div className="bg-[#ffb4ab] h-full rounded-r-full" style={{ width: "16.5%" }} title="68 Hard" />
              </div>

              {/* difficulty breakdown */}
              <div className="grid grid-cols-3 gap-1.5 mb-6 text-center">
                {[
                  { label: "Easy", count: 120, total: 810, color: "text-[#6bde80]" },
                  { label: "Medium", count: 224, total: "1,650", color: "text-[#ffdcba]" },
                  { label: "Hard", count: 68, total: 640, color: "text-[#ffb4ab]" },
                ].map((d) => (
                  <div key={d.label} className="bg-[#1f1f27] p-2 rounded-lg">
                    <span className={`text-[10px] leading-[14px] font-[600] tracking-[0.06em] font-semibold uppercase block ${d.color}`}>{d.label}</span>
                    <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-bold">{d.count}</span>
                    <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a]">/ {d.total}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Strongest Paradigms</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { topic: "Dynamic Programming (91%)", color: "bg-[#6bde80]" },
                    { topic: "Graphs / BFS (88%)", color: "bg-[#6bde80]" },
                    { topic: "Trie Structures (84%)", color: "bg-[#e1dfff]" },
                  ].map((t) => (
                    <span key={t.topic} className="bg-[#292932] px-2 py-1 rounded text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#e4e1ed] flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.color}`} />
                      {t.topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between">
              <span className="text-[12px] leading-[18px] text-[#918f9a]">Knight Badge Eligible</span>
              <a href="#" className="text-[#e1dfff] text-[12px] leading-[18px] hover:underline flex items-center gap-1">
                Solve Daily Problem <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          </div>

          {/* interview widget */}
          <div className="bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-6 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#46464f]/30">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#c0c1ff]">psychology</span>
                  <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">Mock Interview Radar</span>
                </div>
                <span className="bg-[#34343d] px-1.5 py-0.5 rounded text-[10px] leading-[14px] font-[600] text-[#918f9a]">
                  Judge0 Engine
                </span>
              </div>

              {/* latest session */}
              <div className="bg-[#0d0d15]/80 rounded-xl p-3 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#e1dfff] font-bold tracking-wider">
                      Latest Session
                    </span>
                    <h2 className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold mt-0.5">Distributed Cache Design</h2>
                    <span className="text-[12px] leading-[18px] text-[#918f9a]">Yesterday at 18:40 UTC</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[18px] leading-[26px] font-[600] text-[#6bde80] font-bold">88%</span>
                    <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#6bde80] block font-semibold">Passed</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#46464f]/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#6bde80] text-sm">verified</span>
                    <span className="text-[12px] leading-[16px] font-[500] text-[#c7c5d0]">
                      Judge0 Tests: <strong className="text-[#e4e1ed]">12/12 Passed</strong>
                    </span>
                  </div>
                  <span className="text-[12px] leading-[18px] text-[#918f9a] font-mono">0.04ms execution</span>
                </div>
              </div>

              {/* past sessions */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a] mb-1">
                  Previous Telemetry Runs
                </span>
                {SESSIONS.map((s) => (
                  <div key={s.title} className="flex items-center justify-between p-2 rounded-lg bg-[#1f1f27] hover:bg-[#292932] transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
                      <span className="text-[12px] leading-[18px] text-[#e4e1ed] font-medium truncate">{s.title}</span>
                    </div>
                    <span className={`text-[12px] leading-[18px] font-semibold flex-shrink-0 ml-2 ${s.pass ? "text-[#6bde80]" : "text-[#ffb867]"}`}>
                      {s.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between">
              <span className="text-[12px] leading-[18px] text-[#918f9a]">Next: LRU Cache Variant</span>
              <a href="#" className="text-[#e1dfff] text-[12px] leading-[18px] hover:underline flex items-center gap-1">
                Start Session <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
