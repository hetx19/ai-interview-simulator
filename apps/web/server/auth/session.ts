import { db } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const ROTATION_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionValidationResult {
  valid: boolean;
  rotated: boolean;
  sessionToken: string;
  userId?: string;
  expires?: Date;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export async function validateAndRotateSession(
  sessionToken: string,
  now: number = Date.now(),
): Promise<SessionValidationResult> {
  if (!sessionToken) {
    return { valid: false, rotated: false, sessionToken: "" };
  }

  const dbSession = await db.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!dbSession) {
    return { valid: false, rotated: false, sessionToken };
  }

  // Reject deleted users
  if (dbSession.user.deletedAt !== null) {
    await db.session.delete({ where: { sessionToken } }).catch(() => {});
    return { valid: false, rotated: false, sessionToken };
  }

  // Reject expired sessions
  if (dbSession.expires.getTime() <= now) {
    await db.session.delete({ where: { sessionToken } }).catch(() => {});
    return { valid: false, rotated: false, sessionToken };
  }

  const sessionAgeMs = now - dbSession.createdAt.getTime();

  // Check if session exceeds the 24-hour rotation threshold
  if (sessionAgeMs > ROTATION_THRESHOLD_MS) {
    const newSessionToken = randomBytes(32).toString("hex");
    const newExpiry = new Date(now + SESSION_MAX_AGE_MS);

    // Atomically rotate: replace old token with new token and reset createdAt
    const updated = await db.session.update({
      where: { id: dbSession.id },
      data: {
        sessionToken: newSessionToken,
        expires: newExpiry,
        createdAt: new Date(now),
      },
    });

    return {
      valid: true,
      rotated: true,
      sessionToken: updated.sessionToken,
      userId: updated.userId,
      expires: updated.expires,
      user: {
        id: dbSession.user.id,
        email: dbSession.user.email,
        name: dbSession.user.name,
        avatarUrl: dbSession.user.avatarUrl,
      },
    };
  }

  // Session is valid and within the 24-hour window — do not rotate
  return {
    valid: true,
    rotated: false,
    sessionToken: dbSession.sessionToken,
    userId: dbSession.userId,
    expires: dbSession.expires,
    user: {
      id: dbSession.user.id,
      email: dbSession.user.email,
      name: dbSession.user.name,
      avatarUrl: dbSession.user.avatarUrl,
    },
  };
}
