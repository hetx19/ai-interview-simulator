"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { DevMetricLogo } from "@/components/ui/DevMetricLogo";

type EngineeringLevel = "L4" | "L5" | "L6" | "EM";

const ENGINEERING_LEVELS: { id: EngineeringLevel; title: string; subtitle: string }[] = [
  { id: "L4", title: "Junior / Mid", subtitle: "L3 - L4" },
  { id: "L5", title: "Senior SWE", subtitle: "L5 Standard" },
  { id: "L6", title: "Staff / Principal", subtitle: "L6 - L7+" },
  { id: "EM", title: "Engineering Mgt", subtitle: "EM1 / EM2" },
];

const ECOSYSTEM_OPTIONS = [
  "Distributed Systems",
  "Frontend & Edge",
  "AI / ML Inference",
  "Cloud Infrastructure & SRE",
  "Data Platform / Spark",
];

function SignupContent() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<EngineeringLevel>("L5");
  const [selectedEcosystems, setSelectedEcosystems] = useState<string[]>([
    "Distributed Systems",
    "AI / ML Inference",
  ]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // password strength check
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let strengthScore = 0;
  if (password.length > 0) {
    if (hasLength) strengthScore += 1;
    if (hasNumber) strengthScore += 1;
    if (hasSymbol) strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
  }

  const getStrengthMeta = () => {
    if (password.length === 0) return { label: "Empty", color: "text-outline" };
    if (strengthScore <= 1) return { label: "Weak", color: "text-error" };
    if (strengthScore === 2) return { label: "Fair", color: "text-tertiary-container" };
    if (strengthScore === 3) return { label: "Good", color: "text-primary-container" };
    return { label: "Strong", color: "text-secondary" };
  };

  const strengthMeta = getStrengthMeta();

  const toggleEcosystem = (name: string) => {
    setSelectedEcosystems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill in all required account fields.");
      return;
    }

    if (!hasLength || !hasNumber || !hasSymbol) {
      setErrorMessage("Password must meet all 3 security requirements.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please acknowledge the Terms of Calibration and Privacy Benchmark.");
      return;
    }

    setIsLoading(true);

    try {
      // mock signup delay
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push("/onboarding");
    } catch {
      setErrorMessage("Error initializing diagnostic profile. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md min-h-screen relative flex items-center justify-center p-gutter-mobile lg:p-gutter-desktop selection:bg-primary-container selection:text-on-primary-container">
      {/* ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary-fixed-dim/10 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-secondary/5 blur-[120px] rounded-full" />
      </div>

      <main className="w-full relative z-10">
        <div className="flex flex-col w-full">
          <div className="mx-auto w-full max-w-[1240px] px-2 sm:px-4 py-6 md:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* left column: info */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
                <div className="space-y-6">
                  {/* logo */}
                  <Link href="/" className="inline-flex items-center space-x-3 group" aria-label="DevMetric home">
                    <DevMetricLogo size={40} className="w-10 h-10 rounded-lg shadow-md object-contain flex-shrink-0" />
                    <span className="font-headline-md text-headline-md tracking-tight text-primary-fixed font-bold group-hover:text-white transition-colors">
                      DevMetric
                    </span>
                  </Link>

                  {/* headline */}
                  <div className="space-y-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-container-low shadow-sm border border-outline-variant/30">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                        Calibrating Tier-1 Readiness
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-snug font-semibold">
                      Precision algorithmic analytics for elite tech careers.
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                      Join 45,000+ engineers indexing GitHub telemetry, system architecture
                      benchmarks, and FAANG-grade mock interview intelligence.
                    </p>
                  </div>

                  {/* telemetry card */}
                  <div className="rounded-xl bg-surface-container-lowest p-4 shadow-md space-y-3 border border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-error" />
                        <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-mono ml-2">
                          diagnostic_stream.eval
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded font-mono">
                        ONLINE
                      </span>
                    </div>
                    <div className="space-y-2 font-body-sm text-body-sm font-mono text-on-surface-variant">
                      <div className="flex justify-between items-center text-on-surface">
                        <span>[git] commit_vector_depth</span>
                        <span className="text-secondary font-semibold">98.4th %tile</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full w-[94%] shadow-[0_0_8px_#6bde80]" />
                      </div>
                      <div className="flex justify-between items-center text-on-surface pt-1">
                        <span>[sys] concurrency_primitives</span>
                        <span className="text-primary-fixed-dim font-semibold">L6 Calibrated</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-fixed-dim h-full rounded-full w-[88%] shadow-[0_0_8px_#c0c1ff]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* social proof */}
                <div className="p-4 rounded-xl bg-surface-container-low shadow-sm flex items-center space-x-3 border border-outline-variant/20">
                  <DevMetricLogo size={36} className="w-10 h-10 rounded-lg shadow-md object-contain flex-shrink-0" />
                  <div className="text-on-surface-variant font-body-sm text-body-sm">
                    Staff &amp; Principal engineers tracking velocity across Meta, Stripe, Databricks &amp; OpenAI.
                  </div>
                </div>
              </div>

              {/* right column: register card */}
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl bg-surface-container-low p-6 sm:p-8 shadow-2xl backdrop-blur-xl border border-outline-variant/20">
                  {/* card header */}
                  <div className="space-y-1 mb-6">
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                      Create your DevMetric Account
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Calibrate GitHub repositories, LeetCode metrics, and architectural mock readiness.
                    </p>
                  </div>

                  {/* oauth buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
                      className="group relative flex items-center justify-center space-x-3 py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-variant transition duration-150 shadow-md cursor-pointer border border-outline-variant/20"
                    >
                      <svg className="w-5 h-5 fill-current text-primary-fixed" viewBox="0 0 24 24">
                        <path
                          clipRule="evenodd"
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <div className="flex flex-col text-left">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          GitHub
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary font-mono">
                          repo-read diagnostic
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                      className="flex items-center justify-center space-x-3 py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-variant transition duration-150 shadow-md cursor-pointer border border-outline-variant/20"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                          fill="#EA4335"
                        />
                        <path
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
                          fill="#4285F4"
                        />
                        <path
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                          fill="#34A853"
                        />
                      </svg>
                      <span className="font-title-md text-title-md font-semibold text-on-surface">
                        Google Account
                      </span>
                    </button>
                  </div>

                  {/* divider */}
                  <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow bg-surface-container-highest h-[1px]" />
                    <span className="flex-shrink mx-4 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-mono">
                      or register with work email
                    </span>
                    <div className="flex-grow bg-surface-container-highest h-[1px]" />
                  </div>

                  {/* signup form */}
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* name input */}
                      <div className="space-y-1.5">
                        <label
                          className="font-label-md text-label-md text-on-surface font-medium"
                          htmlFor="full-name"
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            id="full-name"
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alex Chen"
                            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline rounded-lg px-3.5 py-2.5 font-body-md text-body-md focus:outline-none focus:bg-surface-container-high shadow-inner transition border border-outline-variant/20"
                          />
                        </div>
                      </div>
                      {/* email input */}
                      <div className="space-y-1.5">
                        <label
                          className="font-label-md text-label-md text-on-surface font-medium"
                          htmlFor="dev-email"
                        >
                          Developer Email
                        </label>
                        <div className="relative">
                          <input
                            id="dev-email"
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex@engineering.io"
                            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline rounded-lg px-3.5 py-2.5 font-body-md text-body-md focus:outline-none focus:bg-surface-container-high shadow-inner transition border border-outline-variant/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* password input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label
                          className="font-label-md text-label-md text-on-surface font-medium"
                          htmlFor="password-input"
                        >
                          Secure Password
                        </label>
                        <span className={`font-label-sm text-label-sm font-mono ${strengthMeta.color}`}>
                          {strengthMeta.label}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          id="password-input"
                          required
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8+ characters, symbol, and number"
                          className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline rounded-lg px-3.5 py-2.5 font-body-md text-body-md focus:outline-none focus:bg-surface-container-high shadow-inner transition border border-outline-variant/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>

                      {/* strength meter */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <div
                          className={`h-1 rounded-full transition-colors duration-300 ${
                            strengthScore >= 1 ? "bg-secondary shadow-[0_0_6px_#6bde80]" : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-1 rounded-full transition-colors duration-300 ${
                            strengthScore >= 2 ? "bg-secondary shadow-[0_0_6px_#6bde80]" : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-1 rounded-full transition-colors duration-300 ${
                            strengthScore >= 3 ? "bg-primary-container shadow-[0_0_6px_#c0c1ff]" : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-1 rounded-full transition-colors duration-300 ${
                            strengthScore >= 4 ? "bg-primary-container shadow-[0_0_6px_#c0c1ff]" : "bg-surface-container-highest"
                          }`}
                        />
                      </div>

                      <div className="flex items-center space-x-4 font-label-sm text-label-sm text-on-surface-variant font-mono">
                        <span className={`flex items-center ${hasLength ? "text-secondary" : "text-outline"}`}>
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            fiber_manual_record
                          </span>{" "}
                          8+ chars
                        </span>
                        <span className={`flex items-center ${hasNumber ? "text-secondary" : "text-outline"}`}>
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            fiber_manual_record
                          </span>{" "}
                          1+ number
                        </span>
                        <span className={`flex items-center ${hasSymbol ? "text-secondary" : "text-outline"}`}>
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            fiber_manual_record
                          </span>{" "}
                          1+ special char
                        </span>
                      </div>
                    </div>

                    {/* engineering level */}
                    <div className="space-y-1.5 pt-2">
                      <label className="font-label-md text-label-md text-on-surface font-medium flex justify-between">
                        <span>Target Engineering Level</span>
                        <span className="text-on-surface-variant font-normal">
                          Calibrates scoring baseline
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ENGINEERING_LEVELS.map((lvl) => {
                          const isActive = selectedLevel === lvl.id;
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => setSelectedLevel(lvl.id)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition text-center focus:outline-none cursor-pointer border ${
                                isActive
                                  ? "bg-primary-container text-on-primary-container ring-2 ring-primary border-transparent"
                                  : "bg-surface-container-high text-on-surface hover:bg-surface-variant border-outline-variant/20"
                              }`}
                            >
                              <span className="font-title-md text-title-md font-semibold">
                                {lvl.title}
                              </span>
                              <span
                                className={`font-label-sm text-label-sm font-mono ${
                                  isActive ? "text-on-primary-fixed-variant" : "text-on-surface-variant"
                                }`}
                              >
                                {lvl.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ecosystem chips */}
                    <div className="space-y-1.5 pt-1">
                      <label className="font-label-md text-label-md text-on-surface font-medium">
                        Primary Technical Ecosystems
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ECOSYSTEM_OPTIONS.map((eco) => {
                          const isSelected = selectedEcosystems.includes(eco);
                          return (
                            <button
                              key={eco}
                              type="button"
                              onClick={() => toggleEcosystem(eco)}
                              className={`px-3 py-1.5 rounded-full font-label-md text-label-md font-medium transition cursor-pointer flex items-center border ${
                                isSelected
                                  ? "bg-secondary/15 text-secondary border-secondary/30"
                                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant border-outline-variant/20"
                              }`}
                            >
                              {isSelected && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary mr-1.5" />
                              )}
                              {eco}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* terms checkbox */}
                    <div className="pt-2 flex items-start space-x-3">
                      <input
                        id="terms"
                        required
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded bg-surface-container-lowest text-primary-fixed-dim focus:ring-0 focus:outline-none accent-primary-fixed-dim border border-outline-variant/40"
                      />
                      <label
                        className="font-body-sm text-body-sm text-on-surface-variant leading-tight"
                        htmlFor="terms"
                      >
                        I agree to the{" "}
                        <a className="text-primary-fixed underline hover:text-primary" href="#">
                          Terms of Calibration
                        </a>{" "}
                        and acknowledge the{" "}
                        <a className="text-primary-fixed underline hover:text-primary" href="#">
                          Data Privacy Benchmark
                        </a>
                        .
                      </label>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-label-md flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* submit button */}
                    <button
                      className="w-full relative group overflow-hidden rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary font-title-md text-title-md font-bold py-3.5 px-6 transition duration-200 shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">
                            progress_activity
                          </span>
                          <span>Initializing Diagnostic Stream...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative z-10">
                            Create Free Account &amp; Start Diagnostic
                          </span>
                          <span className="material-symbols-outlined relative z-10 text-[20px] transition-transform group-hover:translate-x-1">
                            arrow_forward
                          </span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* card footer */}
                  <div className="mt-6 pt-4 bg-surface-container/50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 sm:px-8 py-4 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20">
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Already calibrated?
                      <Link
                        className="font-title-md text-title-md text-primary-fixed-dim font-semibold hover:underline ml-1"
                        href="/login"
                      >
                        Sign in to your workspace →
                      </Link>
                    </div>
                    <div className="flex items-center space-x-2 text-on-surface-variant font-label-sm text-label-sm font-mono">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        security
                      </span>
                      <span>SOC2 Type II Certified</span>
                    </div>
                  </div>
                </div>

                {/* privacy note */}
                <div className="mt-4 px-4 py-3 rounded-xl bg-surface-container-lowest/60 flex items-center space-x-3 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-outline text-[20px] flex-shrink-0">
                    lock
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    <strong className="text-on-surface font-medium">Privacy Commitment:</strong> We
                    never train public frontier models on your proprietary repository code or resume
                    telemetry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignupContent />
    </Suspense>
  );
}
