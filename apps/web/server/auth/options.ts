import type { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/prisma";
import { EncryptedPrismaAdapter } from "./adapter";
import { handleAccountLinking } from "./linking";
import { validateAndRotateSession } from "./session";

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = isProduction
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export const authOptions: AuthOptions = {
  adapter: EncryptedPrismaAdapter(db),

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: {
        params: {
          // Least-privilege: public activity only. No private repo access.
          scope: "read:user user:email public_repo",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
    error: "/login", // Surfaced via ?error= on login page
  },

  callbacks: {
    /**
     * signIn callback — runs before a session is created.
     * Enforces verified-email account linking to prevent account takeover.
     */
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return "/login?error=EmailRequired";
      }

      // Check email verification from provider
      let isEmailVerified = false;
      if (account?.provider === "google") {
        isEmailVerified = true; // Google OAuth guarantees verified emails
      } else if (account?.provider === "github") {
        const p = profile as Record<string, unknown> | undefined;
        isEmailVerified = p?.email_verified === true || p?.verified === true;
      }

      const linkingResult = await handleAccountLinking({
        email: user.email,
        provider: account?.provider ?? "",
        providerAccountId: account?.providerAccountId ?? "",
        isEmailVerified,
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

    /**
     * session callback — runs on every authenticated request.
     * Attaches user ID and performs 24h session token rotation.
     */
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }

      const token = (session as { sessionToken?: string }).sessionToken;
      if (token) {
        const result = await validateAndRotateSession(token);
        if (result.rotated) {
          (session as { sessionToken?: string }).sessionToken = result.sessionToken;
        }
      }

      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      // Optional logging or audit tracking for auth events
    },
  },
};
