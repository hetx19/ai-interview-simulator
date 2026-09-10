"use client";

import { useState } from "react";

export default function ResumeScannerPage() {
  const [activeTab, setActiveTab] = useState<"rewriter" | "keywords">("rewriter");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appliedBullets, setAppliedBullets] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast("Copied optimized bullet to clipboard!");
  };

  const handleApplyRevision = (key: string) => {
    setAppliedBullets((prev) => ({ ...prev, [key]: true }));
    showToast("Applied revision to active profile!");
    setTimeout(() => {
      setAppliedBullets((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6 sm:space-y-8">

        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] leading-[14px] font-[600] text-[#e1dfff] uppercase tracking-widest">
                Diagnostic Pipeline
              </span>
              <span className="w-1 h-1 rounded-full bg-[#918f9a]" />
              <span className="inline-flex items-center gap-1 text-[10px] leading-[14px] font-[600] text-[#6bde80] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80] animate-pulse" />
                Semantic Parse 3.8
              </span>
            </div>
            <h1 className="text-[24px] sm:text-[32px] leading-[32px] sm:leading-[40px] font-[600] text-[#e4e1ed] tracking-tight">
              Resume Scanner &amp; ATS Intelligence
            </h1>
            <p className="text-[12px] sm:text-[14px] leading-[18px] sm:leading-[22px] text-[#c7c5d0] max-w-2xl">
              Deep structural ATS tokenization, semantic relevance scoring, and automated metric-driven phrase optimization calibrated for FAANG &amp; tier-1 infrastructure roles.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => showToast("Exporting audit PDF report...")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#292932] hover:bg-[#34343d] text-[#e4e1ed] transition-all text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-[500] shadow-md"
            >
              <span className="material-symbols-outlined text-[#e1dfff] text-base">download</span>
              <span>Export Audit PDF</span>
            </button>
            <button
              type="button"
              onClick={() => showToast("Fresh audit initiated...")}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] transition-all text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-[500] shadow-[0_0_20px_rgba(192,193,255,0.35)] active:scale-95 font-semibold"
            >
              <span className="material-symbols-outlined text-base">sync</span>
              <span>Run Fresh Audit</span>
            </button>
          </div>
        </div>

        {/* upload dropzone / current file card */}
        <div className="relative overflow-hidden rounded-xl bg-[#1b1b23] backdrop-blur-xl p-4 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#e1dfff]/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#0d0d15] flex items-center justify-center text-[#e1dfff] shadow-[0_0_16px_rgba(192,193,255,0.15)] shrink-0">
                <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
              </div>
              <div className="flex flex-col space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] sm:text-[16px] leading-[22px] sm:leading-[24px] font-[500] text-[#e4e1ed] font-semibold truncate">
                    Senior_Software_Engineer_Resume_2025.pdf
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#34343d] text-[#c7c5d0] text-[10px] leading-[14px] font-[600]">
                    324 KB
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[12px] leading-[18px]">
                  <div className="flex items-center gap-1.5 text-[#6bde80]">
                    <span className="w-2 h-2 rounded-full bg-[#6bde80] shadow-[0_0_8px_rgba(107,222,128,0.7)]" />
                    <span className="font-medium">Scanned 2m ago</span>
                  </div>
                  <span className="text-[#918f9a]">•</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#292932] text-[#e1dfff] text-[10px] font-semibold">
                    <span className="material-symbols-outlined text-[12px]">track_changes</span>
                    Target: Staff Backend
                  </span>
                </div>
              </div>
            </div>

            {/* mobile actions (2 cols) */}
            <div className="grid grid-cols-2 gap-2 w-full md:hidden pt-2 border-t border-[#34343d]/50">
              <label className="cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg bg-[#292932] hover:bg-[#34343d] text-[#e4e1ed] text-[13px] font-medium transition-colors active:scale-95">
                <span className="material-symbols-outlined text-[18px] text-[#e1dfff]">upload_file</span>
                <span>Upload New</span>
                <input accept=".pdf,.docx" className="hidden" type="file" />
              </label>
              <button
                type="button"
                onClick={() => showToast("Exporting PDF audit report...")}
                className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg bg-[#292932] hover:bg-[#34343d] text-[#e4e1ed] text-[13px] font-medium transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#6bde80]">download</span>
                <span>Export PDF</span>
              </button>
            </div>

            {/* desktop actions */}
            <div className="hidden md:flex items-center gap-2 w-full md:w-auto">
              <label className="cursor-pointer w-full md:w-auto flex items-center justify-center gap-1.5 px-6 py-2 rounded-lg bg-[#292932] hover:bg-[#393841] text-[#e1dfff] transition-all text-[16px] leading-[24px] font-[500] shadow-sm">
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                <span>Upload Updated Version</span>
                <input accept=".pdf,.docx" className="hidden" type="file" />
              </label>
              <button
                type="button"
                className="p-2 rounded-lg bg-[#1f1f27] hover:bg-[#292932] text-[#c7c5d0] transition-colors"
                title="Parse Raw JSON"
              >
                <span className="material-symbols-outlined text-lg">data_object</span>
              </button>
            </div>
          </div>
        </div>

        {/* parser metrics section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] sm:text-[18px] leading-[24px] sm:leading-[26px] font-[600] text-[#e4e1ed]">Parser Metrics</h2>
            <span className="text-[12px] font-semibold text-[#6bde80] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              Top 4% Cohort
            </span>
          </div>

          {/* ats score breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* overall composite rating hero */}
            <div className="sm:col-span-2 lg:col-span-1 rounded-xl bg-[#1b1b23] p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#e1dfff]/10 via-transparent to-transparent opacity-60" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] leading-[14px] font-[600] text-[#c7c5d0] uppercase tracking-wider">Composite Rating</span>
                <span className="px-2 py-0.5 rounded-full bg-[#e1dfff]/20 text-[#e1dfff] text-[10px] leading-[14px] font-[600]">Primary</span>
              </div>
              <div className="relative z-10 my-2 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-[44px] sm:text-[48px] font-[600] text-[#e1dfff] leading-none tracking-tight">81</span>
                  <span className="text-[16px] leading-[24px] text-[#918f9a]">/100</span>
                </div>
                {/* circular ring SVG */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 64 64">
                    <circle className="text-[#1f1f27]" cx="32" cy="32" fill="none" r="26" stroke="currentColor" strokeWidth="5" />
                    <circle
                      className="text-[#c0c1ff]"
                      cx="32" cy="32" fill="none" r="26"
                      stroke="currentColor" strokeWidth="5"
                      strokeDasharray="163.36" strokeDashoffset="31.03"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="material-symbols-outlined text-[18px] text-[#e1dfff] absolute">verified</span>
                </div>
              </div>
              <div className="relative z-10 flex flex-col space-y-1">
                <div className="flex items-center gap-1.5 text-[#6bde80]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80]" />
                  <span className="text-[12px] leading-[18px] font-semibold">Strong FAANG Match</span>
                </div>
                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#e1dfff] h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(192,193,255,0.6)]" style={{ width: "81%" }} />
                </div>
              </div>
            </div>

            {/* 2x2 grid on mobile / columns on desktop */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* ats compatibility */}
              <div className="rounded-xl bg-[#1b1b23] p-3.5 flex flex-col justify-between shadow-md group hover:bg-[#1f1f27] transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-[#1f1f27] flex items-center justify-center text-[#6bde80]">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#6bde80]">+6%</span>
                </div>
                <div className="my-2">
                  <span className="text-[28px] sm:text-[32px] font-[600] text-[#6bde80] leading-none">94%</span>
                  <span className="text-[11px] text-[#c7c5d0] block mt-0.5">ATS Compatibility</span>
                </div>
                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#6bde80] h-full rounded-full" style={{ width: "94%" }} />
                </div>
              </div>

              {/* format & structure */}
              <div className="rounded-xl bg-[#1b1b23] p-3.5 flex flex-col justify-between shadow-md group hover:bg-[#1f1f27] transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-[#1f1f27] flex items-center justify-center text-[#c0c1ff]">
                    <span className="material-symbols-outlined text-[16px]">view_quilt</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#c0c1ff]">Optimal</span>
                </div>
                <div className="my-2">
                  <span className="text-[28px] sm:text-[32px] font-[600] text-[#e4e1ed] leading-none">89%</span>
                  <span className="text-[11px] text-[#c7c5d0] block mt-0.5">Format &amp; Structure</span>
                </div>
                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#c0c1ff] h-full rounded-full" style={{ width: "89%" }} />
                </div>
              </div>

              {/* keyword density */}
              <div className="rounded-xl bg-[#1b1b23] p-3.5 flex flex-col justify-between shadow-md group hover:bg-[#1f1f27] transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-[#1f1f27] flex items-center justify-center text-[#ffb867]">
                    <span className="material-symbols-outlined text-[16px]">key</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#ffdcba]">Mid</span>
                </div>
                <div className="my-2">
                  <span className="text-[28px] sm:text-[32px] font-[600] text-[#ffb867] leading-none">74%</span>
                  <span className="text-[11px] text-[#c7c5d0] block mt-0.5">Keyword Density</span>
                </div>
                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ffb867] h-full rounded-full" style={{ width: "74%" }} />
                </div>
              </div>

              {/* quantified impact */}
              <div className="rounded-xl bg-[#1b1b23] p-3.5 flex flex-col justify-between shadow-md group hover:bg-[#1f1f27] transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-[#1f1f27] flex items-center justify-center text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[16px]">query_stats</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#ffb4ab]">Low</span>
                </div>
                <div className="my-2">
                  <span className="text-[28px] sm:text-[32px] font-[600] text-[#ffb4ab] leading-none">68%</span>
                  <span className="text-[11px] text-[#c7c5d0] block mt-0.5">Quantified Impact</span>
                </div>
                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ffb4ab] h-full rounded-full" style={{ width: "68%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* tabbed rewriter & keywords */}
        <div className="flex flex-col rounded-xl bg-[#1b1b23] shadow-xl overflow-hidden">
          {/* tab header */}
          <div className="px-6 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1b1b23]">
            <div className="flex items-center gap-1 bg-[#0d0d15]/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("rewriter")}
                className={`px-6 py-1 rounded-lg text-[16px] leading-[24px] font-[500] transition-all flex items-center gap-1.5 ${
                  activeTab === "rewriter"
                    ? "bg-[#292932] text-[#e1dfff] shadow-[0_0_16px_rgba(192,193,255,0.18)]"
                    : "text-[#c7c5d0] hover:text-[#e4e1ed]"
                }`}
              >
                <span className="material-symbols-outlined text-base">auto_fix_high</span>
                <span>AI Bullet Point Rewriter</span>
                <span className="px-1 py-0.5 text-[10px] rounded-full bg-[#c0c1ff]/20 text-[#e1dfff] font-bold">2 Ready</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("keywords")}
                className={`px-6 py-1 rounded-lg text-[16px] leading-[24px] font-[500] transition-all flex items-center gap-1.5 ${
                  activeTab === "keywords"
                    ? "bg-[#292932] text-[#e1dfff] shadow-[0_0_16px_rgba(192,193,255,0.18)]"
                    : "text-[#c7c5d0] hover:text-[#e4e1ed]"
                }`}
              >
                <span className="material-symbols-outlined text-base">label_important</span>
                <span>Missing Keywords Scanner</span>
                <span className="px-1 py-0.5 text-[10px] rounded-full bg-[#1f1f27] text-[#918f9a]">4 Missing</span>
              </button>
            </div>
            <div className="flex items-center gap-3 text-[12px] leading-[18px] text-[#c7c5d0]">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#6bde80] text-sm">bolt</span>
                <span>LLM Synthesis: Google Gemini 1.5 Pro</span>
              </div>
              <span className="hidden md:inline text-[#918f9a]">|</span>
              <span className="hidden md:inline text-[#918f9a]">Latency: 184ms</span>
            </div>
          </div>

          {/* rewriter tab */}
          {activeTab === "rewriter" && (
            <div className="p-6 flex flex-col space-y-6">
              <div className="p-3 rounded-xl bg-[#0d0d15]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e1dfff] text-xl">psychology</span>
                  <p className="text-[12px] leading-[18px] text-[#e4e1ed]">
                    Our neural rewrite engine applied the <strong className="text-[#e1dfff] font-semibold">Google X-Y-Z formula</strong> (Accomplished [X] measured by [Y], by doing [Z]) to amplify quantified impact.
                  </p>
                </div>
                <span className="text-[10px] leading-[14px] font-[600] uppercase tracking-wider text-[#6bde80] px-3 py-1 rounded bg-[#6bde80]/10 whitespace-nowrap">
                  Impact Boost: +22 Pts
                </span>
              </div>

              {/* comparison 1 */}
              <div className="rounded-xl bg-[#1f1f27] overflow-hidden shadow-md">
                <div className="px-6 py-2 bg-[#292932] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] leading-[14px] font-[600] uppercase text-[#918f9a]">Work History Bullet 01</span>
                    <span className="text-[#918f9a]">•</span>
                    <span className="text-[12px] leading-[18px] font-semibold text-[#e4e1ed]">Checkout &amp; Payment Gateway Cluster</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] text-[10px] leading-[14px] font-[600]">Weak Impact</span>
                    <span className="material-symbols-outlined text-sm text-[#918f9a]">arrow_forward</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] leading-[14px] font-[600]">Staff Quality</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 divide-[#34343d]">
                  {/* original bullet */}
                  <div className="p-6 flex flex-col justify-between space-y-3 bg-[#0d0d15]/40">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] leading-[14px] font-[600] tracking-widest text-[#918f9a] uppercase">Original Expression</span>
                        <span className="text-[12px] leading-[18px] text-[#ffb4ab] font-mono">Impact Score: 38/100</span>
                      </div>
                      <blockquote className="text-[14px] leading-[22px] text-[#c7c5d0] font-mono bg-[#0d0d15] p-3 rounded-lg">
                        &quot;Built API endpoints for order processing&quot;
                      </blockquote>
                      <p className="text-[12px] leading-[18px] text-[#918f9a] mt-2">
                        Flaw: Lacks architectural depth, throughput scale, protocol specifics, and measured SLA latency metrics.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#918f9a] text-[12px] leading-[18px]">
                      <span className="material-symbols-outlined text-sm">error_outline</span>
                      <span>Passive voice detected</span>
                    </div>
                  </div>

                  {/* rewritten bullet */}
                  <div className="p-6 flex flex-col justify-between space-y-3 bg-[#1f1f27]/60 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#6bde80]/5 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] leading-[14px] font-[600] tracking-widest text-[#e1dfff] uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          AI Optimized (Google X-Y-Z)
                        </span>
                        <span className="text-[12px] leading-[18px] text-[#6bde80] font-mono font-semibold">Impact Score: 96/100</span>
                      </div>
                      <div className="text-[14px] leading-[22px] text-[#e4e1ed] bg-[#0d0d15] p-3 rounded-lg shadow-inner">
                        &quot;Architected high-throughput <mark className="bg-[#e1dfff]/20 text-[#e1dfff] rounded px-1 py-0.5">gRPC microservice</mark> handling <mark className="bg-[#6bde80]/20 text-[#6bde80] font-semibold rounded px-1 py-0.5">45K req/sec</mark> with <mark className="bg-[#6bde80]/20 text-[#6bde80] font-semibold rounded px-1 py-0.5">p99 latency &lt;18ms</mark> across distributed regional clusters.&quot;
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] leading-[14px] px-2 py-0.5 rounded bg-[#34343d] text-[#c7c5d0]">Throughput metrics</span>
                        <span className="text-[10px] leading-[14px] px-2 py-0.5 rounded bg-[#34343d] text-[#c7c5d0]">Latency bound</span>
                        <span className="text-[10px] leading-[14px] px-2 py-0.5 rounded bg-[#34343d] text-[#c7c5d0]">RPC protocol</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard("Architected high-throughput gRPC microservice handling 45K req/sec with p99 latency <18ms across distributed regional clusters.")}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#34343d] hover:bg-[#393841] text-[#e4e1ed] transition-colors text-[12px] leading-[18px]"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                        <span>Copy to Clipboard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyRevision("b1")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all active:scale-95 shadow-md ${
                          appliedBullets["b1"]
                            ? "bg-[#6bde80] text-[#003913]"
                            : "bg-[#c0c1ff] text-[#292b5e] hover:bg-[#e1dfff] shadow-[0_0_12px_rgba(192,193,255,0.3)]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {appliedBullets["b1"] ? "done" : "auto_fix_high"}
                        </span>
                        <span>{appliedBullets["b1"] ? "Applied" : "Apply Revision"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* comparison 2 */}
              <div className="rounded-xl bg-[#1f1f27] overflow-hidden shadow-md">
                <div className="px-6 py-2 bg-[#292932] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] leading-[14px] font-[600] uppercase text-[#918f9a]">Work History Bullet 02</span>
                    <span className="text-[#918f9a]">•</span>
                    <span className="text-[12px] leading-[18px] font-semibold text-[#e4e1ed]">Data Ingestion &amp; Tier-2 Database Infrastructure</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] text-[10px] leading-[14px] font-[600]">Vague Metric</span>
                    <span className="material-symbols-outlined text-sm text-[#918f9a]">arrow_forward</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] leading-[14px] font-[600]">Quantified +42%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 divide-[#34343d]">
                  {/* original bullet */}
                  <div className="p-6 flex flex-col justify-between space-y-3 bg-[#0d0d15]/40">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] leading-[14px] font-[600] tracking-widest text-[#918f9a] uppercase">Original Expression</span>
                        <span className="text-[12px] leading-[18px] text-[#ffb4ab] font-mono">Impact Score: 41/100</span>
                      </div>
                      <blockquote className="text-[14px] leading-[22px] text-[#c7c5d0] font-mono bg-[#0d0d15] p-3 rounded-lg">
                        &quot;Optimized database queries to make it faster&quot;
                      </blockquote>
                      <p className="text-[12px] leading-[18px] text-[#918f9a] mt-2">
                        Flaw: Qualitative claim without empirical benchmarking, resource utilization data, or explicit tooling.
                      </p>
                    </div>
                  </div>

                  {/* rewritten bullet */}
                  <div className="p-6 flex flex-col justify-between space-y-3 bg-[#1f1f27]/60">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] leading-[14px] font-[600] tracking-widest text-[#e1dfff] uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          AI Optimized (Google X-Y-Z)
                        </span>
                        <span className="text-[12px] leading-[18px] text-[#6bde80] font-mono font-semibold">Impact Score: 94/100</span>
                      </div>
                      <div className="text-[14px] leading-[22px] text-[#e4e1ed] bg-[#0d0d15] p-3 rounded-lg shadow-inner">
                        &quot;Refactored PostgreSQL indexing strategies and query execution plans, <mark className="bg-[#6bde80]/20 text-[#6bde80] font-semibold rounded px-1 py-0.5">reducing CPU load by 42%</mark> and accelerating batch ingestion by <mark className="bg-[#6bde80]/20 text-[#6bde80] font-semibold rounded px-1 py-0.5">3.5x</mark> across 12M daily rows.&quot;
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard("Refactored PostgreSQL indexing strategies and query execution plans, reducing CPU load by 42% and accelerating batch ingestion by 3.5x across 12M daily rows.")}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#34343d] hover:bg-[#393841] text-[#e4e1ed] transition-colors text-[12px] leading-[18px]"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                        <span>Copy to Clipboard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyRevision("b2")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all active:scale-95 shadow-md ${
                          appliedBullets["b2"]
                            ? "bg-[#6bde80] text-[#003913]"
                            : "bg-[#c0c1ff] text-[#292b5e] hover:bg-[#e1dfff] shadow-[0_0_12px_rgba(192,193,255,0.3)]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {appliedBullets["b2"] ? "done" : "auto_fix_high"}
                        </span>
                        <span>{appliedBullets["b2"] ? "Applied" : "Apply Revision"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* keywords tab */}
          {activeTab === "keywords" && (
            <div className="p-6 flex flex-col space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* found keywords */}
                <div className="flex flex-col rounded-xl bg-[#1f1f27] p-6 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6bde80] shadow-[0_0_8px_rgba(107,222,128,0.7)]" />
                      <span className="text-[16px] leading-[24px] font-[500] text-[#6bde80] font-semibold">Found ATS Keywords</span>
                    </div>
                    <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] bg-[#6bde80]/10 px-3 py-0.5 rounded-full">8 Detected</span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#c7c5d0]">
                    These tokens are accurately indexed by parsers like Greenhouse, Lever, and Workday without encoding conflicts.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      "Distributed Systems", "Go / Golang", "PostgreSQL", "Redis",
                      "Docker", "Kubernetes", "gRPC", "Microservices",
                    ].map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6bde80]/10 text-[#6bde80] text-[12px] leading-[18px] font-medium shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">check</span> {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* missing keywords */}
                <div className="flex flex-col rounded-xl bg-[#1f1f27] p-6 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab] shadow-[0_0_8px_rgba(255,180,171,0.7)]" />
                      <span className="text-[16px] leading-[24px] font-[500] text-[#ffb4ab] font-semibold">Missing Critical Keywords</span>
                    </div>
                    <span className="text-[10px] leading-[14px] font-[600] text-[#ffb4ab] bg-[#ffb4ab]/10 px-3 py-0.5 rounded-full">High ATS Penalty</span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#c7c5d0]">
                    Omitting these terms deprioritizes your candidate file for Senior/Staff distributed systems requisitions.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      "Apache Kafka", "System Design & Scalability", "Event-Driven Architecture", "Prometheus / Grafana",
                    ].map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => showToast(`Added suggestion: ${kw}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] text-[12px] leading-[18px] font-medium hover:bg-[#ffb4ab]/25 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span> {kw}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 p-3 rounded-lg bg-[#0d0d15] flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#e1dfff] text-lg shrink-0">tips_and_updates</span>
                    <div className="flex flex-col space-y-1 text-[12px] leading-[18px]">
                      <span className="text-[#e4e1ed] font-semibold">Recommended Insertion Placement</span>
                      <span className="text-[#c7c5d0]">
                        Integrate <strong>&quot;Event-Driven Architecture&quot;</strong> and <strong>&quot;Apache Kafka&quot;</strong> under your current position&apos;s async message pipeline project bullet to immediately gain +8 keyword points.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* token frequency preview */}
              <div className="p-6 rounded-xl bg-[#1f1f27] flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed]">Target Competency Saturation</span>
                  <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">Benchmark: Meta / Datadog / Stripe Tier</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { label: "Distributed Systems", score: "88%", color: "bg-[#6bde80]", text: "text-[#6bde80]" },
                    { label: "Database Internals", score: "76%", color: "bg-[#e1dfff]", text: "text-[#e1dfff]" },
                    { label: "Observability & APM", score: "42%", color: "bg-[#ffb4ab]", text: "text-[#ffb4ab]" },
                    { label: "System Architecture", score: "58%", color: "bg-[#ffb867]", text: "text-[#ffb867]" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col space-y-1 p-3 rounded-lg bg-[#0d0d15]">
                      <span className="text-[10px] leading-[14px] font-[600] text-[#c7c5d0]">{item.label}</span>
                      <span className={`text-[18px] leading-[26px] font-[600] ${item.text}`}>{item.score}</span>
                      <div className="w-full bg-[#292932] h-1 rounded-full">
                        <div className={`${item.color} h-full rounded-full`} style={{ width: item.score }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#292932] text-[#e4e1ed] shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-[#46464f]/40">
            <span className="w-2 h-2 rounded-full bg-[#6bde80] shadow-[0_0_10px_rgba(107,222,128,0.8)]" />
            <span className="text-[12px] leading-[18px] font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
