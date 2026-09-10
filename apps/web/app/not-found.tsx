"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ProbeStep {
  pct: number;
  msg: string;
  isSuccess?: boolean;
}

const PROBE_STEPS: ProbeStep[] = [
  { pct: 25, msg: "> Core mesh gateway: OK (12ms latency, cipher ChaCha20-Poly1305)" },
  { pct: 60, msg: "> Edge API routing tables: Verified 42/42 cluster replicas active" },
  { pct: 85, msg: "> Node resolution: Target route /node_404 is unmapped or decommissioned" },
  { pct: 100, msg: "> Result: Cluster operating nominal. Recommendation: Redirect to /dashboard.", isSuccess: true },
];

export default function NotFound() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [logs, setLogs] = useState<ProbeStep[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef<NodeJS.Timeout | null>(null);

  const startDiagnostics = () => {
    if (isRunning) return;
    setIsRunning(true);
    setHasRun(true);
    setProgress(0);
    setElapsedMs(0);
    setLogs([]);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    let stepIndex = 0;
    stepRef.current = setInterval(() => {
      if (stepIndex < PROBE_STEPS.length) {
        const step = PROBE_STEPS[stepIndex];
        setProgress(step.pct);
        setLogs((prev) => [...prev, step]);
        stepIndex++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        if (stepRef.current) clearInterval(stepRef.current);
        setIsRunning(false);
      }
    }, 550);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepRef.current) clearInterval(stepRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] font-sans relative flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Subtle Ambient Glows */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-b from-[#c0c1ff]/10 via-[#c0c1ff]/5 to-transparent blur-3xl pointer-events-none rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-12 right-12 w-80 h-80 bg-[#ffb4ab]/5 blur-3xl pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center my-auto">
        {/* Top System Telemetry Micro-Bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-[#1b1b23] border border-[#46464f]/30 px-3.5 py-1.5 rounded-full shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping" />
            <span className="text-[10px] leading-[14px] font-semibold text-[#ffb4ab] uppercase tracking-widest font-mono">
              ERR_L7_ROUTE_UNRESOLVED
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-[#1b1b23] border border-[#46464f]/30 px-3.5 py-1.5 rounded-full shadow-md">
            <span className="text-[10px] leading-[14px] text-[#918f9a]">SESSION ID:</span>
            <span className="text-[10px] leading-[14px] text-[#c7c5d0] font-mono">
              0x9F41::DM-PROD-US-EAST
            </span>
          </div>
        </div>

        {/* Main Diagnostic Cyber Terminal Card */}
        <div className="w-full bg-[#1b1b23]/95 backdrop-blur-xl border border-[#46464f]/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Terminal Header Bar */}
          <div className="bg-[#1f1f27] px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#46464f]/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ffb4ab]" />
                <span className="w-3 h-3 rounded-full bg-[#ffb867]" />
                <span className="w-3 h-3 rounded-full bg-[#6bde80]" />
              </div>
              <div className="flex items-center gap-1.5 pl-1.5">
                <span className="material-symbols-outlined text-[#918f9a] text-sm">terminal</span>
                <span className="text-[11px] leading-4 text-[#c7c5d0] font-mono truncate max-w-[200px] sm:max-w-none">
                  telemetry_kernel_panic.err // STACK_TRACE_NULL
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#292932] px-2 py-0.5 rounded text-[#918f9a] text-[10px] font-mono">
                CODE: 404_NOT_FOUND
              </span>
              <span className="bg-[#6bde80]/10 text-[#6bde80] px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#6bde80]" /> 0.00% DROP
              </span>
            </div>
          </div>

          {/* Terminal Body Content */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col items-center text-center">
            {/* Diagnostic Metric Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-semibold tracking-wide font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" /> NODE DISCONNECTED
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb867]/15 text-[#ffb867] text-[10px] font-semibold tracking-wide font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb867]" /> INGRESS RE-ROUTED
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c0c1ff]/20 text-[#e1dfff] text-[10px] font-semibold tracking-wide font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]" /> CLUSTER MATRIX 42/42
              </span>
            </div>

            {/* Giant Glitched 404 Display */}
            <div className="relative my-2 select-none" aria-label="404 Error">
              <div className="absolute inset-0 flex items-center justify-center -translate-x-1 translate-y-0.5 opacity-20 text-[#ffb4ab] text-6xl sm:text-[96px] font-bold tracking-tighter filter blur-[1px] font-sora">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center translate-x-1 -translate-y-0.5 opacity-20 text-[#6bde80] text-6xl sm:text-[96px] font-bold tracking-tighter font-sora">
                404
              </div>
              <h1 className="relative text-6xl sm:text-[96px] sm:leading-none font-bold text-[#e1dfff] tracking-tighter drop-shadow-[0_0_24px_rgba(192,193,255,0.4)] font-sora">
                404
              </h1>
            </div>

            {/* Heading Hierarchy */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#e4e1ed] mt-4 mb-2 max-w-xl font-sora">
              Telemetry Node Not Found in Cluster
            </h2>
            <p className="text-sm sm:text-base text-[#c7c5d0] max-w-2xl mx-auto mb-6 leading-relaxed">
              The route or candidate telemetry endpoint you requested does not exist, has been re-indexed, or requires elevated L7 security clearance.
            </p>

            {/* Live Code Diagnostic Console Block */}
            <div className="w-full bg-[#0d0d15] border border-[#46464f]/30 rounded-lg p-4 sm:p-5 text-left shadow-inner mb-6 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#46464f]/20">
                <div className="flex items-center gap-1.5 text-[#918f9a] text-[11px] font-mono">
                  <span className="material-symbols-outlined text-xs">dvr</span>
                  <span>SYNTHETIC PROBE DUMP</span>
                </div>
                <span className="text-[10px] text-[#918f9a] font-mono">HTTP/2 TLS_AES_256_GCM</span>
              </div>
              <div className="font-mono text-xs sm:text-sm space-y-1.5 overflow-x-auto text-[#c7c5d0]">
                <div className="flex items-start gap-2 text-[#c0c1ff]">
                  <span className="text-[#918f9a] select-none">$</span>
                  <span>curl -s -v -H &quot;Authorization: Bearer dm_token_***&quot; https://api.devmetric.io/v3/telemetry/node_404</span>
                </div>
                <div className="flex items-start gap-2 text-[#ffb4ab]">
                  <span className="text-[#ffb4ab] select-none">&gt;</span>
                  <span>Error: 0x7F_RESOURCE_NOT_FOUND (DNS resolution failed for URI path segment)</span>
                </div>
                <div className="flex items-start gap-2 text-[#918f9a]">
                  <span className="text-[#918f9a] select-none">&gt;</span>
                  <span>
                    Trace ID: <span className="text-[#e4e1ed]">tr_7a89e0219c</span> | Core:{" "}
                    <span className="text-[#e4e1ed]">dm-orchestrator-alpha-09</span>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-[#6bde80]">
                  <span className="text-[#6bde80] select-none">&gt;</span>
                  <span>Cluster Status: HEALTHY | Active Nodes: 42 | Packet Loss: 0.00% | Latency: 22ms</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] font-semibold text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(192,193,255,0.35)] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>Return to Dashboard Pulse</span>
              </Link>
              <button
                type="button"
                onClick={startDiagnostics}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#1f1f27] hover:bg-[#292932] border border-[#46464f]/40 text-[#e4e1ed] font-medium text-sm sm:text-base transition-all active:scale-[0.98] shadow-md disabled:opacity-70"
              >
                <span
                  className={`material-symbols-outlined text-[#c0c1ff] text-lg ${
                    isRunning ? "animate-spin" : ""
                  }`}
                >
                  {isRunning ? "progress_activity" : "settings_suggest"}
                </span>
                <span>
                  {isRunning ? "Probing Matrix..." : hasRun ? "Re-Run Diagnostics" : "Run System Diagnostics"}
                </span>
              </button>
              <Link
                href="mailto:support@devmetric.io"
                className="flex items-center justify-center gap-1.5 px-4 py-3 text-[#c7c5d0] hover:text-[#e4e1ed] text-sm transition-colors"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                <span>Contact Engineering Support</span>
              </Link>
            </div>

            {/* Live Diagnostics Output Feedback Container */}
            {hasRun && (
              <div className="w-full mt-6 p-4 bg-[#1f1f27] border border-[#46464f]/30 rounded-lg text-left transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#6bde80] font-semibold uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80] animate-pulse" />
                    {isRunning ? "Live Route Probe In Progress" : "Diagnostics Complete"}
                  </span>
                  <span className="text-[11px] text-[#918f9a] font-mono">{elapsedMs}ms</span>
                </div>
                <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-[#6bde80] h-full transition-all duration-300 shadow-[0_0_8px_rgba(107,222,128,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="font-mono text-xs text-[#918f9a] space-y-1.5">
                  <p className="text-[#c0c1ff]">&gt; Dispatching synthetic ICMP trace to node_404...</p>
                  {logs.map((step, idx) => (
                    <p
                      key={idx}
                      className={step.isSuccess ? "text-[#6bde80] font-medium" : "text-[#c7c5d0]"}
                    >
                      {step.msg}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation Links Row */}
        <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0d0d15]/80 border border-[#46464f]/30 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-[#918f9a] text-[11px] uppercase tracking-wider font-mono">
            <span className="material-symbols-outlined text-base text-[#c0c1ff]">alt_route</span>
            <span>Candidate Telemetry Subsystems:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-1 rounded bg-[#1f1f27] hover:bg-[#292932] border border-[#46464f]/20 text-[#e4e1ed] text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-xs text-[#c0c1ff]">dashboard</span>
              Overview
            </Link>
            <Link
              href="/dashboard/github"
              className="flex items-center gap-1 px-3 py-1 rounded bg-[#1f1f27] hover:bg-[#292932] border border-[#46464f]/20 text-[#e4e1ed] text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-xs text-[#c0c1ff]">commit</span>
              GitHub Analytics
            </Link>
            <Link
              href="/dashboard/resume"
              className="flex items-center gap-1 px-3 py-1 rounded bg-[#1f1f27] hover:bg-[#292932] border border-[#46464f]/20 text-[#e4e1ed] text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-xs text-[#c0c1ff]">description</span>
              Resume Scanner
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-1 rounded bg-[#1f1f27] hover:bg-[#292932] border border-[#46464f]/20 text-[#e4e1ed] text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-xs text-[#6bde80]">monitor_heart</span>
              System Status
            </Link>
          </div>
        </div>

        {/* Security & SOC-2 Compliance Footer Stamp */}
        <div className="w-full mt-6 pt-4 flex flex-wrap items-center justify-between text-[#918f9a] text-[11px] gap-4 border-t border-[#46464f]/20">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#c0c1ff]">verified_user</span>
              <span>SOC-2 Type II Certified</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#c0c1ff]">lock</span>
              <span>Zero-Knowledge L7 Proxy</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#6bde80]">shield</span>
              <span>ISO/IEC 27001</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#c7c5d0] font-mono text-[10px]">
            <span>DEV-METRIC CLOUD KERNEL</span>
            <span>•</span>
            <span>HOST 204.16.244.1</span>
            <span>•</span>
            <span className="text-[#6bde80]">PULSE: SYNCHRONIZED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
