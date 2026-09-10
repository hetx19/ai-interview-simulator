"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PaymentCheckoutPage() {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [paymentProtocol, setPaymentProtocol] = useState<"card" | "sponsors" | "crypto">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Pricing values matching Stitch specification
  const isAnnual = billingCycle === "annual";
  const basePrice = isAnnual ? 360 : 375;
  const discount = isAnnual ? 60 : 0;
  const totalPrice = isAnnual ? 300 : 375;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isAuthorized) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsAuthorized(true);
    }, 1400);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#13131b] text-[#e4e1ed] font-sans">
      <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-hidden">
        {/* Dynamic Glow Ambience */}
        <div
          className="absolute -top-32 -left-20 w-96 h-96 bg-[#c0c1ff]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 -right-24 w-80 h-80 bg-[#6bde80]/5 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Page Context Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#46464f]/20">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#918f9a]">
            <span className="text-[#c7c5d0]">DevMetric</span>
            <span className="material-symbols-outlined text-sm text-[#918f9a]">chevron_right</span>
            <span className="text-[#c7c5d0]">Telemetry Suite</span>
            <span className="material-symbols-outlined text-sm text-[#918f9a]">chevron_right</span>
            <span className="text-[#e1dfff] font-medium">Billing &amp; Checkout</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292932]/90 border border-[#46464f]/30 shadow-sm">
              <span className="material-symbols-outlined text-[#6bde80] text-sm">lock</span>
              <span className="text-[10px] leading-[14px] font-semibold text-[#6bde80] tracking-wider uppercase font-mono">
                256-Bit TLS Encrypted
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c0c1ff]/15 border border-[#c0c1ff]/30 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff] shadow-[0_0_8px_rgba(192,193,255,0.8)]" />
              <span className="text-[10px] leading-[14px] font-semibold text-[#e1dfff] uppercase tracking-wider font-mono">
                Tier: L5-L7+ FAANG
              </span>
            </div>
          </div>
        </div>

        {/* Title & Narrative Block */}
        <div className="max-w-3xl my-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1b23] border border-[#46464f]/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#c0c1ff] shadow-[0_0_6px_rgba(192,193,255,0.6)]" />
            <span className="text-[10px] leading-[14px] font-semibold text-[#e1dfff] uppercase tracking-widest font-mono">
              Instant Telemetry Activation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#e4e1ed] tracking-tight mb-2 font-sora">
            Upgrade to DevMetric Pro Telemetry
          </h1>
          <p className="text-sm sm:text-base text-[#c7c5d0] leading-relaxed">
            Unlock continuous GitHub repo indexing, unlimited AI Voice Mock interviews, and automated ATS resume token rewrites tuned for top engineering bars.
          </p>
        </div>

        {/* Billing Interval Selector */}
        <div className="flex items-center justify-start mb-8">
          <div className="bg-[#0d0d15] p-1 rounded-xl border border-[#46464f]/30 flex items-center shadow-md">
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-[#292932] text-[#e1dfff] shadow-[0_0_20px_rgba(192,193,255,0.15)] border border-[#c0c1ff]/30"
                  : "text-[#c7c5d0] hover:text-[#e4e1ed]"
              }`}
            >
              <span>Annual Cycle</span>
              <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] font-bold uppercase tracking-wide">
                Save 20%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-[#292932] text-[#e1dfff] shadow-[0_0_20px_rgba(192,193,255,0.15)] border border-[#c0c1ff]/30"
                  : "text-[#c7c5d0] hover:text-[#e4e1ed]"
              }`}
            >
              <span>Monthly Cycle</span>
              <span className="text-[11px] text-[#918f9a] font-normal">₹375 / mo</span>
            </button>
          </div>
        </div>

        {/* Active Plan Detected Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-xl bg-[#1f1f27]/90 border border-[#6bde80]/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#6bde80]/15 border border-[#6bde80]/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#6bde80] text-xl">verified_user</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#6bde80] uppercase tracking-wider font-mono">
                  Active Plan Detected
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#34343d] text-[#c7c5d0] text-[10px]">
                  DevMetric Standard (Valid thru Dec 2025)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#c7c5d0] mt-0.5">
                Subscribing now will instantly upgrade your telemetry tier. Unused balance will be prorated automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#34343d] hover:bg-[#393841] text-[#e1dfff] text-xs font-medium transition-all"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Manage Current Plan</span>
            </button>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1 text-[#918f9a] hover:text-[#e1dfff] text-xs transition-colors"
            >
              <span>Billing Portal</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* 12-Column Checkout Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Payment Method & Input Vector (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Payment Instrument Card */}
            <div className="bg-[#1b1b23]/90 backdrop-blur-xl border border-[#46464f]/30 rounded-xl p-5 sm:p-7 shadow-xl flex flex-col gap-6">
              {/* Tabbed Instrument Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#918f9a] uppercase tracking-wider font-mono">
                  Select Payment Protocol
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#0d0d15] border border-[#46464f]/30 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPaymentProtocol("card")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                      paymentProtocol === "card"
                        ? "bg-[#1f1f27] text-[#e1dfff] border border-[#c0c1ff]/30 shadow-sm"
                        : "text-[#c7c5d0] hover:text-[#e4e1ed]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">credit_card</span>
                    <span className="truncate">Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentProtocol("sponsors")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-all opacity-70 ${
                      paymentProtocol === "sponsors"
                        ? "bg-[#1f1f27] text-[#e1dfff] border border-[#c0c1ff]/30 shadow-sm"
                        : "text-[#c7c5d0] hover:text-[#e4e1ed]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">hub</span>
                    <span className="truncate">Sponsors</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentProtocol("crypto")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-all opacity-70 ${
                      paymentProtocol === "crypto"
                        ? "bg-[#1f1f27] text-[#e1dfff] border border-[#c0c1ff]/30 shadow-sm"
                        : "text-[#c7c5d0] hover:text-[#e4e1ed]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">currency_bitcoin</span>
                    <span className="truncate">USDC / SOL</span>
                  </button>
                </div>
              </div>

              {/* Card Input Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Cardholder Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#c7c5d0] flex items-center justify-between">
                    <span>Cardholder Name</span>
                    <span className="text-[#918f9a] text-[11px]">Matches legal account ID</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="Alex Mercer"
                      required
                      placeholder="First Last"
                      className="w-full bg-[#0d0d15] text-[#e4e1ed] text-sm rounded-lg px-3.5 py-2.5 outline-none border border-[#46464f]/30 focus:border-[#c0c1ff] transition-all"
                    />
                    <span className="material-symbols-outlined text-[#918f9a] absolute right-3 top-2.5 text-lg pointer-events-none">
                      verified_user
                    </span>
                  </div>
                </div>

                {/* Card Number */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#c7c5d0] flex items-center justify-between">
                    <span>Card Number</span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#34343d] text-[#c0c1ff] text-[10px] font-bold font-mono">
                        VISA
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#34343d] text-[#c7c5d0] text-[10px] font-mono">
                        MC
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#34343d] text-[#c7c5d0] text-[10px] font-mono">
                        AMEX
                      </span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 9012"
                      required
                      placeholder="4242 0000 0000 0000"
                      className="w-full bg-[#0d0d15] text-[#e4e1ed] text-sm font-mono rounded-lg pl-3.5 pr-10 py-2.5 outline-none border border-[#46464f]/30 focus:border-[#c0c1ff] transition-all"
                    />
                    <div className="absolute right-3 top-2.5 flex items-center text-[#6bde80] pointer-events-none">
                      <span className="material-symbols-outlined text-base">lock</span>
                    </div>
                  </div>
                </div>

                {/* Expiry & CVC Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#c7c5d0]">Expiration Date</label>
                    <input
                      type="text"
                      defaultValue="09 / 28"
                      required
                      placeholder="MM / YY"
                      className="w-full bg-[#0d0d15] text-[#e4e1ed] text-sm font-mono rounded-lg px-3.5 py-2.5 outline-none border border-[#46464f]/30 focus:border-[#c0c1ff] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#c7c5d0] flex items-center justify-between">
                      <span>Security CVC</span>
                      <span className="text-[#918f9a] text-[10px]">3 digits</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        defaultValue="842"
                        maxLength={4}
                        required
                        placeholder="•••"
                        className="w-full bg-[#0d0d15] text-[#e4e1ed] text-sm font-mono tracking-widest rounded-lg px-3.5 py-2.5 outline-none border border-[#46464f]/30 focus:border-[#c0c1ff] transition-all"
                      />
                      <span className="material-symbols-outlined text-[#918f9a] absolute right-3 top-2.5 text-base pointer-events-none">
                        help_outline
                      </span>
                    </div>
                  </div>
                </div>

                {/* Country & Zip Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#c7c5d0]">Country</label>
                    <div className="relative">
                      <select
                        defaultValue="US"
                        className="w-full bg-[#0d0d15] text-[#e4e1ed] text-sm rounded-lg px-3.5 py-2.5 outline-none border border-[#46464f]/30 appearance-none focus:border-[#c0c1ff] transition-all"
                      >
                        <option value="US">United States (US)</option>
                        <option value="IN">India (IN)</option>
                        <option value="CA">Canada (CA)</option>
                        <option value="UK">United Kingdom (UK)</option>
                        <option value="DE">Germany (DE)</option>
                        <option value="SG">Singapore (SG)</option>
                      </select>
                      <span className="material-symbols-outlined text-[#918f9a] pointer-events-none absolute right-3 top-2.5 text-lg">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#c7c5d0]">Zip / Postal Code</label>
                    <input
                      type="text"
                      defaultValue="94107"
                      required
                      placeholder="ZIP code"
                      className="w-full bg-[#0d0d15] text-[#e4e1ed] text-sm font-mono rounded-lg px-3.5 py-2.5 outline-none border border-[#46464f]/30 focus:border-[#c0c1ff] transition-all"
                    />
                  </div>
                </div>

                {/* Auto-renew checkbox */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="auto-renew"
                    defaultChecked
                    className="mt-1 w-4 h-4 rounded bg-[#0d0d15] text-[#c0c1ff] accent-[#c0c1ff] cursor-pointer"
                  />
                  <label htmlFor="auto-renew" className="text-xs text-[#c7c5d0] leading-relaxed cursor-pointer select-none">
                    Auto-renew telemetry cycle. Retain locked promotional rates and continuous model telemetry. Cancel anytime from Settings with zero penalties.
                  </label>
                </div>

                {/* Primary Submission Trigger */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isAuthorized}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(192,193,255,0.4)] transition-all active:scale-[0.99] ${
                      isAuthorized
                        ? "bg-[#6bde80] text-[#0d1f11]"
                        : "bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] hover:shadow-[0_0_32px_rgba(192,193,255,0.6)]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                        <span>Authorizing Handshake...</span>
                      </>
                    ) : isAuthorized ? (
                      <>
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        <span>Telemetry Matrix Activated!</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">bolt</span>
                        <span>
                          Authorize &amp; Subscribe — ₹{totalPrice}.00 / {isAnnual ? "mo" : "mo"}
                        </span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Compliance Ledger */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 bg-[#0d0d15]/60 border border-[#46464f]/20 p-3.5 rounded-lg">
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span className="material-symbols-outlined text-[#6bde80] text-base">verified</span>
                  <span className="text-[11px] font-semibold text-[#e4e1ed]">SOC-2 Type II</span>
                  <span className="text-[10px] text-[#918f9a]">Verified Audit</span>
                </div>
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-base">lock_clock</span>
                  <span className="text-[11px] font-semibold text-[#e4e1ed]">256-Bit TLS</span>
                  <span className="text-[10px] text-[#918f9a]">End-to-End</span>
                </div>
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span className="material-symbols-outlined text-[#ffdcba] text-base">security</span>
                  <span className="text-[11px] font-semibold text-[#e4e1ed]">Level 1 PCI-DSS</span>
                  <span className="text-[10px] text-[#918f9a]">Stripe Vault</span>
                </div>
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span className="material-symbols-outlined text-[#6bde80] text-base">published_with_changes</span>
                  <span className="text-[11px] font-semibold text-[#e4e1ed]">14-Day Full</span>
                  <span className="text-[10px] text-[#918f9a]">Risk-Free Return</span>
                </div>
              </div>
            </div>

            {/* Candidate Trust Banner with Mentor Proof */}
            <div className="bg-[#1f1f27]/60 border border-[#46464f]/30 backdrop-blur-md rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#292932] border border-[#c0c1ff]/30 flex items-center justify-center text-[#c0c1ff] shrink-0 font-bold font-sora">
                  DK
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[#ffb867] text-xs mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="material-symbols-outlined text-sm">star</span>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#e4e1ed] italic leading-snug">
                    &quot;DevMetric reduced my LeetCode prep loop by 70 hours. Secured Meta E6 within 45 days.&quot;
                  </p>
                  <span className="text-[11px] text-[#918f9a] mt-1">David K. — Principal Systems Architect</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Plan Matrix & Financial Ledger (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Order Summary Glass Card */}
            <div className="bg-[#1b1b23]/95 backdrop-blur-xl border border-[#46464f]/30 rounded-xl p-5 sm:p-7 shadow-xl flex flex-col gap-6">
              {/* Plan Header with Micro Glow Badge */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#46464f]/20">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#c0c1ff] tracking-wider uppercase font-semibold font-mono">
                    Tier Specification
                  </span>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#e4e1ed] font-sora">
                    DevMetric Pro Tier ({isAnnual ? "Annual" : "Monthly"})
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#c0c1ff]/20 text-[#e1dfff] text-[10px] font-bold tracking-wide uppercase shadow-[0_0_12px_rgba(192,193,255,0.25)] whitespace-nowrap shrink-0">
                  L5-L7+ TIER
                </span>
              </div>

              {/* Feature Entitlements Breakdown */}
              <div className="flex flex-col gap-3 py-3 bg-[#0d0d15]/60 border border-[#46464f]/20 rounded-xl p-4">
                <span className="text-[10px] text-[#918f9a] uppercase tracking-wider font-mono">
                  Active Entitlements Included
                </span>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#6bde80] text-lg mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e4e1ed]">
                      Continuous 52-Week GitHub Deep Static PR Analysis
                    </span>
                    <span className="text-[11px] text-[#918f9a]">
                      Unlimited private repositories and branch architecture tracking
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#6bde80] text-lg mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e4e1ed]">
                      Unlimited AI Voice Mock Interviews
                    </span>
                    <span className="text-[11px] text-[#918f9a]">
                      Judge0 Monaco execution engine sandbox &amp; real-time audio latency
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#6bde80] text-lg mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e4e1ed]">
                      Google X-Y-Z Resume ATS Optimizer
                    </span>
                    <span className="text-[11px] text-[#918f9a]">
                      Unlimited contextual scans and recruiter-matching keywords
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#6bde80] text-lg mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e4e1ed]">
                      Priority Discord Private Telemetry Node
                    </span>
                    <span className="text-[11px] text-[#918f9a]">
                      Direct synchronous office hours with FAANG Staff mentors
                    </span>
                  </div>
                </div>
              </div>

              {/* Line-Item Accounting Computation */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between text-xs sm:text-sm text-[#c7c5d0]">
                  <span>Base Pro License ({isAnnual ? "12 Months" : "1 Month"})</span>
                  <span className="font-mono text-[#e4e1ed]">₹{basePrice}.00</span>
                </div>
                {isAnnual && (
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#6bde80]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">savings</span>
                      <span>Annual Saver Discount (20%)</span>
                    </span>
                    <span className="font-mono">-₹{discount}.00</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs sm:text-sm text-[#c7c5d0]">
                  <span>Platform Taxes &amp; Compute Processing</span>
                  <span className="font-mono text-[#6bde80] font-medium">₹0.00</span>
                </div>

                {/* Ledger Total Divider */}
                <div className="my-2 h-px bg-[#46464f]/30" />

                <div className="flex items-baseline justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-semibold text-[#e4e1ed]">Total Due Today</span>
                    <span className="text-[11px] text-[#918f9a]">
                      {isAnnual ? "Renews annually at ₹300.00/mo (Prorated)" : "Renews monthly at ₹375.00/mo"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl sm:text-3xl font-bold text-[#e1dfff] font-sora tracking-tight">
                      ₹{totalPrice}.00
                    </span>
                    <span className="text-[10px] text-[#6bde80] font-mono">INR (₹) • Zero Surcharges</span>
                  </div>
                </div>
              </div>

              {/* Performance Guarantee SLA Badge */}
              <div className="bg-[#1f1f27] border border-[#46464f]/20 p-4 rounded-xl flex items-start gap-3 shadow-inner">
                <span className="material-symbols-outlined text-[#6bde80] text-xl mt-0.5">verified_user</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-[#e4e1ed]">Candidate Readiness Guarantee</span>
                  <p className="text-[11px] text-[#c7c5d0] leading-relaxed">
                    If DevMetric telemetry does not elevate your verified hiring readiness score by at least 15 points within 30 days of active training, receive an automated 100% refund.
                  </p>
                </div>
              </div>
            </div>

            {/* Telemetry Pipeline Diagnostic Mini-Card */}
            <div className="bg-[#0d0d15]/80 border border-[#46464f]/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1f1f27] flex items-center justify-center text-[#c0c1ff]">
                  <span className="material-symbols-outlined text-base">hub</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[#e4e1ed]">Model Deployment Matrix</span>
                  <span className="text-[10px] text-[#918f9a] font-mono">us-east-1 (N. Virginia Cluster 4)</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6bde80] animate-pulse" />
                <span className="text-[10px] text-[#6bde80] font-bold uppercase tracking-wider font-mono">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
