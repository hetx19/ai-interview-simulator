import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/prisma";
import {
  validateAndRotateSession,
  ROTATION_THRESHOLD_MS,
} from "@/server/auth/session";
import { randomBytes } from "crypto";

describe("Database Session Management & 24-Hour Rotation", () => {
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `session_test_${Date.now()}@example.com`,
        username: `st_${Date.now()}`.slice(0, 30),
        name: "Session Test User",
        targetCompanies: [],
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (userId) {
      await db.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it("authenticates a valid, fresh database-backed session without rotation", async () => {
    const sessionToken = `token_fresh_${randomBytes(16).toString("hex")}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.session.create({
      data: {
        userId,
        sessionToken,
        expires,
      },
    });

    const result = await validateAndRotateSession(sessionToken);

    expect(result.valid).toBe(true);
    expect(result.rotated).toBe(false);
    expect(result.sessionToken).toBe(sessionToken);
    expect(result.userId).toBe(userId);
  });

  it("does not rotate a session at or below the 24-hour threshold", async () => {
    const sessionToken = `token_23h_${randomBytes(16).toString("hex")}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await db.session.create({
      data: {
        userId,
        sessionToken,
        expires,
      },
    });

    // Simulate session age of exactly 23 hours (below 24h threshold)
    const simulatedNow = session.createdAt.getTime() + 23 * 60 * 60 * 1000;
    const result = await validateAndRotateSession(sessionToken, simulatedNow);

    expect(result.valid).toBe(true);
    expect(result.rotated).toBe(false);
    expect(result.sessionToken).toBe(sessionToken);
  });

  it("triggers rotation when session age exceeds the 24-hour threshold", async () => {
    const oldSessionToken = `token_old_${randomBytes(16).toString("hex")}`;
    const originalExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await db.session.create({
      data: {
        userId,
        sessionToken: oldSessionToken,
        expires: originalExpires,
      },
    });

    // Simulate session age of 25 hours (> 24 hours)
    const simulatedNow = session.createdAt.getTime() + (ROTATION_THRESHOLD_MS + 3600 * 1000);
    const result = await validateAndRotateSession(oldSessionToken, simulatedNow);

    expect(result.valid).toBe(true);
    expect(result.rotated).toBe(true);
    expect(result.sessionToken).not.toBe(oldSessionToken);
    expect(result.userId).toBe(userId);

    // Verify in database: replacement token exists and is associated with the same user
    const dbNewSession = await db.session.findUnique({
      where: { sessionToken: result.sessionToken },
    });
    expect(dbNewSession).not.toBeNull();
    expect(dbNewSession!.userId).toBe(userId);

    // Verify that the old session token has been invalidated in the database
    const dbOldSession = await db.session.findUnique({
      where: { sessionToken: oldSessionToken },
    });
    expect(dbOldSession).toBeNull();

    // Verify that the old session token can NO LONGER be used to authenticate
    const oldTokenAuthResult = await validateAndRotateSession(oldSessionToken);
    expect(oldTokenAuthResult.valid).toBe(false);
  });

  it("rejects an expired session and removes it from the database", async () => {
    const expiredSessionToken = `token_expired_${randomBytes(16).toString("hex")}`;
    const pastDate = new Date(Date.now() - 60 * 1000); // Expired 1 minute ago

    await db.session.create({
      data: {
        userId,
        sessionToken: expiredSessionToken,
        expires: pastDate,
      },
    });

    const result = await validateAndRotateSession(expiredSessionToken);

    expect(result.valid).toBe(false);
    expect(result.rotated).toBe(false);

    // Should be removed from database
    const dbCheck = await db.session.findUnique({
      where: { sessionToken: expiredSessionToken },
    });
    expect(dbCheck).toBeNull();
  });
});
