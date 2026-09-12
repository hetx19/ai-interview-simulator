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

// links oauth providers safely (requires verified email to merge accounts)
export async function handleAccountLinking({
  email,
  provider,
  providerAccountId,
  isEmailVerified,
}: AccountLinkingParams): Promise<AccountLinkingResult> {
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

  // account is already linked, log them in
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
