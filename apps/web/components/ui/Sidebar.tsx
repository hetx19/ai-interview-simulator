"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DevMetricLogo } from "@/components/ui/DevMetricLogo";

const NAV_ITEMS = [
  { icon: "grid_view", label: "Overview", href: "/dashboard" },
  { icon: "terminal", label: "GitHub Analytics", href: "/dashboard/github" },
  {
    icon: "code_blocks",
    label: "LeetCode Metrics",
    href: "/dashboard/leetcode",
  },
  {
    icon: "document_scanner",
    label: "Resume Scanner",
    href: "/dashboard/resume",
  },
  { icon: "mic", label: "Mock Interviews", href: "/dashboard/interviews" },
  { icon: "verified", label: "Hiring Readiness", href: "/dashboard/hiring" },
  {
    icon: "credit_card",
    label: "Payment / Checkout",
    href: "/dashboard/payment",
  },
  { icon: "settings", label: "Settings", href: "/dashboard/settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#1b1b23]/90 backdrop-blur-xl z-50 flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
      {/* brand & navigation */}
      <div className="flex flex-col">
        {/* logo */}
        <Link
          href="/dashboard"
          className="h-16 px-6 flex items-center gap-3 focus:outline-none"
        >
          <DevMetricLogo size={32} className="flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[16px] leading-6 font-[500] text-[#e1dfff] tracking-tight font-sora">
              DevMetric
            </span>
            <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#c7c5d0]">
              Intelligence OS
            </span>
          </div>
        </Link>

        {/* telemetry badge */}
        <div className="px-3 py-1.5">
          <div className="bg-[#0d0d15]/80 rounded-lg p-2 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6bde80] shadow-[0_0_8px_rgba(107,222,128,0.5)]" />
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] uppercase text-[#6bde80]">
                Telemetry Active
              </span>
            </div>
            <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a]">
              v1.0.0
            </span>
          </div>
        </div>

        {/* nav links */}
        <nav className="flex flex-col gap-0.5 px-2 mt-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                  ${
                    active
                      ? "bg-[#292932] text-[#e1dfff] font-bold shadow-[0_0_20px_rgba(192,193,255,0.15)]"
                      : "text-[#c7c5d0] text-[14px] font-[400] hover:bg-[#292932] hover:text-[#e4e1ed]"
                  }
                `}
              >
                <span
                  className={`material-symbols-outlined text-xl transition-colors ${
                    active
                      ? "text-[#c0c1ff]"
                      : "text-[#918f9a] group-hover:text-[#c0c1ff]"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[14px] leading-[22px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* sync status */}
      <div className="p-3">
        <div className="bg-[#1f1f27]/60 rounded-xl p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a]">
              Sync Engine
            </span>
            <span className="text-[12px] leading-[18px] text-[#e4e1ed] font-medium">
              Cloud Matrix v4
            </span>
          </div>
          <span className="material-symbols-outlined text-[#6bde80] text-base">
            cloud_done
          </span>
        </div>
      </div>
    </aside>
  );
}
