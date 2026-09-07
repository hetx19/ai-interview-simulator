import { db } from "@/lib/prisma";

export interface AccountLinkingParams {
  email: string;
  provider: string;
  providerAccountId: string;
  isEmailVerified: boolean;
}

export interface AccountLinkingResult {
  allowed: boolean;
  error?: string;
  userId?: string;
  isNewUser?: boolean;
}

/**
 * Handles explicit and safe OAuth account linking.
 * Ensures:
 * 1. An existing user can link a secondary OAuth provider ONLY if the provider reports a verified email.
 * 2. Unverified emails can NEVER trigger automatic account merging (prevents account takeover).
 * 3. Existing user identity, profiles, and sessions are preserved when linking another provider.
 * 4. Duplicate provider/account links to different users are safely rejected.
 */
export async function handleAccountLinking({
  email,
  provider,
  providerAccountId,
  isEmailVerified,
}: AccountLinkingParams): Promise<AccountLinkingResult> {
  if (!email) {
    return { allowed: false, error: "EmailRequired" };
  }

  // Check if provider account is already linked to any user
  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: { user: true },
  });

  // Check if a user with this email already exists in dev_metric
  const existingUser = await db.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  // Scenario 1: Account already exists and is linked
  if (existingAccount) {
    if (existingAccount.user.deletedAt !== null) {
      return { allowed: false, error: "AccountDeleted" };
    }
    return {
      allowed: true,
      userId: existingAccount.user.id,
      isNewUser: false,
    };
  }

  // Scenario 2: Brand new user (no existing user with this email)
  if (!existingUser) {
    return {
      allowed: true,
      isNewUser: true,
    };
  }

  // Scenario 3: Existing user found with matching email — linking a second provider
  if (existingUser.deletedAt !== null) {
    return { allowed: false, error: "AccountDeleted" };
  }

  // Security rule: Provider email MUST be verified to link to an existing account
  if (!isEmailVerified) {
    return {
      allowed: false,
      error: "EmailVerificationRequired",
    };
  }

  // Verified email: safely link new provider to the existing user
  return {
    allowed: true,
    userId: existingUser.id,
    isNewUser: false,
  };
}
