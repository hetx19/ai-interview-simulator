"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { DevMetricLogo } from "@/components/ui/DevMetricLogo";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Access was denied. You may have cancelled the authorization or the provider rejected the request.",
  OAuthCallback:
    "Failed to complete authentication with the provider. Please try signing in again.",
  OAuthSignin:
    "Error starting the OAuth sign-in flow. Please check your network and try again.",
  OAuthCreateAccount:
    "Could not create an account with the OAuth provider. Please try again or use another provider.",
  Callback: "Authentication callback failed. Please try signing in again.",
  EmailVerificationRequired:
    "Your email is unverified on that provider. Please verify your email with the provider and try again.",
  OAuthAccountNotLinked:
    "An account with this email already exists with a different provider. Please sign in with your original provider.",
  OAuthAccountLinkedToOtherUser:
    "This OAuth account is already linked to another user.",
  AccountDeleted:
    "This account has been deleted. Please contact support or sign up with a new account.",
  EmailRequired:
    "An email address is required from your OAuth provider to sign in.",
  Configuration:
    "A server configuration error occurred. Please try again later.",
  Default: "An authentication error occurred. Please try again.",
};

function LoginContent() {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errorMessage = formError
    ? formError
    : errorParam
    ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default)
    : null;

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setFormError(null);
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setLoadingProvider(null);
      setFormError("Failed to initiate OAuth sign in. Please try again.");
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Authentication failed.");
      }

      // Hard navigation ensures session cookies are recognized by middleware & server layout
      window.location.href = callbackUrl;
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || "An error occurred during authentication.");
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md min-h-screen relative flex items-center justify-center p-gutter-mobile lg:p-gutter-desktop selection:bg-primary-container selection:text-on-primary-container">
      {/* background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary-fixed-dim/10 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-secondary/5 blur-[120px] rounded-full" />
      </div>

      <main className="w-full relative z-10">
        <div className="flex flex-col w-full items-center justify-center py-6 sm:py-space-xl">
          <div className="w-full max-w-[440px] sm:max-w-[480px] relative">
            {/* backlight glow */}
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary-fixed-dim/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

            {/* login card */}
            <div className="relative bg-surface-container-low/90 backdrop-blur-xl rounded-xl p-5 sm:p-space-xl shadow-2xl shadow-surface-container-lowest/80 overflow-hidden border border-outline-variant/20">
              {/* top gradient */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary-fixed-dim/40 to-transparent" />

              {/* header */}
              <div className="flex flex-col items-center text-center mb-5 sm:mb-space-lg">
                <Link
                  href="/"
                  className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-lowest shadow-lg shadow-primary/10 mb-3 group transition-transform hover:scale-105"
                  aria-label="Back to home"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-fixed-dim/30 to-secondary/20 blur-sm group-hover:blur-md transition-all duration-300" />
                  <DevMetricLogo size={36} className="relative" />
                  {/* pulsating live badge */}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                  </span>
                </Link>

                <div className="flex items-center gap-space-xs mb-1">
                  <h1 className="font-headline-md text-title-md sm:text-headline-md text-on-surface tracking-tight font-semibold">
                    DevMetric
                  </h1>
                  <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed-dim/15 text-primary-fixed-dim font-label-sm text-[10px] sm:text-label-sm uppercase tracking-wider font-mono font-semibold">
                    Console v2.4
                  </span>
                </div>
                <h2 className="text-[22px] sm:text-[26px] font-semibold text-on-surface tracking-tight">
                  Welcome back
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mt-1">
                  Your engineering hiring readiness, quantified.
                </p>
              </div>

              {/* error banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-space-md p-space-sm rounded-lg bg-error-container/20 border border-error/40 text-error text-label-md flex items-start gap-space-sm shadow-sm animate-in fade-in duration-200"
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0 text-error">
                    warning
                  </span>
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* oauth 2.0 CTA buttons */}
              <div className="space-y-space-sm mb-4">
                {/* continue with github */}
                <button
                  id="login-github-btn"
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={() => handleOAuthSignIn("github")}
                  className="group relative w-full h-12 px-space-base rounded-lg bg-on-surface hover:bg-inverse-surface text-surface font-headline-sm text-label-md font-semibold flex items-center justify-between shadow-[0_0_16px_rgba(228,225,237,0.15)] transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-75"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    {loadingProvider === "github" ? (
                      <span className="material-symbols-outlined animate-spin text-[20px] shrink-0">
                        progress_activity
                      </span>
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="w-5 h-5 shrink-0 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                    )}
                    <span className="font-headline-sm text-title-md font-semibold truncate">
                      {loadingProvider === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}
                    </span>
                  </div>
                  <span className="ml-auto font-label-sm text-label-sm bg-surface-container-highest text-primary-container px-space-xs py-0.5 rounded-full font-medium">
                    Recommended
                  </span>
                </button>

                {/* continue with google */}
                <button
                  id="login-google-btn"
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={() => handleOAuthSignIn("google")}
                  className="w-full h-12 px-space-base rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-label-md font-medium flex items-center justify-center gap-space-sm transition-colors active:scale-[0.98] cursor-pointer border border-outline-variant/20 disabled:opacity-75"
                >
                  {loadingProvider === "google" ? (
                    <span className="material-symbols-outlined animate-spin text-[20px] shrink-0">
                      progress_activity
                    </span>
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                        fill="#EA4335"
                      />
                      <path
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
                        fill="#4285F4"
                      />
                      <path
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9c0-.7 0-1.4 0-4z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                        fill="#34A853"
                      />
                    </svg>
                  )}
                  <span className="font-label-md text-label-md sm:text-body-md font-medium">
                    {loadingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
                  </span>
                </button>
              </div>

              {/* divider */}
              <div className="relative flex items-center justify-center py-space-xs my-2">
                <div className="w-full h-[1px] bg-surface-container-highest" />
                <span className="absolute bg-surface-container-low px-space-sm font-label-sm text-[10px] sm:text-label-sm text-outline tracking-wider uppercase whitespace-nowrap">
                  Or sign in with developer credentials
                </span>
              </div>

              {/* credentials form */}
              <form className="space-y-3.5 w-full my-3" onSubmit={handleCredentialsSubmit}>
                {/* email field */}
                <div className="space-y-1">
                  <label className="block font-label-md text-[12px] text-on-surface-variant font-medium" htmlFor="dev-email">
                    Work / Developer Email
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
                      alternate_email
                    </span>
                    <input
                      id="dev-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.chen@engineering.io"
                      className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline/70 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-container transition-all border border-outline-variant/20"
                    />
                  </div>
                </div>

                {/* password field with show/hide */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-[12px] text-on-surface-variant font-medium" htmlFor="dev-password">
                      Master Password
                    </label>
                    <Link
                      href="#"
                      className="font-label-sm text-[11px] text-primary hover:text-primary-fixed transition-colors font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
                      lock_open
                    </span>
                    <input
                      id="dev-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline/70 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-container transition-all border border-outline-variant/20"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password view"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* remember session toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-container-lowest accent-[#c0c1ff] cursor-pointer"
                    />
                    <span className="text-[12px] text-on-surface-variant">Remember session (30d)</span>
                  </label>
                  <span className="text-[11px] text-secondary flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Vault Active
                  </span>
                </div>

                {/* primary credentials submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-[#c0c1ff] via-[#e1dfff] to-[#e1e0ff] text-[#131449] font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(192,193,255,0.35)] hover:shadow-[0_0_26px_rgba(192,193,255,0.5)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate &amp; Enter Console</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* signup link */}
              <div className="text-center pt-2">
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Don&apos;t have a telemetry profile?
                  <Link
                    href="/signup"
                    className="font-label-md text-primary hover:underline font-semibold ml-1.5"
                  >
                    Create account
                  </Link>
                </p>
              </div>

              {/* security badges & status footer */}
              <footer className="mt-5 pt-4 bg-surface-container-lowest/50 -mx-5 -mb-5 sm:-mx-space-xl sm:-mb-space-xl px-5 sm:px-space-xl pb-4 border-t border-outline-variant/20 flex flex-col items-center gap-2.5">
                <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high/60 backdrop-blur-sm text-on-surface-variant text-[10px] sm:text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[13px] text-secondary">verified_user</span>
                    <span>SOC-2 Type II</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high/60 backdrop-blur-sm text-on-surface-variant text-[10px] sm:text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[13px] text-primary">enhanced_encryption</span>
                    <span>256-Bit TLS Cipher</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high/60 backdrop-blur-sm text-on-surface-variant text-[10px] sm:text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[13px] text-tertiary">data_loss_prevention</span>
                    <span>Zero Retention</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-75">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <span className="text-[10px] text-outline tracking-wider font-mono">
                    us-east-1.devmetric.telemetry · 24ms latency
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
