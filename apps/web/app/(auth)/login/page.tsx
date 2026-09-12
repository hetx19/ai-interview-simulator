"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const errorMessage = errorParam
    ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default)
    : clientError;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);

    if (!email || !password) {
      setClientError("Please enter your developer email and password.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Validating handshake...");

    try {
      // mock session handshake
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatusMessage("Console Authorized");
      await new Promise((resolve) => setTimeout(resolve, 400));
      router.push(callbackUrl);
    } catch {
      setClientError("Failed to authenticate session. Please try again.");
      setIsLoading(false);
      setStatusMessage(null);
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
        <div className="flex flex-col w-full items-center justify-center py-space-xl">
          <div className="w-full max-w-[480px] relative">
            {/* backlight glow */}
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary-fixed-dim/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

            {/* login card */}
            <div className="relative bg-surface-container-low/90 backdrop-blur-xl rounded-xl p-space-lg sm:p-space-xl shadow-2xl shadow-surface-container-lowest/80 overflow-hidden border border-outline-variant/20">
              {/* top gradient */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary-fixed-dim/40 to-transparent" />

              {/* header */}
              <div className="flex flex-col items-center text-center mb-space-lg">
                <Link
                  href="/"
                  className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-lowest shadow-lg shadow-primary/10 mb-space-md group transition-transform hover:scale-105"
                  aria-label="Back to home"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-fixed-dim/30 to-secondary/20 blur-sm group-hover:blur-md transition-all duration-300" />
                  <DevMetricLogo size={36} className="relative" />
                </Link>

                <div className="flex items-center gap-space-xs mb-space-2xs">
                  <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
                    DevMetric
                  </h1>
                  <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed-dim/15 text-primary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider font-mono">
                    OS v2.4
                  </span>
                </div>
                <p className="font-title-md text-title-md text-on-surface-variant font-normal">
                  Welcome back to DevMetric Intelligence
                </p>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  Your engineering hiring readiness, quantified.
                </p>
              </div>

              {/* sso status */}
              <div
                className="mb-space-md p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20"
                id="auth-error-banner"
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="material-symbols-outlined text-secondary text-[18px] animate-pulse shrink-0">
                    bolt
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate font-mono">
                    Enterprise SSO and OAuth 2.0 Telemetry Active
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 shadow-[0_0_8px_#6bde80]" />
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

              {/* oauth buttons */}
              <div className="space-y-space-sm mb-space-lg">
                <button
                  id="login-github-btn"
                  type="button"
                  onClick={() => signIn("github", { callbackUrl })}
                  className="group relative w-full h-11 px-space-md rounded-lg bg-inverse-surface hover:bg-primary-fixed text-inverse-on-surface font-title-md text-title-md flex items-center justify-between transition-all duration-200 shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
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
                    <span className="font-headline-sm text-title-md font-semibold truncate">
                      Continue with GitHub
                    </span>
                  </div>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-medium tracking-tight whitespace-nowrap">
                    Recommended
                  </span>
                </button>

                <button
                  id="login-google-btn"
                  type="button"
                  onClick={() => signIn("google", { callbackUrl })}
                  className="w-full h-11 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md flex items-center justify-center gap-space-sm transition-all duration-200 active:scale-[0.99] shadow-sm cursor-pointer border border-outline-variant/20"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M12 5c1.54 0 2.9.56 3.96 1.48l2.96-2.96C17.1 1.84 14.73 1 12 1 7.37 1 3.44 3.78 1.63 7.79l3.65 2.83C6.16 7.6 8.84 5 12 5z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.69z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.28 10.62A6.97 6.97 0 014.9 8.5c0-.74.14-1.46.38-2.12L1.63 3.55A11.96 11.96 0 000 8.5c0 1.9.46 3.7 1.28 5.29l4-3.17z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.07.72-2.45 1.16-4.23 1.16-3.16 0-5.84-2.6-6.72-5.62l-3.65 2.83C3.44 20.22 7.37 23 12 23z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="font-label-md text-label-md sm:text-body-md font-medium">
                    Continue with Google
                  </span>
                </button>
              </div>

              {/* divider */}
              <div className="relative flex items-center justify-center my-space-lg">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[1px] bg-surface-variant" />
                </div>
                <span className="relative px-space-sm bg-surface-container-low font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                  or sign in with developer credentials
                </span>
              </div>

              {/* login form */}
              <form id="auth-login-form" onSubmit={handleSubmit} className="space-y-space-md">
                <div className="space-y-space-2xs">
                  <label
                    htmlFor="work-email"
                    className="block font-label-md text-label-md text-on-surface-variant font-medium"
                  >
                    Work / Developer Email
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-space-sm text-outline text-[20px] pointer-events-none">
                      alternate_email
                    </span>
                    <input
                      id="work-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@engineering.io"
                      className="w-full h-11 pl-10 pr-space-md rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/20"
                    />
                  </div>
                </div>

                <div className="space-y-space-2xs">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="account-password"
                      className="block font-label-md text-label-md text-on-surface-variant font-medium"
                    >
                      Password
                    </label>
                    <Link
                      href="#"
                      className="font-label-sm text-label-sm text-primary-fixed-dim hover:text-primary transition-colors font-medium font-mono"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-space-sm text-outline text-[20px] pointer-events-none">
                      lock
                    </span>
                    <input
                      id="account-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/20"
                    />
                    <button
                      id="toggle-pwd-btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-space-sm text-outline hover:text-on-surface transition-colors flex items-center justify-center p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-[18px]" id="toggle-pwd-icon">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-space-2xs">
                  <label className="flex items-center gap-space-sm cursor-pointer select-none">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded bg-surface-container-lowest peer-checked:bg-primary-fixed-dim flex items-center justify-center transition-colors border border-outline-variant/40">
                      <span className="material-symbols-outlined text-surface text-[14px] opacity-0 peer-checked:opacity-100 font-bold leading-none">
                        check
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Remember telemetry session
                    </span>
                  </label>
                  <span className="font-label-sm text-label-sm text-outline font-mono">
                    30 days token
                  </span>
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-space-sm rounded-lg bg-primary-fixed-dim hover:bg-primary text-on-primary-fixed font-title-md text-title-md font-semibold flex items-center justify-center gap-space-xs transition-all duration-200 shadow-[0_0_20px_rgba(192,193,255,0.3)] active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                      <span>{statusMessage ?? "Validating handshake..."}</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate &amp; Enter Console</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* signup link */}
              <div className="mt-space-lg text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Don&apos;t have a telemetry profile yet?
                  <Link
                    href="/signup"
                    className="text-primary-fixed-dim hover:text-primary font-medium underline underline-offset-4 ml-1"
                  >
                    Create account
                  </Link>
                </p>
              </div>

              {/* security badges & footer */}
              <div className="mt-space-xl pt-space-md bg-surface-container-lowest/50 -mx-space-lg -mb-space-lg sm:-mx-space-xl sm:-mb-space-xl px-space-lg sm:px-space-xl pb-space-md border-t border-outline-variant/20">
                <div className="flex flex-wrap items-center justify-center gap-y-space-xs gap-x-space-md text-outline font-label-sm text-label-sm font-mono">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-[14px]">
                      verified_user
                    </span>
                    SOC-2 Type II
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-[14px]">
                      shield_lock
                    </span>
                    256-Bit TLS Cipher
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-[14px]">
                      code_off
                    </span>
                    Zero Snippet Retention
                  </span>
                </div>
                <div className="flex items-center justify-center gap-space-md mt-space-sm font-label-sm text-label-sm text-outline font-mono">
                  <Link href="#" className="hover:text-on-surface-variant transition-colors">
                    Terms of Service
                  </Link>
                  <span>•</span>
                  <Link href="#" className="hover:text-on-surface-variant transition-colors">
                    Privacy Protocol
                  </Link>
                  <span>•</span>
                  <Link href="#" className="hover:text-on-surface-variant transition-colors">
                    Security Center
                  </Link>
                </div>
              </div>
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
