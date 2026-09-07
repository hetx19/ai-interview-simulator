import { db } from "@/lib/prisma";

export interface DeleteAccountResult {
  success: boolean;
  userId: string;
  sessionsInvalidated: number;
}

/**
 * Account Deletion Service (Authentication & Session Invalidation Layer)
 *
 * For Stage 2, deletion:
 * 1. Invalidates the user's active authentication sessions immediately.
 * 2. Records deletion intent on the user record using the existing schema (soft-delete timestamp `deletedAt`).
 * 3. Prevents the account from continuing to authenticate or being accessed.
 *
 * Note: Full permanent application data erasure is explicitly deferred to later stages.
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  if (!userId) {
    throw new Error("userId is required for account deletion.");
  }

  // Step 1: Invalidate all active sessions for this user in PostgreSQL
  const { count: sessionsInvalidated } = await db.session.deleteMany({
    where: { userId },
  });

  // Step 2: Record deletion intent using the existing schema (deletedAt)
  await db.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    success: true,
    userId,
    sessionsInvalidated,
  };
}
