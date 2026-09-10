"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DevMetricLogo } from "@/components/ui/DevMetricLogo";
import {
  scrollToTarget,
  scrollToTop,
  stopCurrentScrollAnimation,
} from "@/lib/smoothScroll";

export default function LandingPage() {
  const router = useRouter();

  // mobile nav state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // quick email cta state
  const [quickEmail, setQuickEmail] = useState("");

  // simulator slider states
  const [commits, setCommits] = useState(680);
  const [leetcodeSolved, setLeetcodeSolved] = useState(240);
  const [atsScore, setAtsScore] = useState(82);

  // 3d tilt effect for hero card
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${-y * 0.012}deg) rotateY(${x * 0.012}deg)`,
      transition: "transform 100ms ease-out",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 400ms ease-in-out",
    });
  };

  // calculate readiness from input scores
  const {
    compositeScore,
    tier,
    tierColor,
    probability,
    compRange,
    checks,
    ringOffset,
  } = useMemo(() => {
    const gitScore = Math.min(100, (commits / 1500) * 100);
    const leetScore = Math.min(100, (leetcodeSolved / 400) * 100);
    const composite = Math.round(
      gitScore * 0.35 + leetScore * 0.45 + atsScore * 0.2,
    );

    // circle circumference for r=52
    const circumference = 326;
    const offset = circumference - (composite / 100) * circumference;

    if (composite >= 85) {
      return {
        compositeScore: composite,
        tier: "STAFF / PRINCIPAL (L6+)",
        tierColor: "text-secondary",
        probability: "94% Interview Pass Probability",
        compRange: "Predicted offer range: $420k – $560k TC",
        checks: {
          leet: "Algorithms: Deep System & Hard Mastery",
          git: "Commit Velocity: Staff Tier Contributor",
          ats: "Resume ATS: Elite Google X-Y-Z Resonance",
        },
        ringOffset: offset,
      };
    }
    if (composite >= 70) {
      return {
        compositeScore: composite,
        tier: "SENIOR ENGINEER (L5)",
        tierColor: "text-primary-container",
        probability: "84% Interview Pass Probability",
        compRange: "Predicted offer range: $290k – $380k TC",
        checks: {
          leet: "Algorithms: Mid/Hard Competency Solid",
          git: "Commit Velocity: Consistent High Output",
          ats: "Resume ATS: Passes Standard Screening",
        },
        ringOffset: offset,
      };
    }
    if (composite >= 50) {
      return {
        compositeScore: composite,
        tier: "MID-LEVEL SWE (L4)",
        tierColor: "text-tertiary-container",
        probability: "62% Interview Pass Probability",
        compRange: "Predicted offer range: $180k – $240k TC",
        checks: {
          leet: "Algorithms: Requires Graph & DP Polish",
          git: "Commit Velocity: Moderate Frequency",
          ats: "Resume ATS: Needs Bullet Point Rewrites",
        },
        ringOffset: offset,
      };
    }
    return {
      compositeScore: composite,
      tier: "ASSOCIATE / FOUNDATIONAL",
      tierColor: "text-error",
      probability: "38% Interview Pass Probability",
      compRange: "Target Action: Complete 60-day Roadmap",
      checks: {
        leet: "Algorithms: Focus on Core Fundamentals",
        git: "Commit Velocity: Increase PR Cadence",
        ats: "Resume ATS: High risk of automated rejection",
      },
      ringOffset: offset,
    };
  }, [commits, leetcodeSolved, atsScore]);

  const handleQuickEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickEmail.trim()) {
      router.push(`/signup?email=${encodeURIComponent(quickEmail.trim())}`);
    } else {
      router.push("/signup");
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    scrollToTarget(targetId);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    scrollToTop();
  };

  // Smoothly position to initial URL hash once page mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const targetId = window.location.hash.replace("#", "");
      if (targetId) {
        const timer = setTimeout(() => {
          scrollToTarget(targetId, { updateHash: false });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Cancel any running scroll animation on unmount
  useEffect(() => {
    return () => {
      stopCurrentScrollAnimation();
    };
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="w-full max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-md">
          <div className="h-16 w-full pointer-events-auto rounded-full bg-surface-container/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] px-space-base flex items-center justify-between border border-outline-variant/20">
            {/* logo */}
            <div className="flex items-center gap-space-md">
              <Link
                href="/"
                onClick={handleLogoClick}
                className="flex items-center gap-space-sm focus:outline-none group cursor-pointer"
              >
                <DevMetricLogo
                  size={32}
                  className="h-8 w-auto object-contain"
                />
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold group-hover:text-white transition-colors">
                  DevMetric
                </span>
              </Link>
            </div>

            {/* nav links */}

            <nav className="hidden lg:flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-low/70">
              <a
                href="#benchmarks"
                onClick={(e) => handleNavClick(e, "benchmarks")}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-space-md py-space-xs rounded-full transition-all text-body-sm font-body-sm cursor-pointer"
              >
                Benchmarks
              </a>
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, "features")}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-space-md py-space-xs rounded-full transition-all text-body-sm font-body-sm cursor-pointer"
              >
                Features
              </a>
              <a
                href="#intelligence-engine"
                onClick={(e) => handleNavClick(e, "intelligence-engine")}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-space-md py-space-xs rounded-full transition-all text-body-sm font-body-sm cursor-pointer"
              >
                Intelligence Engine
              </a>
              <a
                href="#interactive-telemetry"
                onClick={(e) => handleNavClick(e, "interactive-telemetry")}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-space-md py-space-xs rounded-full transition-all text-body-sm font-body-sm cursor-pointer"
              >
                Simulator
              </a>
            </nav>

            {/* nav actions */}
            <div className="flex items-center gap-space-sm">
              <Link
                href="/login"
                className="text-on-surface-variant hover:text-on-surface px-space-md py-space-xs rounded-full transition-colors text-body-sm font-body-sm"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-primary-container hover:bg-primary-fixed-dim text-on-primary font-title-md text-label-md px-space-base py-space-xs rounded-full shadow-[0_0_16px_rgba(192,193,255,0.4)] hover:shadow-[0_0_24px_rgba(192,193,255,0.6)] transition-all transform active:scale-95"
              >
                Get Started Free
              </Link>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </div>

              {/* mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                <span className="material-symbols-outlined text-[24px]">
                  {mobileMenuOpen ? "close" : "menu"}
                </span>
              </button>
            </div>
          </div>

          {/* mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 pointer-events-auto rounded-2xl bg-surface-container-low/95 border border-outline-variant/30 backdrop-blur-xl p-4 shadow-2xl flex flex-col space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, "features")}
                className="px-4 py-2 text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition cursor-pointer"
              >
                Features
              </a>
              <a
                href="#intelligence-engine"
                onClick={(e) => handleNavClick(e, "intelligence-engine")}
                className="px-4 py-2 text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition cursor-pointer"
              >
                Intelligence Engine
              </a>
              <a
                href="#benchmarks"
                onClick={(e) => handleNavClick(e, "benchmarks")}
                className="px-4 py-2 text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition cursor-pointer"
              >
                Benchmarks
              </a>
              <a
                href="#interactive-telemetry"
                onClick={(e) => handleNavClick(e, "interactive-telemetry")}
                className="px-4 py-2 text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition cursor-pointer"
              >
                Simulator
              </a>
              <div className="pt-2 border-t border-outline-variant/30 flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 text-center py-2 rounded-xl bg-surface-container-high text-body-sm font-semibold text-on-surface"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center py-2 rounded-xl bg-primary-container text-on-primary text-body-sm font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* main content */}
      <main className="w-full pt-16 bg-surface">
        <div className="flex flex-col w-full overflow-hidden">
          {/* ambient glow */}
          <div className="relative w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-primary-container/15 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
            <div className="absolute top-80 right-[-100px] w-[500px] h-[500px] bg-primary-fixed-dim/10 blur-[140px] pointer-events-none -z-10 rounded-full" />
            <div className="absolute top-[900px] left-[-150px] w-[600px] h-[600px] bg-secondary/8 blur-[160px] pointer-events-none -z-10 rounded-full" />

            {/* hero */}
            <section className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-2xl lg:pt-space-3xl pb-space-3xl">
              <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                {/* live status pill */}
                <a
                  href="#benchmarks"
                  onClick={(e) => handleNavClick(e, "benchmarks")}
                  className="inline-flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container/90 shadow-md backdrop-blur-xl mb-space-lg group cursor-pointer transition-all hover:bg-surface-container-high border border-outline-variant/30"
                >
                  <div className="flex items-center gap-space-2xs">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#6bde80] animate-pulse" />
                    <span className="font-label-md text-label-md text-on-surface font-semibold tracking-wide uppercase font-mono">
                      DevMetric 3.4 Live
                    </span>
                  </div>
                  <span className="text-outline text-label-sm">•</span>
                  <span className="font-label-md text-label-md text-secondary font-medium">
                    FAANG Benchmarking Active
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[16px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </a>

                {/* hero title */}
                <h1 className="font-display-lg text-display-lg-mobile sm:text-headline-lg md:text-[64px] md:leading-[72px] text-on-surface tracking-tight font-semibold max-w-4xl">
                  Your Engineering Hiring Readiness,{" "}
                  <span className="block bg-gradient-to-r from-primary-container via-primary-fixed to-secondary bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(192,193,255,0.35)]">
                    Quantified.
                  </span>
                </h1>

                {/* hero subtitle */}
                <p className="mt-space-lg font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                  Connect your GitHub, analyze your LeetCode, screen your
                  resume, and conduct AI voice mock interviews — all in one
                  unified intelligence telemetry dashboard.
                </p>

                {/* hero cta */}
                <div className="mt-space-xl flex flex-col sm:flex-row items-center gap-space-md w-full sm:w-auto justify-center">
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto px-space-xl py-space-md rounded-full bg-primary-container text-on-primary font-title-md text-title-md font-semibold flex items-center justify-center gap-space-sm shadow-[0_0_24px_rgba(192,193,255,0.45)] hover:shadow-[0_0_36px_rgba(192,193,255,0.7)] hover:bg-primary-fixed-dim transition-all active:scale-[0.98]"
                  >
                    <span>Start Preparing Free</span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </Link>
                  <a
                    href="#interactive-telemetry"
                    onClick={(e) => handleNavClick(e, "interactive-telemetry")}
                    className="w-full sm:w-auto px-space-xl py-space-md rounded-full bg-surface-container/90 text-on-surface hover:text-primary-container font-title-md text-title-md font-medium flex items-center justify-center gap-space-sm backdrop-blur-xl shadow-md hover:bg-surface-container-high transition-all border border-outline-variant/30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      play_circle
                    </span>
                    <span>View Live Demo Profile</span>
                  </a>
                </div>

                {/* social proof strip */}
                <div className="mt-space-xl flex flex-wrap items-center justify-center gap-space-md sm:gap-space-lg text-label-md text-on-surface-variant font-label-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      verified
                    </span>
                    <span>18,400+ Engineers Evaluated</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-[18px]">
                      lock
                    </span>
                    <span>Zero Code Retention Policy</span>
                  </div>
                </div>
              </div>

              {/* 3d hero preview card */}
              <div
                className="mt-space-2xl max-w-5xl mx-auto relative perspective-1000 w-full"
                id="hero-preview-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* glow layer */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-container/20 via-surface-variant/40 to-secondary/20 rounded-[28px] blur-xl opacity-70 -z-10" />

                <div
                  ref={heroCardRef}
                  style={tiltStyle}
                  className="w-full rounded-[24px] bg-surface-container-low/90 backdrop-blur-2xl p-space-md sm:p-space-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden transition-all duration-300 border border-outline-variant/30"
                >
                  {/* console nav bar */}
                  <div className="flex flex-wrap items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-error/70" />
                        <div className="w-3 h-3 rounded-full bg-tertiary-container/70" />
                        <div className="w-3 h-3 rounded-full bg-secondary/70" />
                      </div>
                      <span className="text-label-sm font-label-sm text-outline px-space-xs py-0.5 rounded bg-surface-container-lowest font-mono">
                        devmetric-telemetry://candidate/alex-chen
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="px-space-sm py-0.5 rounded-full bg-secondary/15 text-secondary text-label-sm font-label-sm font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                        RUNNING SIMULATION L6
                      </span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant font-mono bg-surface-container-high px-space-sm py-0.5 rounded">
                        Latency: 18ms
                      </span>
                    </div>
                  </div>

                  {/* console dashboard mockup */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md pt-space-sm">
                    {/* readiness gauge card */}
                    <div className="md:col-span-4 rounded-xl bg-surface-container/80 p-space-base flex flex-col justify-between shadow-sm border border-outline-variant/20">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-mono">
                            Readiness Score
                          </span>
                          <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-secondary/15 text-secondary">
                            FAANG Calibrated
                          </span>
                        </div>
                        {/* circular gauge */}
                        <div className="relative flex items-center justify-center my-space-lg w-full">
                          <svg
                            className="w-44 h-44 max-w-full aspect-square transform -rotate-90 flex-shrink-0"
                            viewBox="0 0 120 120"
                          >
                            <circle
                              className="text-surface-variant"
                              cx="60"
                              cy="60"
                              fill="transparent"
                              r="50"
                              stroke="currentColor"
                              strokeWidth="8"
                            />
                            <circle
                              className="text-primary-container"
                              cx="60"
                              cy="60"
                              fill="transparent"
                              r="50"
                              stroke="currentColor"
                              strokeDasharray="314"
                              strokeDashoffset="50"
                              strokeLinecap="round"
                              strokeWidth="9"
                              style={{
                                filter:
                                  "drop-shadow(0 0 10px rgba(192, 193, 255, 0.6))",
                              }}
                            />
                            <circle
                              className="text-secondary"
                              cx="60"
                              cy="60"
                              fill="transparent"
                              r="50"
                              stroke="currentColor"
                              strokeDasharray="314"
                              strokeDashoffset="190"
                              strokeLinecap="round"
                              strokeWidth="9"
                              style={{
                                filter:
                                  "drop-shadow(0 0 8px rgba(107, 222, 128, 0.7))",
                              }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span
                              className="font-display-lg text-[44px] font-bold text-on-surface tracking-tighter leading-none"
                              id="hero-gauge-number"
                            >
                              84
                            </span>
                            <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase mt-1">
                              Tier 1 Offer Ready
                            </span>
                            <span className="font-label-sm text-[10px] text-outline font-mono">
                              Percentile: 94.2%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* metrics breakdown */}
                      <div className="space-y-space-xs pt-space-xs">
                        <div className="flex justify-between items-center text-label-md font-label-md">
                          <span className="text-on-surface-variant">
                            Algorithm &amp; DP
                          </span>
                          <span className="text-on-surface font-semibold font-mono text-secondary">
                            91 / 100
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full w-[91%] shadow-[0_0_8px_#6bde80]" />
                        </div>

                        <div className="flex justify-between items-center text-label-md font-label-md pt-1">
                          <span className="text-on-surface-variant">
                            System Architecture
                          </span>
                          <span className="text-on-surface font-semibold font-mono text-primary-container">
                            82 / 100
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary-container h-full rounded-full w-[82%] shadow-[0_0_8px_#c0c1ff]" />
                        </div>

                        <div className="flex justify-between items-center text-label-md font-label-md pt-1">
                          <span className="text-on-surface-variant">
                            ATS Signal Resonance
                          </span>
                          <span className="text-on-surface font-semibold font-mono text-tertiary-container">
                            88 / 100
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-tertiary-container h-full rounded-full w-[88%]" />
                        </div>
                      </div>
                    </div>

                    {/* radar & heatmap */}
                    <div className="md:col-span-5 flex flex-col gap-space-md">
                      {/* radar visualizer */}
                      <div className="rounded-xl bg-surface-container/80 p-space-base shadow-sm border border-outline-variant/20">
                        <div className="flex items-center justify-between mb-space-sm">
                          <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-primary-container text-[18px]">
                              radar
                            </span>
                            <span className="font-title-md text-title-md text-on-surface font-semibold">
                              Competency Radar
                            </span>
                          </div>
                          <span className="text-label-sm font-label-sm text-outline-variant uppercase font-mono">
                            Staff SWE Baseline
                          </span>
                        </div>
                        {/* radar svg */}
                        <div className="w-full h-44 flex items-center justify-center relative">
                          <svg
                            className="w-full h-full max-h-40 overflow-visible"
                            viewBox="0 0 200 180"
                          >
                            {/* concentric grid polygons */}
                            <polygon
                              className="text-surface-variant"
                              fill="none"
                              points="100,10 180,55 180,135 100,175 20,135 20,55"
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                            <polygon
                              className="text-surface-variant/60"
                              fill="none"
                              points="100,30 156,65 156,120 100,150 44,120 44,65"
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                            <polygon
                              className="text-surface-variant/40"
                              fill="none"
                              points="100,50 132,75 132,105 100,125 68,105 68,75"
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                            {/* candidate polygon */}
                            <polygon
                              className="transition-all duration-700"
                              fill="rgba(192, 193, 255, 0.22)"
                              points="100,18 170,58 150,126 100,165 30,128 40,60"
                              stroke="#c0c1ff"
                              strokeWidth="2"
                              style={{
                                filter:
                                  "drop-shadow(0 0 8px rgba(192,193,255,0.4))",
                              }}
                            />
                            {/* target benchmark polygon */}
                            <polygon
                              fill="none"
                              points="100,24 160,63 155,122 100,152 40,122 46,63"
                              stroke="#6bde80"
                              strokeDasharray="3,3"
                              strokeWidth="1.5"
                            />
                            {/* radar labels */}
                            <text
                              className="fill-on-surface-variant text-[9px] font-mono"
                              textAnchor="middle"
                              x="100"
                              y="6"
                            >
                              Algorithms
                            </text>
                            <text
                              className="fill-on-surface-variant text-[9px] font-mono"
                              textAnchor="start"
                              x="185"
                              y="55"
                            >
                              System Design
                            </text>
                            <text
                              className="fill-on-surface-variant text-[9px] font-mono"
                              textAnchor="start"
                              x="185"
                              y="140"
                            >
                              Code Velocity
                            </text>
                            <text
                              className="fill-on-surface-variant text-[9px] font-mono"
                              textAnchor="middle"
                              x="100"
                              y="188"
                            >
                              Concurrency
                            </text>
                            <text
                              className="fill-on-surface-variant text-[9px] font-mono"
                              textAnchor="end"
                              x="15"
                              y="140"
                            >
                              Communication
                            </text>
                            <text
                              className="fill-on-surface-variant text-[9px] font-mono"
                              textAnchor="end"
                              x="15"
                              y="55"
                            >
                              Code Quality
                            </text>
                          </svg>
                        </div>
                      </div>

                      {/* commit velocity heatmap */}
                      <div className="rounded-xl bg-surface-container/80 p-space-base shadow-sm border border-outline-variant/20">
                        <div className="flex items-center justify-between mb-space-xs">
                          <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-secondary text-[18px]">
                              rebase_edit
                            </span>
                            <span className="font-label-md text-label-md text-on-surface font-semibold">
                              GitHub Velocity Pulse
                            </span>
                          </div>
                          <span className="font-mono text-label-sm text-secondary font-semibold">
                            +34.8% vs L5 Peers
                          </span>
                        </div>
                        {/* mini heatmap grid */}
                        <div className="grid grid-flow-col grid-rows-4 gap-1 overflow-x-hidden pt-2">
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/30" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/70" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/20" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/50" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/80" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/60" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/40" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/70" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/50" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/90" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/70" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/80" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/30" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-surface-container-high" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/50" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/60" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/80" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary" />
                          <div className="w-3.5 h-3.5 rounded-sm bg-secondary/90" />
                        </div>
                      </div>
                    </div>

                    {/* voice telemetry card */}
                    <div className="md:col-span-3 rounded-xl bg-surface-container/80 p-space-base shadow-sm flex flex-col justify-between border border-outline-variant/20">
                      <div>
                        <div className="flex items-center justify-between pb-space-xs">
                          <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary-container text-[16px]">
                              mic
                            </span>
                            Voice Telemetry
                          </span>
                          <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                        </div>
                        <div className="p-space-xs rounded bg-surface-container-lowest/80 my-space-xs font-mono text-[11px] text-on-surface-variant leading-tight space-y-1.5 border border-outline-variant/20">
                          <div className="text-outline">
                            &gt; AI: &quot;Explain LRU cache eviction
                            complexity.&quot;
                          </div>
                          <div className="text-primary-container">
                            &gt; Candidate: &quot;O(1) using Doubly-Linked List
                            + Map...&quot;
                          </div>
                          <div className="text-secondary font-medium">
                            &gt; Signal: High clarity, precise taxonomy.
                          </div>
                        </div>
                        {/* audio waveform */}
                        <div className="flex items-center justify-between h-8 px-2 bg-surface-container-lowest/60 rounded my-space-sm gap-1 border border-outline-variant/20">
                          <div className="w-1 bg-primary-container/80 rounded-full h-3 animate-pulse" />
                          <div
                            className="w-1 bg-secondary rounded-full h-6 animate-pulse"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-1 bg-primary-container rounded-full h-7 animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-1 bg-primary-container/60 rounded-full h-4 animate-pulse"
                            style={{ animationDelay: "0.3s" }}
                          />
                          <div
                            className="w-1 bg-secondary rounded-full h-6 animate-pulse"
                            style={{ animationDelay: "0.15s" }}
                          />
                          <div
                            className="w-1 bg-primary-container rounded-full h-2 animate-pulse"
                            style={{ animationDelay: "0.25s" }}
                          />
                          <div
                            className="w-1 bg-secondary rounded-full h-5 animate-pulse"
                            style={{ animationDelay: "0.05s" }}
                          />
                          <div
                            className="w-1 bg-primary-container rounded-full h-7 animate-pulse"
                            style={{ animationDelay: "0.35s" }}
                          />
                          <div
                            className="w-1 bg-secondary rounded-full h-4 animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div className="w-1 bg-primary-container/70 rounded-full h-2" />
                        </div>
                      </div>
                      {/* recommendation card */}
                      <div className="pt-space-xs">
                        <div className="rounded-lg bg-surface-container-high/60 p-space-xs text-label-sm border border-outline-variant/20">
                          <div className="flex items-center gap-1 text-tertiary-container font-semibold">
                            <span className="material-symbols-outlined text-[14px]">
                              tips_and_updates
                            </span>
                            <span>Next Milestone</span>
                          </div>
                          <p className="text-on-surface-variant text-[11px] mt-1 leading-snug">
                            Complete 3 Hard Graph Contests to cross Meta E6
                            readiness boundary.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* social proof banner */}
              <div
                className="mt-space-2xl max-w-5xl mx-auto text-center scroll-mt-28"
                id="benchmarks"
              >
                <p className="font-label-md text-label-md uppercase tracking-widest text-outline">
                  Calibrated against top engineering benchmarks
                </p>
                <div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-xl sm:gap-space-2xl opacity-75">
                  <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="font-display-lg-mobile text-[20px] font-bold tracking-tighter">
                      Google
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="font-display-lg-mobile text-[20px] font-bold tracking-tight">
                      Meta
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="font-display-lg-mobile text-[20px] font-bold tracking-tight">
                      Apple
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="font-display-lg-mobile text-[20px] font-bold tracking-wider">
                      NETFLIX
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="font-display-lg-mobile text-[20px] font-bold tracking-tight">
                      stripe
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="font-display-lg-mobile text-[20px] font-bold tracking-tight">
                      UBER
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* feature pillars */}
          <section
            className="w-full bg-surface-container-lowest/60 py-space-3xl relative scroll-mt-24"
            id="features"
          >
            <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop">
              {/* section header */}
              <div className="max-w-3xl mb-space-2xl">
                <span className="font-label-md text-label-md font-semibold text-secondary uppercase tracking-widest bg-secondary/10 px-space-md py-1 rounded-full">
                  Comprehensive Telemetry Architecture
                </span>
                <h2 className="font-display-lg text-headline-lg lg:text-display-lg text-on-surface font-semibold mt-space-sm">
                  Four Core Engines. <br className="hidden sm:inline" />
                  <span className="text-primary-container">
                    Total Preparation Precision.
                  </span>
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-sm">
                  Traditional prep is fragmented across spreadsheets and
                  isolated practice tabs. DevMetric synthesizes your genuine
                  code repositories, algorithms, resume signal, and live verbal
                  performance into a single source of truth.
                </p>
              </div>

              {/* bento grid */}
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg scroll-mt-28"
                id="intelligence-engine"
              >
                {/* pillar 1: github */}
                <div className="lg:col-span-7 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-xl shadow-md flex flex-col justify-between group hover:bg-surface-container transition-all border border-outline-variant/20">
                  <div>
                    <div className="flex items-center justify-between mb-space-base">
                      <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container shadow-[0_0_16px_rgba(192,193,255,0.3)]">
                        <span className="material-symbols-outlined text-[28px]">
                          folder_code
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold uppercase px-space-sm py-1 rounded-full bg-primary-container/10 text-primary-container font-mono">
                        Engine 01
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                      GitHub Commit &amp; PR Analytics
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                      Automated static analysis of your genuine pull requests,
                      commit consistency velocity, architecture modularity, and
                      production-grade code reviews across distributed teams.
                    </p>

                    {/* heatmap & languages preview */}
                    <div className="mt-space-lg p-space-base rounded-xl bg-surface-container-lowest/80 space-y-space-md border border-outline-variant/20">
                      <div className="flex items-center justify-between text-label-md font-mono text-on-surface-variant">
                        <span>52-Week Contribution Matrix</span>
                        <span className="text-secondary font-semibold">
                          1,492 Commits / 84 Merged PRs
                        </span>
                      </div>
                      {/* contribution heatmap mockup */}
                      <div className="flex gap-1.5 overflow-x-auto py-1">
                        {[
                          [0.8, 1, 0.3, 0],
                          [0, 0.6, 1, 0.4],
                          [1, 1, 0.9, 0.2],
                          [0.5, 0, 0.8, 1],
                          [1, 0.4, 0, 0.7],
                          [0.9, 1, 0.3, 0],
                          [0.7, 1, 1, 0.8],
                          [0, 0.5, 0.9, 1],
                        ].map((col, cIdx) => (
                          <div
                            key={cIdx}
                            className="grid grid-rows-4 gap-1.5 flex-shrink-0"
                          >
                            {col.map((val, rIdx) => (
                              <div
                                key={rIdx}
                                className={`w-4 h-4 rounded ${
                                  val === 0
                                    ? "bg-surface-container-high"
                                    : val > 0.7
                                      ? "bg-secondary"
                                      : "bg-secondary/50"
                                }`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      {/* language breakdown */}
                      <div className="pt-space-xs">
                        <div className="flex items-center justify-between text-label-sm font-label-sm text-outline-variant mb-1 font-mono">
                          <span>Stack Distribution</span>
                          <span className="text-on-surface font-semibold">
                            Go (48%) • TypeScript (34%) • Rust (18%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-container-high">
                          <div className="bg-primary-container h-full w-[48%]" />
                          <div className="bg-secondary h-full w-[34%]" />
                          <div className="bg-tertiary-container h-full w-[18%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-lg flex items-center justify-between pt-space-md border-t border-outline-variant/20">
                    <span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        check_circle
                      </span>
                      GitHub Enterprise &amp; Personal Auth Supported
                    </span>
                    <span className="material-symbols-outlined text-primary-container group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>

                {/* pillar 2: leetcode */}
                <div className="lg:col-span-5 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-xl shadow-md flex flex-col justify-between group hover:bg-surface-container transition-all border border-outline-variant/20">
                  <div>
                    <div className="flex items-center justify-between mb-space-base">
                      <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(107,222,128,0.3)]">
                        <span className="material-symbols-outlined text-[28px]">
                          terminal
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold uppercase px-space-sm py-1 rounded-full bg-secondary/10 text-secondary font-mono">
                        Engine 02
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                      LeetCode Contest &amp; Radar Tracker
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                      Deep diagnostic breakdown by Dynamic Programming,
                      Monotonic Stacks, and Graph Algorithms to expose blind
                      spots before interviews.
                    </p>

                    {/* topic mastery bars */}
                    <div className="mt-space-lg p-space-base rounded-xl bg-surface-container-lowest/80 space-y-space-sm border border-outline-variant/20">
                      <div>
                        <div className="flex justify-between text-label-sm font-mono mb-1">
                          <span className="text-on-surface">
                            Dynamic Programming
                          </span>
                          <span className="text-secondary font-semibold">
                            94% (Mastery)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full w-[94%] shadow-[0_0_8px_#6bde80]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-label-sm font-mono mb-1">
                          <span className="text-on-surface">
                            Graph Theory &amp; Dijkstra
                          </span>
                          <span className="text-primary-container font-semibold">
                            86% (Strong)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-container h-full rounded-full w-[86%] shadow-[0_0_8px_#c0c1ff]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-label-sm font-mono mb-1">
                          <span className="text-on-surface">
                            Concurrency &amp; Locks
                          </span>
                          <span className="text-tertiary-container font-semibold">
                            62% (Target Action)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-tertiary-container h-full rounded-full w-[62%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-lg flex items-center justify-between pt-space-md border-t border-outline-variant/20">
                    <span className="text-label-md font-label-md text-on-surface-variant font-mono">
                      Rating Benchmark:{" "}
                      <strong className="text-on-surface">
                        2,184 (Top 1.2%)
                      </strong>
                    </span>
                    <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>

                {/* pillar 3: resume ats */}
                <div className="lg:col-span-5 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-xl shadow-md flex flex-col justify-between group hover:bg-surface-container transition-all border border-outline-variant/20">
                  <div>
                    <div className="flex items-center justify-between mb-space-base">
                      <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed-dim shadow-[0_0_16px_rgba(255,184,103,0.3)]">
                        <span className="material-symbols-outlined text-[28px]">
                          description
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold uppercase px-space-sm py-1 rounded-full bg-tertiary-container/15 text-tertiary-container font-mono">
                        Engine 03
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                      AI Resume ATS X-Y-Z Scanner
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                      Rewrites engineering accomplishments into Google’s
                      standard &quot;Accomplished [X], measured by [Y], by doing
                      [Z]&quot; with live ATS keyword gap injection.
                    </p>

                    {/* diff rewriter box */}
                    <div className="mt-space-lg p-space-base rounded-xl bg-surface-container-lowest/80 space-y-2 border border-outline-variant/20">
                      <div className="p-space-xs rounded bg-error-container/20 text-error text-[11px] font-mono line-through opacity-80">
                        - Built microservices to speed up our checkout process.
                      </div>
                      <div className="p-space-xs rounded bg-secondary/15 text-secondary text-[11px] font-mono">
                        + Optimized checkout pipeline throughput by 38%
                        (reducing p99 latency to 120ms) by re-architecting
                        payment RPCs with gRPC connection pooling.
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-outline font-mono pt-1">
                        <span>Signal Score: 52 → 96</span>
                        <span className="text-secondary font-semibold">
                          +44 pts ATS Boost
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-lg flex items-center justify-between pt-space-md border-t border-outline-variant/20">
                    <span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        verified
                      </span>
                      Role-specific keyword optimization
                    </span>
                    <span className="material-symbols-outlined text-primary-container group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>

                {/* pillar 4: voice interviews */}
                <div className="lg:col-span-7 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-xl shadow-md flex flex-col justify-between group hover:bg-surface-container transition-all border border-outline-variant/20">
                  <div>
                    <div className="flex items-center justify-between mb-space-base">
                      <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container shadow-[0_0_16px_rgba(192,193,255,0.3)]">
                        <span className="material-symbols-outlined text-[28px]">
                          record_voice_over
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold uppercase px-space-sm py-1 rounded-full bg-primary-container/10 text-primary-container font-mono">
                        Engine 04
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                      Voice Mock Interviews &amp; Monaco IDE
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                      Natural bidirectional voice synthesis with real-time
                      speech-to-code feedback, dynamic edge test generation via
                      Judge0, and conversational behavioral pacing metrics.
                    </p>

                    {/* ide preview */}
                    <div className="mt-space-lg rounded-xl bg-surface-container-lowest/90 overflow-hidden shadow-inner font-mono text-xs border border-outline-variant/20">
                      <div className="bg-surface-container px-space-base py-space-xs flex items-center justify-between text-on-surface-variant text-[11px] border-b border-outline-variant/20">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary" />
                          <span>solution.cpp — LRUCacheImpl</span>
                        </div>
                        <span className="text-secondary font-semibold">
                          Judge0: 24/24 Test Cases Passed
                        </span>
                      </div>
                      <div className="p-space-base text-on-surface-variant leading-relaxed">
                        <span className="text-primary-container">class</span>{" "}
                        <span className="text-secondary">LRUCache</span> &#123;
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-primary-container">
                          unordered_map
                        </span>
                        &lt;
                        <span className="text-primary-container">
                          int
                        </span>,{" "}
                        <span className="text-primary-container">list</span>
                        &lt;pair&lt;
                        <span className="text-primary-container">
                          int
                        </span>,{" "}
                        <span className="text-primary-container">int</span>
                        &gt;&gt;::iterator&gt; cacheMap;
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-primary-container">list</span>
                        &lt;pair&lt;
                        <span className="text-primary-container">
                          int
                        </span>,{" "}
                        <span className="text-primary-container">int</span>
                        &gt;&gt; dll;
                        <br />
                        &nbsp;&nbsp;
                        <span className="text-outline-variant">
                          {"// audio latency: 42ms, clarity: 98%"}
                        </span>
                        <br />
                        &#125;;
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-lg flex items-center justify-between pt-space-md border-t border-outline-variant/20">
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <span className="px-space-sm py-0.5 rounded-full bg-secondary/15 text-secondary text-label-sm font-semibold font-mono">
                        0ms Local STT
                      </span>
                      <span className="px-space-sm py-0.5 rounded-full bg-primary-container/15 text-primary-container text-label-sm font-semibold font-mono">
                        System Design &amp; DSA Modes
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-primary-container group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* readiness calculator */}
          <section
            className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-3xl w-full scroll-mt-24"
            id="interactive-telemetry"
          >
            <div className="rounded-3xl bg-surface-container/90 backdrop-blur-2xl p-space-xl lg:p-space-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden border border-outline-variant/20">
              {/* top glow line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-secondary" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center">
                {/* simulator inputs */}
                <div className="lg:col-span-7 space-y-space-xl">
                  <div>
                    <span className="font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider font-mono">
                      Interactive Telemetry Sandbox
                    </span>
                    <h2 className="font-display-lg text-headline-lg lg:text-display-lg text-on-surface font-semibold mt-space-xs">
                      Simulate Your Hiring Readiness Index
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                      Adjust your profile vectors below to calculate your
                      estimated FAANG offer probability and recommended
                      compensation level in real-time.
                    </p>
                  </div>

                  {/* interactive sliders */}
                  <div className="space-y-space-lg">
                    {/* slider: github commits */}
                    <div>
                      <div className="flex justify-between items-center mb-space-xs">
                        <label
                          htmlFor="calc-commits"
                          className="font-title-md text-title-md text-on-surface font-medium flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            rebase
                          </span>
                          Annual GitHub Commits &amp; Merges
                        </label>
                        <span
                          className="font-mono font-semibold text-primary-container text-title-md"
                          id="calc-commits-val"
                        >
                          {commits.toLocaleString()} commits
                        </span>
                      </div>
                      <input
                        id="calc-commits"
                        type="range"
                        min="50"
                        max="2500"
                        step="10"
                        value={commits}
                        onChange={(e) => setCommits(Number(e.target.value))}
                        className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary-container focus:outline-none"
                      />
                      <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1 font-mono">
                        <span>50 (Casual)</span>
                        <span>800 (Senior)</span>
                        <span>2,500+ (Staff Contributor)</span>
                      </div>
                    </div>

                    {/* slider: leetcode */}
                    <div>
                      <div className="flex justify-between items-center mb-space-xs">
                        <label
                          htmlFor="calc-leetcode"
                          className="font-title-md text-title-md text-on-surface font-medium flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            terminal
                          </span>
                          Algorithms Solved (Medium &amp; Hard)
                        </label>
                        <span
                          className="font-mono font-semibold text-secondary text-title-md"
                          id="calc-leetcode-val"
                        >
                          {leetcodeSolved.toLocaleString()} solved
                        </span>
                      </div>
                      <input
                        id="calc-leetcode"
                        type="range"
                        min="20"
                        max="750"
                        step="5"
                        value={leetcodeSolved}
                        onChange={(e) =>
                          setLeetcodeSolved(Number(e.target.value))
                        }
                        className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-secondary focus:outline-none"
                      />
                      <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1 font-mono">
                        <span>20 (Beginner)</span>
                        <span>250 (Interview Ready)</span>
                        <span>750+ (Contest Master)</span>
                      </div>
                    </div>

                    {/* slider: resume ats */}
                    <div>
                      <div className="flex justify-between items-center mb-space-xs">
                        <label
                          htmlFor="calc-ats"
                          className="font-title-md text-title-md text-on-surface font-medium flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-tertiary-container text-[20px]">
                            description
                          </span>
                          Resume ATS Impact Rating
                        </label>
                        <span
                          className="font-mono font-semibold text-tertiary-container text-title-md"
                          id="calc-ats-val"
                        >
                          {atsScore}% Signal
                        </span>
                      </div>
                      <input
                        id="calc-ats"
                        type="range"
                        min="30"
                        max="100"
                        step="1"
                        value={atsScore}
                        onChange={(e) => setAtsScore(Number(e.target.value))}
                        className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-tertiary-container focus:outline-none"
                      />
                      <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1 font-mono">
                        <span>30% (Generic)</span>
                        <span>75% (Target Filter)</span>
                        <span>100% (X-Y-Z Calibrated)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* gauge output */}
                <div className="lg:col-span-5 rounded-2xl bg-surface-container-low/95 p-space-xl shadow-xl flex flex-col items-center text-center relative overflow-hidden border border-outline-variant/20">
                  <div className="w-full flex items-center justify-between pb-space-sm border-b border-surface-variant/30">
                    <span className="font-label-sm font-label-sm text-outline uppercase font-mono">
                      Dynamic Evaluation Engine
                    </span>
                    <span
                      className={`font-mono text-label-sm font-bold ${tierColor}`}
                      id="readiness-tier"
                    >
                      {tier}
                    </span>
                  </div>

                  {/* central score */}
                  <div className="my-space-xl flex flex-col items-center">
                    <div className="relative flex items-center justify-center w-full">
                      <svg
                        className="w-52 h-52 max-w-full aspect-square transform -rotate-90 flex-shrink-0"
                        viewBox="0 0 120 120"
                      >
                        <circle
                          className="text-surface-variant/60"
                          cx="60"
                          cy="60"
                          fill="transparent"
                          r="52"
                          stroke="currentColor"
                          strokeWidth="8"
                        />
                        <circle
                          className="text-secondary"
                          cx="60"
                          cy="60"
                          fill="transparent"
                          id="calc-ring"
                          r="52"
                          stroke="currentColor"
                          strokeDasharray="326"
                          strokeDashoffset={ringOffset}
                          strokeLinecap="round"
                          strokeWidth="8"
                          style={{
                            filter:
                              "drop-shadow(0 0 14px rgba(107, 222, 128, 0.6))",
                            transition: "stroke-dashoffset 300ms ease-out",
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className="font-display-lg text-[56px] font-bold text-on-surface tracking-tighter leading-none"
                          id="calc-total-score"
                        >
                          {compositeScore}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline font-mono uppercase mt-1">
                          Readiness Index
                        </span>
                      </div>
                    </div>

                    <div className="mt-space-md space-y-1">
                      <div
                        className="text-headline-sm font-headline-sm font-semibold text-secondary"
                        id="calc-prob-text"
                      >
                        {probability}
                      </div>
                      <p
                        className="text-body-sm font-body-sm text-on-surface-variant"
                        id="calc-rec-text"
                      >
                        {compRange}
                      </p>
                    </div>
                  </div>

                  {/* dynamic checklist */}
                  <div className="w-full bg-surface-container-high/60 rounded-xl p-space-md text-left space-y-space-xs text-body-sm font-body-sm border border-outline-variant/20">
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        check_circle
                      </span>
                      <span id="check-leetcode">{checks.leet}</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        check_circle
                      </span>
                      <span id="check-github">{checks.git}</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">
                        info
                      </span>
                      <span id="check-ats">{checks.ats}</span>
                    </div>
                  </div>

                  {/* mini cta */}
                  <Link
                    href="/signup"
                    className="mt-space-lg w-full py-space-sm rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary font-title-md font-semibold text-center transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)] block"
                  >
                    Run Full Account Diagnostic Free →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* testimonials */}
          <section className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-3xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider font-semibold text-secondary font-mono">
                  Engineering Outcomes
                </span>
                <h2 className="font-display-lg text-headline-lg md:text-display-lg font-semibold text-on-surface mt-space-2xs">
                  Engineers Calibrated. Offers Landed.
                </h2>
              </div>
              <p className="text-body-md font-body-md text-on-surface-variant max-w-md">
                DevMetric candidates consistently jump senior tiers by isolating
                exact weaknesses in their codebase and interview delivery.
              </p>
            </div>

            {/* testimonial grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              {/* card 1 */}
              <div className="rounded-2xl bg-surface-container/80 backdrop-blur-xl p-space-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-high transition-all border border-outline-variant/20">
                <div>
                  <div className="flex items-center justify-between pb-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary/15 text-secondary text-label-sm font-semibold font-mono">
                      +$140k TC Jump
                    </span>
                    <span className="font-mono text-label-sm text-outline-variant font-semibold">
                      L5 SWE • Stripe
                    </span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant italic leading-relaxed">
                    &ldquo;The voice telemetry co-pilot pinpointed my exact
                    communication flaw: I was over-explaining trivial helper
                    code while rushing high-level distributed lock tradeoffs.
                    Correcting that landed my L5 offer at Stripe.&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-space-md pt-space-lg mt-space-md border-t border-surface-variant/40">
                  <div className="w-11 h-11 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-title-md font-bold">
                    MS
                  </div>
                  <div>
                    <div className="font-title-md text-title-md font-semibold text-on-surface">
                      Marcus Sterling
                    </div>
                    <div className="text-label-sm font-label-sm text-outline">
                      Ex-Mid Tier Agency → Stripe Core Infra
                    </div>
                  </div>
                </div>
              </div>

              {/* card 2 */}
              <div className="rounded-2xl bg-surface-container/80 backdrop-blur-xl p-space-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-high transition-all border border-outline-variant/20">
                <div>
                  <div className="flex items-center justify-between pb-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary/15 text-secondary text-label-sm font-semibold font-mono">
                      +$185k TC Jump
                    </span>
                    <span className="font-mono text-label-sm text-outline-variant font-semibold">
                      E6 Staff SWE • Meta
                    </span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant italic leading-relaxed">
                    &ldquo;My GitHub analysis identified that while my
                    microservice code was clean, my commit sizing and
                    concurrency patterns lacked Staff-level traceability.
                    DevMetric’s automated PR coach elevated my entire portfolio
                    in 4 weeks.&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-space-md pt-space-lg mt-space-md border-t border-surface-variant/40">
                  <div className="w-11 h-11 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-title-md font-bold">
                    PY
                  </div>
                  <div>
                    <div className="font-title-md text-title-md font-semibold text-on-surface">
                      Priya Yamamura
                    </div>
                    <div className="text-label-sm font-label-sm text-outline">
                      Senior SWE → Meta Infrastructure E6
                    </div>
                  </div>
                </div>
              </div>

              {/* card 3 */}
              <div className="rounded-2xl bg-surface-container/80 backdrop-blur-xl p-space-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-high transition-all border border-outline-variant/20">
                <div>
                  <div className="flex items-center justify-between pb-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary/15 text-secondary text-label-sm font-semibold font-mono">
                      +$125k TC Jump
                    </span>
                    <span className="font-mono text-label-sm text-outline-variant font-semibold">
                      L5 • Google Cloud
                    </span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant italic leading-relaxed">
                    &ldquo;The resume ATS scanner was the turning point. It
                    rewrote my passive accomplishments into hard Google X-Y-Z
                    telemetry metrics. Recruiter callbacks jumped from 10% to
                    over 65% across FAANG within 8 days.&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-space-md pt-space-lg mt-space-md border-t border-surface-variant/40">
                  <div className="w-11 h-11 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary-container font-title-md font-bold">
                    DL
                  </div>
                  <div>
                    <div className="font-title-md text-title-md font-semibold text-on-surface">
                      David Lin
                    </div>
                    <div className="text-label-sm font-label-sm text-outline">
                      Fintech Backend → Google Cloud Distributed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* pre-footer cta */}
          <section className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-xl pb-space-2xl w-full">
            <div className="rounded-3xl bg-gradient-to-b from-surface-container to-surface-container-low p-space-xl lg:p-space-3xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] relative overflow-hidden text-center max-w-5xl mx-auto border border-outline-variant/20">
              {/* radial glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary-container/15 blur-3xl pointer-events-none rounded-full" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-widest bg-secondary/10 px-space-md py-1 rounded-full font-mono">
                  Autonomous Career Acceleration
                </span>
                <h2 className="font-display-lg text-headline-lg lg:text-display-lg font-bold text-on-surface mt-space-sm tracking-tight">
                  Bridge the Gap Between Candidate and Staff Engineer.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-sm">
                  Connect your GitHub or LeetCode in seconds. Get an immediate
                  diagnostic readout and your tailored readiness roadmap today.
                </p>

                {/* email signup form */}
                <form
                  onSubmit={handleQuickEmailSubmit}
                  className="mt-space-xl flex flex-col sm:flex-row items-center gap-space-xs max-w-lg mx-auto bg-surface-container-lowest/90 p-1.5 rounded-full shadow-lg border border-outline-variant/30"
                >
                  <div className="flex items-center gap-space-xs px-space-md w-full">
                    <span className="material-symbols-outlined text-outline text-[20px]">
                      mail
                    </span>
                    <input
                      className="bg-transparent border-none text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none w-full py-2"
                      placeholder="name@company.com or GitHub email"
                      required
                      type="email"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                    />
                  </div>
                  <button
                    className="w-full sm:w-auto flex-shrink-0 px-space-xl py-space-sm rounded-full bg-primary-container text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(192,193,255,0.4)] cursor-pointer"
                    type="submit"
                  >
                    Start Free
                  </button>
                </form>

                {/* oauth alternatives */}
                <div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-md">
                  <span className="text-label-sm font-label-sm text-outline font-mono">
                    Or instant connect via
                  </span>
                  <Link
                    href="/login"
                    className="px-space-md py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center gap-2 transition-all border border-outline-variant/20"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      terminal
                    </span>
                    <span>GitHub OAuth</span>
                  </Link>
                  <Link
                    href="/login"
                    className="px-space-md py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center gap-2 transition-all border border-outline-variant/20"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary-container">
                      code
                    </span>
                    <span>LeetCode Sync</span>
                  </Link>
                </div>

                <div className="mt-space-md text-label-sm font-label-sm text-outline font-mono">
                  No credit card required • Free forever tier available • SOC2
                  Type II Certified
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* footer */}
      <footer className="w-full bg-surface-container-lowest mt-space-3xl border-t border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-3xl flex flex-col md:flex-row items-center justify-between gap-space-lg text-on-surface-variant text-body-sm font-body-sm">
          <div className="flex items-center gap-space-sm">
            <DevMetricLogo size={24} className="opacity-90" />
            <span className="font-title-md text-title-md text-on-surface font-semibold">
              DevMetric
            </span>
            <span className="text-outline">
              © 2025 DevMetric Inc. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-space-lg font-mono text-body-sm">
            <Link className="hover:text-on-surface transition-colors" href="#">
              Privacy
            </Link>
            <Link className="hover:text-on-surface transition-colors" href="#">
              Terms
            </Link>
            <Link className="hover:text-on-surface transition-colors" href="#">
              Telemetry
            </Link>
            <Link className="hover:text-on-surface transition-colors" href="#">
              Enterprise
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
