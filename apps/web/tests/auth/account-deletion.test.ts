import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/prisma";
import { deleteAccount } from "@/server/auth/deletion";
import { validateAndRotateSession } from "@/server/auth/session";
import { EncryptedPrismaAdapter } from "@/server/auth/adapter";

describe("Account Deletion Capability (Stage 2 Auth/Session Layer)", () => {
  let userId: string;
  let sessionToken1: string;
  let sessionToken2: string;
  const adapter = EncryptedPrismaAdapter(db);

  beforeAll(async () => {
    // 1. Create a user
    const user = await adapter.createUser!({
      id: "",
      email: `deletion_test_${Date.now()}@example.com`,
      name: "Account Deletion Test User",
      image: "https://example.com/avatar.png",
      emailVerified: null,
    });
    userId = user.id;

    // 2. Create multiple active sessions for this user
    sessionToken1 = `del_token_1_${Date.now()}`;
    sessionToken2 = `del_token_2_${Date.now()}`;

    await db.session.createMany({
      data: [
        {
          userId,
          sessionToken: sessionToken1,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          userId,
          sessionToken: sessionToken2,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    });
  });

  afterAll(async () => {
    if (userId) {
      await db.session.deleteMany({ where: { userId } }).catch(() => {});
      await db.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it("invalidates all active sessions and marks deletion intent (deletedAt) upon deleteAccount", async () => {
    // Verify sessions are active before deletion
    const beforeResult1 = await validateAndRotateSession(sessionToken1);
    const beforeResult2 = await validateAndRotateSession(sessionToken2);
    expect(beforeResult1.valid).toBe(true);
    expect(beforeResult2.valid).toBe(true);

    // Call deleteAccount
    const result = await deleteAccount(userId);

    expect(result.success).toBe(true);
    expect(result.userId).toBe(userId);
    expect(result.sessionsInvalidated).toBe(2);

    // Verify all active sessions were removed from PostgreSQL
    const remainingSessions = await db.session.count({
      where: { userId },
    });
    expect(remainingSessions).toBe(0);

    // Verify deletion intent is marked on the user record using existing schema
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
    });
    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.deletedAt).not.toBeNull();
    expect(updatedUser!.deletedAt).toBeInstanceOf(Date);

    // Verify that previously valid session tokens can no longer authenticate
    const afterResult1 = await validateAndRotateSession(sessionToken1);
    const afterResult2 = await validateAndRotateSession(sessionToken2);
    expect(afterResult1.valid).toBe(false);
    expect(afterResult2.valid).toBe(false);
  });

  it("prevents deleted user from authenticating through adapter.getUser or adapter.getUserByEmail", async () => {
    const userByEmail = await adapter.getUserByEmail!(`deletion_test_${Date.now()}@example.com`);
    expect(userByEmail).toBeNull();

    const userById = await adapter.getUser!(userId);
    expect(userById).toBeNull();
  });
});
