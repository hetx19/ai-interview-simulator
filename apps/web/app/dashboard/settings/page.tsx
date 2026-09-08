"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [targetRole, setTargetRole] = useState("L6 Staff Distributed Systems");
  const [targetCompanies, setTargetCompanies] = useState("Google, Meta, Stripe, Netflix");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 max-w-[1440px] mx-auto w-full space-y-8">

        {/* header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] leading-[14px] font-[600] text-[#e1dfff] uppercase tracking-widest">
              System Configuration
            </span>
            <span className="w-1 h-1 rounded-full bg-[#918f9a]" />
            <span className="text-[10px] leading-[14px] font-[600] text-[#6bde80] uppercase tracking-wider">
              Profile &amp; Integrations
            </span>
          </div>
          <h1 className="text-[32px] leading-[40px] font-[600] text-[#e4e1ed] tracking-tight">
            Account &amp; System Settings
          </h1>
          <p className="text-[14px] leading-[22px] text-[#c7c5d0]">
            Manage OAuth connections, telemetry webhooks, and target career calibration.
          </p>
        </div>

        {/* settings sections */}
        <div className="space-y-6 max-w-3xl">

          {/* connected accounts */}
          <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/30 shadow-xl space-y-4">
            <h2 className="text-[18px] font-semibold text-[#e4e1ed]">Connected Providers &amp; Tokens</h2>
            <div className="space-y-3">
              {/* github */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d15] border border-[#46464f]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#292932] flex items-center justify-center text-[#e4e1ed]">
                    <span className="material-symbols-outlined text-lg">terminal</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-semibold text-[#e4e1ed]">GitHub Integration</span>
                    <span className="text-[12px] text-[#6bde80] block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80]" /> Connected (alex-mercer-dev)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#918f9a] bg-[#1f1f27] px-2 py-1 rounded">
                  AES-256-GCM Encrypted
                </span>
              </div>

              {/* leetcode */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d15] border border-[#46464f]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#292932] flex items-center justify-center text-[#ffb867]">
                    <span className="material-symbols-outlined text-lg">code_blocks</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-semibold text-[#e4e1ed]">LeetCode Account</span>
                    <span className="text-[12px] text-[#c7c5d0] block">@alex_mercer_code</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#6bde80] bg-[#6bde80]/15 px-2 py-1 rounded">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* career targeting */}
          <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#46464f]/30 shadow-xl space-y-4">
            <h2 className="text-[18px] font-semibold text-[#e4e1ed]">Career Calibration</h2>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#c7c5d0] block mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-[#0d0d15] border border-[#46464f]/40 rounded-lg px-3 py-2 text-[#e4e1ed] text-sm focus:border-[#c0c1ff] outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#c7c5d0] block mb-1">
                  Target Companies (comma-separated)
                </label>
                <input
                  type="text"
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  className="w-full bg-[#0d0d15] border border-[#46464f]/40 rounded-lg px-3 py-2 text-[#e4e1ed] text-sm focus:border-[#c0c1ff] outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              {saved ? "Changes Saved!" : "Save Calibration"}
            </button>
          </div>

          {/* danger zone */}
          <div className="rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 border border-[#ffb4ab]/30 shadow-xl space-y-3">
            <h2 className="text-[18px] font-semibold text-[#ffb4ab]">Danger Zone</h2>
            <p className="text-[12px] text-[#c7c5d0]">
              Deleting your account will immediately revoke all sessions, soft-delete your candidate record, and unlink stored encrypted tokens.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/20 text-xs font-semibold transition-all"
            >
              Delete Candidate Profile
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
