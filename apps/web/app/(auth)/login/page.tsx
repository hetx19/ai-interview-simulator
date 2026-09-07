"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/onboarding";

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
            🚀
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            DevMetric
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Your hiring readiness, quantified.
          </p>
        </div>

        {/* User-visible error banner */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            role="alert"
            className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm flex items-start gap-2 shadow-sm"
          >
            <span className="text-rose-400 font-bold">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl space-y-4">
          <button
            id="login-github-btn"
            onClick={() => signIn("github", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 active:scale-[0.99] transition duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <button
            id="login-google-btn"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 active:scale-[0.99] transition duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  );
}
