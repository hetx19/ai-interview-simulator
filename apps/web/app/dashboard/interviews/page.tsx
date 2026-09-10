import Link from "next/link";

const SESSIONS = [
  {
    id: "session_1",
    title: "LC 146: LRU Cache Implementation",
    category: "Systems & Concurrency Invariant Design",
    difficulty: "Medium / Hard",
    score: 91,
    status: "Completed",
    date: "Yesterday at 18:40 UTC",
    tags: ["Hash Table", "Doubly-Linked List", "Design"],
  },
  {
    id: "session_2",
    title: "Concurrent Rate Limiter (Token Bucket)",
    category: "Distributed Systems & Networking",
    difficulty: "Hard",
    score: 94,
    status: "Completed",
    date: "3 days ago",
    tags: ["Concurrency", "Rate Limiting", "Go"],
  },
  {
    id: "session_3",
    title: "Consensus Algorithm (Raft Leader Election)",
    category: "Fault Tolerant Distributed Systems",
    difficulty: "Hard",
    score: 71,
    status: "Review Required",
    date: "1 week ago",
    tags: ["Raft", "State Machine", "RPC"],
  },
];

export default function MockInterviewsIndexPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-8">

        {/* Mobile Guard: Mock Interview is Desktop/Laptop-Only */}
        <div className="block lg:hidden">
          <div className="rounded-xl bg-[#1b1b23]/95 border border-[#46464f]/30 p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#c0c1ff]/15 border border-[#c0c1ff]/30 flex items-center justify-center text-[#c0c1ff]">
              <span className="material-symbols-outlined text-3xl">laptop_mac</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono text-[#c0c1ff]">
                Desktop Display Required
              </span>
              <h2 className="text-xl font-semibold text-[#e4e1ed] font-sora">
                AI Mock Interview Workspace
              </h2>
              <p className="text-sm text-[#c7c5d0] max-w-sm leading-relaxed">
                The technical mock interview environment, Monaco IDE, and real-time audio evaluator are designed exclusively for desktop and laptop displays (1024px+).
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] text-sm font-semibold transition-all shadow-[0_0_16px_rgba(192,193,255,0.25)]"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Desktop Interface */}
        <div className="hidden lg:block space-y-8">
          {/* header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[28px] leading-9 font-semibold text-[#e4e1ed] font-sora">
                AI Mock Interviews
              </h1>
              <p className="text-[14px] leading-5 text-[#c7c5d0] mt-1">
                Real-time voice telemetry, Monaco editor, and live AST analysis against FAANG rubrics.
              </p>
            </div>
            <Link
              href="/dashboard/interviews/1"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c0c1ff] text-[#1b1b23] font-semibold text-[14px] leading-5 hover:bg-[#d5d5ff] transition-colors shadow-[0_0_20px_rgba(192,193,255,0.3)]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New Session
            </Link>
          </div>

        {/* active round */}
        <div className="bg-[#1f1f27]/80 rounded-2xl p-6 border border-[#46464f]/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#c0c1ff]/15 flex items-center justify-center text-[#c0c1ff] flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">mic</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#6bde80] bg-[#6bde80]/15 px-2 py-0.5 rounded-full">
                  Recommended Next
                </span>
                <span className="text-[12px] leading-4 text-[#918f9a]">Round 3 of 5</span>
              </div>
              <h2 className="text-[18px] leading-6 font-semibold text-[#e4e1ed] mt-1 font-sora">
                Distributed Rate Limiter Design & Implementation
              </h2>
              <p className="text-[13px] leading-5 text-[#918f9a] mt-1">
                45-minute live technical session with AI Interviewer Dr. Aris Thorne. Evaluates concurrency, Redis atomicity, and sliding window algorithms.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/interviews/1"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6bde80] text-[#0d1f11] font-semibold text-[14px] leading-5 hover:bg-[#86efac] transition-colors flex-shrink-0 shadow-[0_0_20px_rgba(107,222,128,0.25)]"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Start Session
          </Link>
        </div>

        {/* session history */}
        <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl border border-[#46464f]/30 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#46464f]/20 flex items-center justify-between">
            <h3 className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">
              Evaluation History
            </h3>
            <span className="text-[10px] leading-[14px] text-[#918f9a] font-mono">
              3 Sessions Completed
            </span>
          </div>

          <div className="divide-y divide-[#46464f]/20">
            {SESSIONS.map((s) => (
              <div
                key={s.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1f1f27] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] leading-[22px] font-semibold text-[#e4e1ed]">{s.title}</span>
                    <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] font-mono">
                      {s.difficulty}
                    </span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#918f9a]">{s.category} • {s.date}</p>
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {s.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-[#0d0d15] text-[#918f9a] text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <span className="text-[20px] leading-[28px] font-bold text-[#6bde80]">{s.score}%</span>
                    <span className="text-[10px] block text-[#918f9a]">Staff Grade</span>
                  </div>

                  <Link
                    href={`/dashboard/interviews/${s.id}`}
                    className="p-2 rounded-lg bg-[#292932] hover:bg-[#34343d] text-[#e1dfff] transition-colors"
                    title="Open Workspace"
                  >
                    <span className="material-symbols-outlined text-base">launch</span>
                  </Link>
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
