"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

// wizard steps
export type OnboardingStep =
  | "CONNECT_GITHUB"
  | "SET_LEETCODE"
  | "UPLOAD_RESUME"
  | "COMPLETE";

const STEPS: { key: OnboardingStep; label: string; index: number }[] = [
  { key: "CONNECT_GITHUB", label: "Connect GitHub", index: 0 },
  { key: "SET_LEETCODE", label: "Set LeetCode Username", index: 1 },
  { key: "UPLOAD_RESUME", label: "Upload Resume", index: 2 },
];

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "GitHub connection was cancelled or access was denied.",
  OAuthCallback: "Failed to connect GitHub account. Please try again.",
  Default: "An error occurred while connecting your account.",
};

// persist step to db
async function saveStep(step: OnboardingStep, completed: boolean) {
  try {
    await fetch("/api/v1/user/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, completed }),
    });
  } catch (err) {
    console.error("Failed to save onboarding step:", err);
  }
}

interface Props {
  initialStep: OnboardingStep;
  githubConnected: boolean;
}

export function OnboardingWizard({ initialStep, githubConnected }: Props) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const urlError = searchParams?.get("error");
  const errorMessage = urlError
    ? (ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.Default)
    : actionError;

  const currentIndex = STEPS.find((s) => s.key === currentStep)?.index ?? 0;

  function advance(next: OnboardingStep, isLast = false) {
    setActionError(null);
    startTransition(async () => {
      await saveStep(next, isLast);
      if (isLast) {
        window.location.href = "/dashboard";
        return;
      }
      setCurrentStep(next);
    });
  }

  function handleConnectGitHub() {
    setActionError(null);
    try {
      signIn("github", { callbackUrl: "/onboarding" });
    } catch {
      setActionError("Failed to initiate GitHub authentication.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-lg">
        {/* header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Set up your profile
          </h1>
          <p className="text-slate-400 text-sm">
            Step {currentIndex + 1} of {STEPS.length}
          </p>
        </div>

        {/* progress indicator */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s.index <= currentIndex ? "bg-indigo-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* card */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* error banner */}
          {errorMessage && (
            <div
              id="onboarding-error-banner"
              role="alert"
              className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm flex items-start gap-2"
            >
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* step 1: github */}
          {currentStep === "CONNECT_GITHUB" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">
                  🐙
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Connect GitHub
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Seed your profile with public activity
                  </p>
                </div>
              </div>

              {githubConnected ? (
                <div
                  id="github-connected-badge"
                  className="flex items-center gap-3 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3"
                >
                  <span className="font-bold">✓</span>
                  <span className="text-sm font-medium">
                    GitHub connected successfully
                  </span>
                </div>
              ) : (
                <p className="text-slate-300 text-sm leading-relaxed">
                  We analyze your public repositories, commit frequency, and language
                  distribution to calculate your GitHub score. Private repositories
                  are never accessed.
                </p>
              )}

              <button
                id="onboarding-connect-github-btn"
                disabled={githubConnected || isPending}
                onClick={handleConnectGitHub}
                className="w-full py-3 px-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 active:scale-[0.99] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🐙</span>
                {githubConnected ? "Connected" : "Connect with GitHub"}
              </button>

              {githubConnected ? (
                <button
                  id="onboarding-step1-next-btn"
                  disabled={isPending}
                  onClick={() => advance("SET_LEETCODE")}
                  className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 active:scale-[0.99] transition duration-200 disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Continue →"}
                </button>
              ) : (
                <button
                  id="onboarding-step1-skip-btn"
                  disabled={isPending}
                  onClick={() => advance("SET_LEETCODE")}
                  className="w-full py-2.5 px-4 text-slate-400 hover:text-slate-200 text-sm font-medium text-center transition"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}

          {/* step 2: leetcode */}
          {currentStep === "SET_LEETCODE" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                  💡
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    LeetCode Username
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Import your problem-solving metrics (UI Stub)
                  </p>
                </div>
              </div>

              <input
                id="onboarding-leetcode-username-input"
                type="text"
                placeholder="e.g. tour_de_code"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />

              <p className="text-slate-500 text-xs">
                Stage 2 stub: LeetCode profile validation will be activated in later stages.
              </p>

              <div className="flex gap-3">
                <button
                  id="onboarding-step2-skip-btn"
                  disabled={isPending}
                  onClick={() => advance("UPLOAD_RESUME")}
                  className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 font-medium rounded-xl hover:bg-slate-700/50 transition duration-200 disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  id="onboarding-step2-next-btn"
                  disabled={isPending}
                  onClick={() => advance("UPLOAD_RESUME")}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition duration-200 disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* step 3: resume */}
          {currentStep === "UPLOAD_RESUME" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-2xl">
                  📄
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Add Resume
                  </h2>
                  <p className="text-slate-400 text-sm">PDF format · Max 5MB (UI Stub)</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-600 hover:border-indigo-500/50 rounded-xl p-8 text-center text-slate-400 text-sm transition">
                <p className="text-2xl mb-2">📤</p>
                <p className="font-medium text-slate-300">Drag & drop your resume PDF here</p>
                <p className="text-xs text-slate-500 mt-1">Stage 2 stub: Full resume parsing in later stages</p>
              </div>

              <div className="flex gap-3">
                <button
                  id="onboarding-step3-skip-btn"
                  disabled={isPending}
                  onClick={() => advance("COMPLETE", true)}
                  className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 font-medium rounded-xl hover:bg-slate-700/50 transition duration-200 disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  id="onboarding-step3-finish-btn"
                  disabled={isPending}
                  onClick={() => advance("COMPLETE", true)}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition duration-200 disabled:opacity-50"
                >
                  {isPending ? "Finishing…" : "Go to Dashboard →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
