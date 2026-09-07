import { db } from "@/lib/prisma";
import type { User } from "@prisma/client";

// ---------------------------------------------------------------------------
// Lightweight value types returned by focused queries.
// Route handlers and layouts receive only the fields they need — never the
// full User row — to avoid accidental exposure of sensitive columns.
// ---------------------------------------------------------------------------

export interface OnboardingState {
  onboardingStep: string;
  onboardingCompleted: boolean;
}

export interface DashboardGate {
  onboardingCompleted: boolean;
}

// ---------------------------------------------------------------------------
// UserRepository
//
// Enforces the Repository pattern from skills.md §4:
//   "API routes and services never call Prisma directly."
//
// All DB access for the `users`, `sessions`, and `accounts` tables goes
// through this class. Callers depend on this interface, not on Prisma.
// ---------------------------------------------------------------------------
export class UserRepository {
  // ─── Read operations ─────────────────────────────────────────────────────

  /**
   * Find an active (non-deleted) user by primary key.
   * Returns null when the user does not exist or has been soft-deleted.
   */
  async findById(id: string): Promise<User | null> {
    return db.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Same as findById, but throws a typed Error when the user is missing.
   * Use in contexts where a missing user is always a programming error
   * (e.g. after confirming a valid session exists).
   */
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      // Note: will be replaced with NotFoundError when server/errors.ts is
      // introduced in Stage 3.
      throw new Error(`User not found: ${id}`);
    }
    return user;
  }

  /** Find an active user by email address. */
  async findByEmail(email: string): Promise<User | null> {
    return db.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  /**
   * Returns only the two onboarding fields needed by the onboarding page
   * and the onboarding API route. Avoids over-fetching the full User row.
   */
  async findOnboardingState(userId: string): Promise<OnboardingState | null> {
    return db.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { onboardingStep: true, onboardingCompleted: true },
    });
  }

  /**
   * Returns only the onboarding completion flag needed by the dashboard
   * layout to decide whether to redirect to /onboarding.
   */
  async findDashboardGate(userId: string): Promise<DashboardGate | null> {
    return db.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { onboardingCompleted: true },
    });
  }

  // ─── Provider / Account helpers ──────────────────────────────────────────

  /**
   * Returns true when the user has at least one linked OAuth account for the
   * given provider (e.g. "github", "google").
   *
   * Used by:
   *  - The onboarding wizard to show "GitHub connected" state.
   *  - PATCH /api/v1/user/onboarding to check if GitHub is linked before
   *    advancing past CONNECT_GITHUB (without requiring a raw db.account call
   *    in the route handler).
   */
  async hasProvider(userId: string, provider: string): Promise<boolean> {
    const account = await db.account.findFirst({
      where: { userId, provider },
      select: { id: true },
    });
    return account !== null;
  }

  /**
   * Returns true when the user has at least one linked OAuth account of any
   * provider. Used to allow Google-only users to proceed through onboarding
   * without being forced to link GitHub first.
   */
  async hasAnyLinkedAccount(userId: string): Promise<boolean> {
    const account = await db.account.findFirst({
      where: { userId },
      select: { id: true },
    });
    return account !== null;
  }

  // ─── Write operations ─────────────────────────────────────────────────────

  /** Persist the current onboarding step and completion flag to the database. */
  async updateOnboardingStep(
    userId: string,
    step: string,
    completed: boolean,
  ): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        onboardingStep: step,
        onboardingCompleted: completed,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Hard-delete the user row. Child rows in all related tables are removed
   * automatically by PostgreSQL ON DELETE CASCADE (accounts, sessions,
   * github_profiles, leetcode_profiles, resumes, interview_sessions, …).
   * audit_logs.user_id is SET NULL to preserve the audit trail.
   */
  async deleteUser(userId: string): Promise<void> {
    await db.user.delete({ where: { id: userId } });
  }

  // ─── Session helpers ──────────────────────────────────────────────────────

  /** Removes all DB sessions whose expiry timestamp is in the past. */
  async deleteExpiredSessions(): Promise<number> {
    const { count } = await db.session.deleteMany({
      where: { expires: { lt: new Date() } },
    });
    return count;
  }
}

// Singleton — import this everywhere instead of constructing a new instance.
export const userRepository = new UserRepository();
