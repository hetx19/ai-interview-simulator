"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MOBILE_NAV_ITEMS = [
  { icon: "grid_view", label: "Overview", href: "/dashboard" },
  { icon: "terminal", label: "GitHub", href: "/dashboard/github" },
  { icon: "description", label: "Resume", href: "/dashboard/resume" },
  { icon: "tune", label: "Settings", href: "/dashboard/settings" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 w-full z-50 pb-safe bg-[#13131b]/95 backdrop-blur-xl border-t border-[#46464f]/30 shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"
    >
      <div className="flex justify-around items-center h-16 sm:h-20 px-2 max-w-lg mx-auto">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] h-full gap-1 transition-colors ${
                active
                  ? "text-[#c0c1ff] font-semibold"
                  : "text-[#c7c5d0] hover:text-[#e4e1ed]"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform ${
                  active ? "scale-110 text-[#c0c1ff]" : "text-[#918f9a]"
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] leading-none tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
