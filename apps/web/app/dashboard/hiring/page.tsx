export default function HiringReadinessPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] leading-[14px] font-[600] text-[#e1dfff] uppercase tracking-widest">
                Target Benchmark
              </span>
              <span className="w-1 h-1 rounded-full bg-[#918f9a]" />
              <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] uppercase tracking-wider">
                FAANG / Top Tech Tier
              </span>
            </div>
            <h1 className="text-[32px] leading-[40px] font-[600] text-[#e4e1ed] tracking-tight">
              Hiring Readiness &amp; Roadmap
            </h1>
            <p className="text-[14px] leading-[22px] text-[#c7c5d0]">
              Multi-signal calibration across LeetCode, GitHub activity, resume ATS fit, and mock interview performance.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] font-semibold text-sm shadow-[0_0_20px_rgba(192,193,255,0.4)] transition-all self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>Share Verified Profile</span>
          </button>
        </div>

        {/* readiness score card */}
        <div className="relative overflow-hidden rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-8 border border-[#46464f]/30 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#0d0d15]/80 rounded-xl border border-[#46464f]/20">
              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase font-mono text-[#918f9a]">Readiness Index</span>
                <div className="text-[64px] font-bold text-[#e1dfff] leading-none font-sora">84<span className="text-2xl text-[#918f9a]">/100</span></div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>FAANG Ready Tier</span>
                </div>
                <p className="text-[12px] text-[#918f9a] pt-2">
                  Top 4% Candidate Benchmark for L6 Staff Systems Roles
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-[16px] font-semibold text-[#e4e1ed]">Target Company Readiness Fit</h3>
              <div className="space-y-3">
                {[
                  { company: "Google", fit: "88%", role: "L5/L6 Infrastructure", status: "Ready", color: "text-[#6bde80]" },
                  { company: "Meta", fit: "85%", role: "E5/E6 Production Engineering", status: "Ready", color: "text-[#6bde80]" },
                  { company: "Stripe", fit: "81%", role: "Staff Backend Platform", status: "Borderline", color: "text-[#ffdcba]" },
                  { company: "Netflix", fit: "79%", role: "Senior Distributed Systems", status: "Review", color: "text-[#ffb867]" },
                ].map((c) => (
                  <div key={c.company} className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d15] border border-[#46464f]/15">
                    <div>
                      <span className="text-[14px] font-semibold text-[#e4e1ed]">{c.company}</span>
                      <span className="text-[12px] text-[#918f9a] block">{c.role}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[16px] font-bold ${c.color}`}>{c.fit}</span>
                      <span className="text-[10px] block text-[#918f9a]">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4-week roadmap */}
        <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[#e4e1ed]">4-Week Strategic Sprint</h2>
            <span className="text-[10px] font-mono text-[#6bde80]">Automated Adaptive Plan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { week: "Week 1", title: "Concurrency & Locks", tasks: ["3 LC Hard Lock Problems", "Run 1 Voice Mock Interview", "Add Architecture Diagram"], active: true },
              { week: "Week 2", title: "Distributed Consensus", tasks: ["Review Raft Leader Election", "Refactor hyper-mesh README", "Simulate 45-min timed round"], active: false },
              { week: "Week 3", title: "System Design Invariants", tasks: ["Large scale rate-limiter design", "Apply 2 AI resume rewrites", "Review Kafka streaming patterns"], active: false },
              { week: "Week 4", title: "FAANG Calibration Run", tasks: ["Full 4-round mock loop", "Final portfolio audit", "Submit priority applications"], active: false },
            ].map((w) => (
              <div
                key={w.week}
                className={`p-4 rounded-xl border space-y-2 ${
                  w.active
                    ? "bg-[#1f1f27] border-[#c0c1ff]/40 shadow-[0_0_16px_rgba(192,193,255,0.15)]"
                    : "bg-[#0d0d15] border-[#46464f]/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#c0c1ff]">{w.week}</span>
                  {w.active && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#6bde80]/20 text-[#6bde80] font-bold">In Progress</span>}
                </div>
                <h3 className="text-[14px] font-semibold text-[#e4e1ed]">{w.title}</h3>
                <ul className="space-y-1 text-[12px] text-[#c7c5d0]">
                  {w.tasks.map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-[#6bde80]">check</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
