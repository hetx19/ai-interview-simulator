// github analytics and commit activity overview
export default function GitHubAnalyticsPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">
        {/* header */}
        <div className="relative overflow-hidden rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-2xl">
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80]" /> Live Webhook Sync
                  </span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-0.5 font-mono">
                  Profile Node: <span className="text-[#e1dfff] font-semibold">alex-mercer-dev</span> | SHA:{" "}
                  <span className="text-[#918f9a]">9fa4b2e8</span> | Indexing: Complete
                </p>
              </div>
            </div>

            {/* targets & actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="hidden xl:flex flex-col text-right pr-6 border-r border-[#46464f]/30">
                <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">Target Role</span>
                <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed]">L6 Distributed Systems</span>
              </div>
              <button
                type="button"
                className="flex-1 md:flex-initial px-3 py-2 rounded-lg bg-[#292932] hover:bg-[#393841] text-[#e4e1ed] text-[12px] leading-[18px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-sm text-[#e1dfff]">sync</span>
                <span>Force Re-index</span>
              </button>
              <button
                type="button"
                className="flex-1 md:flex-initial px-6 py-2 rounded-lg bg-[#c0c1ff] text-[#131449] text-[16px] leading-[24px] font-[600] hover:bg-[#e1dfff] transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)] active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">file_download</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* score card */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Benchmark Metric</span>
              <span className="flex items-center gap-1 text-[10px] leading-[14px] font-[600] text-[#6bde80] bg-[#6bde80]/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-xs">trending_up</span> +6% Q3
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">88</span>
                  <span className="text-[18px] leading-[26px] font-[600] text-[#918f9a]">/100</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium mt-1">Readiness Tier: Top 3%</p>
              </div>
              {/* ring meter */}
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#292932]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  <path className="text-[#e1dfff] transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="88, 100" strokeLinecap="round" strokeWidth="3.5" />
                </svg>
                <span className="absolute text-[10px] leading-[14px] font-[600] text-[#e1dfff]">88%</span>
              </div>
            </div>
            <div className="mt-2 pt-1 text-[#918f9a] text-[12px] leading-[18px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e1dfff]" />
              <span>Calibrated for Staff L6 Roles</span>
            </div>
          </div>

          {/* commits card */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Commit Velocity</span>
              <span className="material-symbols-outlined text-[#918f9a] text-lg">commit</span>
            </div>
            <div className="mt-3">
              <div className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">1,429</div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium mt-1">Commits Across 24 Repositories</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-[#292932] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#6bde80] h-full rounded-full" style={{ width: "78%" }} />
              </div>
              <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">3.9/day</span>
            </div>
          </div>

          {/* stars & forks */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Ecosystem Resonance</span>
              <span className="material-symbols-outlined text-[#ffb867] text-lg">hotel_class</span>
            </div>
            <div className="mt-3 flex items-baseline gap-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#ffb867] text-xl">⭐</span>
                  <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">348</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium">Stargazers</p>
              </div>
              <div className="w-px h-10 bg-[#46464f]/30 self-center" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#e1dfff] text-xl">⑂</span>
                  <span className="text-[48px] leading-[56px] font-bold text-[#e4e1ed] tracking-tight">82</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium">Network Forks</p>
              </div>
            </div>
            <div className="mt-2 text-[#918f9a] text-[12px] leading-[18px] flex items-center gap-1">
              <span className="text-[#6bde80] font-semibold">+14 new</span> this rolling 30-day cycle
            </div>
          </div>

          {/* repo health */}
          <div className="relative group rounded-xl bg-[#1b1b23]/85 backdrop-blur-xl p-6 shadow-xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#918f9a]">Pipeline Rigor</span>
              <span className="material-symbols-outlined text-[#6bde80] text-lg">verified_user</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[48px] leading-[56px] font-bold text-[#6bde80] tracking-tight">94%</span>
                <span className="text-[12px] leading-[18px] text-[#918f9a] font-mono">LINT &amp; CI/CD</span>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] font-medium mt-1">Documentation, Workflows &amp; Coverage</p>
            </div>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#292932] text-[#e4e1ed] text-[10px] leading-[14px] font-[600] font-mono">CI: 98%</span>
              <span className="px-2 py-0.5 rounded bg-[#292932] text-[#e4e1ed] text-[10px] leading-[14px] font-[600] font-mono">Docs: 91%</span>
              <span className="px-2 py-0.5 rounded bg-[#292932] text-[#e4e1ed] text-[10px] leading-[14px] font-[600] font-mono">Tests: 93%</span>
            </div>
          </div>
        </div>

        {/* contribution heatmap */}
        <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6bde80]">calendar_view_week</span>
                <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Full 52-Week Contribution Matrix</h2>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-0.5">
                Chronological daily telemetry density across private, public, and upstream repositories
              </p>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3 bg-[#0d0d15] px-3 py-1.5 rounded-lg shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">Current Streak</span>
                  <span className="text-[16px] leading-[24px] font-[500] font-bold text-[#6bde80]">42 Days 🔥</span>
                </div>
                <div className="w-px h-6 bg-[#46464f]/30" />
                <div className="flex flex-col">
                  <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">Longest Streak</span>
                  <span className="text-[16px] leading-[24px] font-[500] font-bold text-[#e1dfff]">119 Days</span>
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
                      {Array.from({ length: 52 }).map((_, cIndex) => {
                        // heatmap colors
                        const colors = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
                        return (
                          <g key={cIndex} transform={`translate(${cIndex * 16}, 0)`}>
                            {Array.from({ length: 7 }).map((_, rIndex) => {
                              // deterministic mock distribution
                              const hash = (cIndex * 7 + rIndex * 13 + 3) % 17;
                              let color = colors[3];
                              if (hash === 0 || hash === 1) color = colors[0];
                              else if (hash <= 3) color = colors[1];
                              else if (hash <= 7) color = colors[2];
                              else if (hash <= 12) color = colors[3];
                              else color = colors[4];

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
                                />
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
          <div className="lg:col-span-5 rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e1dfff]">pie_chart</span>
                  <h3 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Language Distribution</h3>
                </div>
                <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">1.2M Lines Tested</span>
              </div>
              <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-1">Multi-stack code generation split based on main repository payloads</p>

              {/* stacked progress bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#34343d] mt-6 shadow-inner">
                <div className="bg-[#3178c6] h-full" style={{ width: "48.5%" }} title="TypeScript 48.5%" />
                <div className="bg-[#dea584] h-full" style={{ width: "22.1%" }} title="Rust 22.1%" />
                <div className="bg-[#3572A5] h-full" style={{ width: "16.4%" }} title="Python 16.4%" />
                <div className="bg-[#00ADD8] h-full" style={{ width: "8.2%" }} title="Go 8.2%" />
                <div className="bg-[#918f9a] h-full" style={{ width: "4.8%" }} title="Other 4.8%" />
              </div>

              {/* language list */}
              <div className="space-y-2 mt-6">
                {[
                  { name: "TypeScript", color: "bg-[#3178c6]", tag: "Primary", tagStyle: "bg-[#c0c1ff]/20 text-[#e1dfff]", loc: "582k loc", pct: "48.5%" },
                  { name: "Rust", color: "bg-[#dea584]", tag: "Systems", tagStyle: "bg-[#6bde80]/15 text-[#6bde80]", loc: "265k loc", pct: "22.1%" },
                  { name: "Python", color: "bg-[#3572A5]", tag: "AI/ML", tagStyle: "bg-[#292932] text-[#c7c5d0]", loc: "196k loc", pct: "16.4%" },
                  { name: "Go", color: "bg-[#00ADD8]", loc: "98k loc", pct: "8.2%" },
                  { name: "Other", color: "bg-[#918f9a]", sub: "(SQL, Shell, C++)", loc: "57k loc", pct: "4.8%" },
                ].map((lang) => (
                  <div key={lang.name} className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d15] hover:bg-[#1f1f27] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${lang.color} shadow-sm`} />
                      <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-mono">{lang.name}</span>
                      {lang.tag && <span className={`px-2 py-0.5 rounded text-[10px] leading-[14px] font-[600] ${lang.tagStyle}`}>{lang.tag}</span>}
                      {lang.sub && <span className="text-[#918f9a] text-[10px] leading-[14px]">{lang.sub}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] leading-[18px] text-[#918f9a] font-mono">{lang.loc}</span>
                      <span className="text-[16px] leading-[24px] font-bold text-[#e4e1ed] font-mono">{lang.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-[#0d0d15]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e1dfff] text-base">psychology</span>
                <span className="text-[12px] leading-[18px] text-[#e4e1ed]">
                  Staff Competency Fit: <strong className="text-[#6bde80]">96.2% match</strong>
                </span>
              </div>
              <span className="material-symbols-outlined text-[#918f9a] text-sm">info</span>
            </div>
          </div>

          {/* recommendations feed */}
          <div className="lg:col-span-7 rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
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
                Synthesized algorithmic advice derived from FAANG hiring rubrics and repo telemetry
              </p>

              <div className="space-y-3">
                {/* alert: warning */}
                <div className="relative overflow-hidden rounded-xl bg-[#0d0d15] p-3 shadow-md transition-all hover:bg-[#292932] group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ffb867]" />
                  <div className="flex items-start gap-3 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#ffb867]/15 text-[#ffb867] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">warning</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] leading-[24px] font-[500] text-[#ffb867] font-semibold">Architecture Documentation Gap</span>
                        <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">PRIORITY: HIGH</span>
                      </div>
                      <p className="text-[14px] leading-[22px] text-[#e4e1ed] mt-1">
                        ⚠️ <strong>3 of your top repositories</strong> lack an architecture diagram in <code className="px-1.5 py-0.5 rounded bg-[#34343d] text-[#e1dfff] font-mono text-[12px]">README.md</code>.
                      </p>
                      <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-1">
                        Hiring managers at Tier-1 tech look for clear C4 system context diagrams. Generative SVG templates can be pushed via DevMetric CI action.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button className="px-3 py-1 rounded bg-[#ffb867] text-[#482900] text-[10px] leading-[14px] font-[600] hover:brightness-110 transition-all">
                          Generate Diagrams
                        </button>
                        <button className="px-2 py-1 rounded bg-[#34343d] text-[#918f9a] hover:text-[#e4e1ed] text-[10px] leading-[14px] font-mono">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* alert: growth */}
                <div className="relative overflow-hidden rounded-xl bg-[#0d0d15] p-3 shadow-md transition-all hover:bg-[#292932] group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#6bde80]" />
                  <div className="flex items-start gap-3 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#6bde80]/15 text-[#6bde80] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">lightbulb</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] leading-[24px] font-[500] text-[#6bde80] font-semibold">High-Signal Open Source Impact</span>
                        <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">+8 PTS SIGNAL</span>
                      </div>
                      <p className="text-[14px] leading-[22px] text-[#e4e1ed] mt-1">
                        💡 <strong>4 PR reviews</strong> in the Kubernetes ecosystem detected: boosts Open Source hiring signal by <strong className="text-[#6bde80]">+8 pts</strong>.
                      </p>
                      <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-1">
                        Review depth scored 92nd percentile for concurrency bug triage. Automatically indexed into your interview briefing packet.
                      </p>
                    </div>
                  </div>
                </div>

                {/* alert: info */}
                <div className="relative overflow-hidden rounded-xl bg-[#0d0d15] p-3 shadow-md transition-all hover:bg-[#292932] group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e1dfff]" />
                  <div className="flex items-start gap-3 pl-1">
                    <div className="w-9 h-9 rounded-lg bg-[#c0c1ff]/20 text-[#e1dfff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">bolt</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] leading-[24px] font-[500] text-[#e1dfff] font-semibold">Interview Narrative Leverage</span>
                        <span className="text-[10px] leading-[14px] font-[600] text-[#e1dfff] font-mono">TOP 5% CONSISTENCY</span>
                      </div>
                      <p className="text-[14px] leading-[22px] text-[#e4e1ed] mt-1">
                        ⚡ Commit consistency is <strong>top 5% on weekends</strong>: highlight DevOps discipline &amp; passion projects in mock interviews.
                      </p>
                      <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-1">
                        Synthesized 6 talking points focusing on self-driven distributed cache implementations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-[#918f9a] text-[10px] leading-[14px] font-[600]">
              <span>AI Model: DevMetric-Sonar-V3</span>
              <span>Last Evaluation: 14 mins ago</span>
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
              <p className="text-[12px] leading-[18px] text-[#c7c5d0]">Selected showcase engines with full static analysis and contribution vectors</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">SORT: IMPACT SCORE</span>
              <button className="p-1 rounded bg-[#292932] text-[#c7c5d0] hover:text-[#e4e1ed]">
                <span className="material-symbols-outlined text-base">filter_list</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* repo card 1 */}
            <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all group">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e1dfff] text-xl">source</span>
                    <span className="text-[16px] leading-[24px] font-bold text-[#e4e1ed] group-hover:text-[#e1dfff] transition-colors">hyper-mesh</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] leading-[14px] font-[600]">98.4 Health</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-2 line-clamp-2">
                  Distributed asynchronous service-mesh control plane built with ultra-low overhead eBPF kernel tracing and Raft consensus.
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">ebpf</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">raft</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">service-mesh</span>
                </div>
                <div className="mt-4 p-2 rounded-lg bg-[#0d0d15]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[12px] leading-[18px]">
                      <div className="flex items-center gap-1 text-[#e4e1ed]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#dea584]" />
                        <span className="font-mono text-[12px]">Rust</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#918f9a]">
                        <span>⭐</span> <span className="text-[#e4e1ed] font-semibold font-mono">214</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#918f9a]">
                        <span>⑂</span> <span className="text-[#e4e1ed] font-semibold font-mono">54</span>
                      </div>
                    </div>
                    <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">+18% wk</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full py-2 px-3 rounded-lg bg-[#292932] hover:bg-[#c0c1ff] hover:text-[#131449] text-[#e1dfff] text-[14px] leading-[22px] font-semibold transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg">
                <span>Analyze Repo</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>

            {/* repo card 2 */}
            <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all group">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e1dfff] text-xl">source</span>
                    <span className="text-[16px] leading-[24px] font-bold text-[#e4e1ed] group-hover:text-[#e1dfff] transition-colors">neural-stream-ts</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] leading-[14px] font-[600]">96.0 Health</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-2 line-clamp-2">
                  Streaming reactive client for LLM backends featuring token backpressure, automatic cancellation trees, and WebSockets failover.
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">typescript</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">llm-agents</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">websockets</span>
                </div>
                <div className="mt-4 p-2 rounded-lg bg-[#0d0d15]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[12px] leading-[18px]">
                      <div className="flex items-center gap-1 text-[#e4e1ed]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3178c6]" />
                        <span className="font-mono text-[12px]">TypeScript</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#918f9a]">
                        <span>⭐</span> <span className="text-[#e4e1ed] font-semibold font-mono">89</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#918f9a]">
                        <span>⑂</span> <span className="text-[#e4e1ed] font-semibold font-mono">19</span>
                      </div>
                    </div>
                    <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">+32% wk</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full py-2 px-3 rounded-lg bg-[#292932] hover:bg-[#c0c1ff] hover:text-[#131449] text-[#e1dfff] text-[14px] leading-[22px] font-semibold transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg">
                <span>Analyze Repo</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>

            {/* repo card 3 */}
            <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all group">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e1dfff] text-xl">source</span>
                    <span className="text-[16px] leading-[24px] font-bold text-[#e4e1ed] group-hover:text-[#e1dfff] transition-colors">raft-consensus-go</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] leading-[14px] font-[600]">92.1 Health</span>
                </div>
                <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-2 line-clamp-2">
                  Minimalist and verifiable implementation of the Raft distributed consensus protocol optimized for embedded systems.
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">golang</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] font-mono">distributed-systems</span>
                </div>
                <div className="mt-4 p-2 rounded-lg bg-[#0d0d15]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[12px] leading-[18px]">
                      <div className="flex items-center gap-1 text-[#e4e1ed]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00ADD8]" />
                        <span className="font-mono text-[12px]">Go</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#918f9a]">
                        <span>⭐</span> <span className="text-[#e4e1ed] font-semibold font-mono">45</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#918f9a]">
                        <span>⑂</span> <span className="text-[#e4e1ed] font-semibold font-mono">11</span>
                      </div>
                    </div>
                    <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">+12% wk</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full py-2 px-3 rounded-lg bg-[#292932] hover:bg-[#c0c1ff] hover:text-[#131449] text-[#e1dfff] text-[14px] leading-[22px] font-semibold transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg">
                <span>Analyze Repo</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
