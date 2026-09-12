import { db } from "@/lib/prisma";

export interface DeleteAccountResult {
  success: boolean;
  userId: string;
  sessionsInvalidated: number;
}

// soft-deletes the user and invalidates all active sessions
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  if (!userId) {
    throw new Error("userId is required for account deletion.");
  }

  // blow away active sessions
  const { count: sessionsInvalidated } = await db.session.deleteMany({
    where: { userId },
  });

  // mark account as deleted
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
