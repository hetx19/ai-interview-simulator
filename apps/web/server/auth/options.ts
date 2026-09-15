import type { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/prisma";
import { env } from "@/lib/env";
import { EncryptedPrismaAdapter } from "./adapter";
import { handleAccountLinking } from "./linking";

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = isProduction
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export const authOptions: AuthOptions = {
  adapter: EncryptedPrismaAdapter(db),

  providers: [
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          // only need public repo and email data
          scope: "read:user user:email",
        },
      },
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // passes ?error= to login page
  },

  callbacks: {
    // verify email before linking so accounts can't be hijacked
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return "/login?error=EmailRequired";
      }

      // check if provider verified the email
      let isEmailVerified = false;
      if (account?.provider === "google") {
        isEmailVerified = true; // google emails are already verified
      } else if (account?.provider === "github") {
        const p = profile as Record<string, unknown> | undefined;
        isEmailVerified = p?.email_verified === true || p?.verified === true;
      }

      const linkingResult = await handleAccountLinking({
        email: user.email,
        provider: account?.provider ?? "",
        providerAccountId: account?.providerAccountId ?? "",
        isEmailVerified,
        accessToken: account?.access_token,
        refreshToken: account?.refresh_token,
        expiresAt: account?.expires_at,
        tokenType: account?.token_type,
        scope: account?.scope,
      });

      if (!linkingResult.allowed) {
        if (linkingResult.error === "EmailVerificationRequired") {
          return "/login?error=EmailVerificationRequired";
        }
        if (linkingResult.error === "AccountDeleted") {
          return "/login?error=AccountDeleted";
        }
        return `/login?error=${linkingResult.error || "OAuthAccountNotLinked"}`;
      }

      if (linkingResult.userId) {
        user.id = linkingResult.userId;
      }

      return true;
    },

    // attach user id to session
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }

      return session;
    },
  },

  events: {
    async signIn() {
      // hook for auth event telemetry if needed later
    },
  },
};
