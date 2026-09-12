import { db } from "@/lib/prisma";
import { encryptToken } from "./encryption";
import { logger } from "@/server/logging/logger";

export interface OAuthAccountCredentials {
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | bigint | null;
  token_type?: string | null;
  scope?: string | null;
}

export interface AccountLinkingParams {
  email: string;
  provider: string;
  providerAccountId: string;
  isEmailVerified: boolean;
  credentials?: OAuthAccountCredentials;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | bigint | null;
  tokenType?: string | null;
  scope?: string | null;
}

export interface AccountLinkingResult {
  allowed: boolean;
  error?: string;
  userId?: string;
  isNewUser?: boolean;
}

// links oauth providers safely (requires verified email to merge accounts)
export async function handleAccountLinking(
  params: AccountLinkingParams,
): Promise<AccountLinkingResult> {
  const { email, provider, providerAccountId, isEmailVerified } = params;

  if (!email) {
    return { allowed: false, error: "EmailRequired" };
  }

  // check if this provider account already belongs to someone
  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: { user: true },
  });

  // check if an account with this email already exists
  const existingUser = await db.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  // account is already linked, log them in & persist fresh credentials
  if (existingAccount) {
    if (existingAccount.user.deletedAt !== null) {
      return { allowed: false, error: "AccountDeleted" };
    }

    const rawAccessToken = params.accessToken ?? params.credentials?.access_token;
    const rawRefreshToken = params.refreshToken ?? params.credentials?.refresh_token;
    const rawExpiresAt = params.expiresAt ?? params.credentials?.expires_at;
    const rawTokenType = params.tokenType ?? params.credentials?.token_type;
    const rawScope = params.scope ?? params.credentials?.scope;

    const hasNewCredentials =
      rawAccessToken !== undefined ||
      rawRefreshToken !== undefined ||
      rawExpiresAt !== undefined ||
      rawTokenType !== undefined ||
      rawScope !== undefined;

    if (hasNewCredentials) {
      const updatedAccessToken = rawAccessToken
        ? encryptToken(rawAccessToken)
        : existingAccount.accessToken;
      // Never overwrite a valid stored refresh token with null if the provider legitimately omitted it
      const updatedRefreshToken = rawRefreshToken
        ? encryptToken(rawRefreshToken)
        : existingAccount.refreshToken;
      const updatedExpiresAt = rawExpiresAt != null
        ? BigInt(rawExpiresAt)
        : existingAccount.expiresAt;
      const updatedTokenType = rawTokenType ?? existingAccount.tokenType;
      const updatedScope = rawScope ?? existingAccount.scope;

      await db.account.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: updatedAccessToken,
          refreshToken: updatedRefreshToken,
          expiresAt: updatedExpiresAt,
          tokenType: updatedTokenType,
          scope: updatedScope,
        },
      });

      logger.info(
        {
          userId: existingAccount.user.id,
          provider,
          providerAccountId,
        },
        'OAuth account credentials refreshed and updated',
      );
    }

    return {
      allowed: true,
      userId: existingAccount.user.id,
      isNewUser: false,
    };
  }

  // new user signup flow
  if (!existingUser) {
    return {
      allowed: true,
      isNewUser: true,
    };
  }

  // connecting a second provider to existing account
  if (existingUser.deletedAt !== null) {
    return { allowed: false, error: "AccountDeleted" };
  }

  // don't merge without a verified email from the provider
  if (!isEmailVerified) {
    return {
      allowed: false,
      error: "EmailVerificationRequired",
    };
  }

  // email is verified, attach provider to existing user
  return {
    allowed: true,
    userId: existingUser.id,
    isNewUser: false,
  };
}
