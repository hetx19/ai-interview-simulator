"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface TopbarProps {
  userName?: string;
  userRole?: string;
  userImage?: string;
  pageCrumb?: string;
}

export function Topbar({
  userName = "Alex Mercer",
  userRole = "Staff Level Candidate",
  userImage,
  pageCrumb = "Telemetry Suite",
}: TopbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#13131b]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
      {/* breadcrumbs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-[12px] leading-[18px] text-[#918f9a]">
          <span className="text-[#c7c5d0]">DevMetric</span>
          <span className="material-symbols-outlined text-sm text-[#918f9a]">chevron_right</span>
          <span className="text-[#e1dfff] font-medium">{pageCrumb}</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c0c1ff]/15 shadow-[0_0_16px_rgba(192,193,255,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e1dfff] shadow-[0_0_8px_rgba(192,193,255,0.8)]" />
          <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#e1dfff]">
            Targeting: FAANG / Top Tech Tier
          </span>
        </div>
      </div>

      {/* right actions */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-1.5 bg-[#0d0d15]/90 px-3 py-1 rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <span className="w-2 h-2 rounded-full bg-[#6bde80]" />
          <span className="text-[10px] leading-[14px] font-[600] text-[#c7c5d0]">
            Radar: 99.4% · Latency 22ms
          </span>
        </div>

        {/* notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-1 rounded-lg text-[#c7c5d0] hover:text-[#e4e1ed] hover:bg-[#1f1f27] transition-all"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffb4ab] ring-2 ring-[#13131b] animate-pulse" />
        </button>

        {/* user menu */}
        <div className="relative flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[12px] leading-[18px] font-semibold text-[#e4e1ed] leading-tight">
              {userName}
            </span>
            <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a]">
              {userRole}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative"
            aria-label="User menu"
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Profile"
                src={userImage}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#c0c1ff]/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#292932] ring-2 ring-[#c0c1ff]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-base text-[#c7c5d0]">person</span>
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-10 w-48 bg-[#1f1f27] border border-[#46464f]/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="p-3 border-b border-[#46464f]/30">
                <p className="text-[14px] leading-[22px] font-semibold text-[#e4e1ed]">{userName}</p>
                <p className="text-[12px] leading-[18px] text-[#918f9a]">{userRole}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[14px] leading-[22px] text-[#ffb4ab] hover:bg-[#292932] transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
