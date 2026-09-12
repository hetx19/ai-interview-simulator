import { db } from "@/lib/prisma";
import type { User } from "@prisma/client";

// lightweight types for targeted queries so callers don't over-fetch
export interface OnboardingState {
  onboardingStep: string;
  onboardingCompleted: boolean;
}

export interface DashboardGate {
  onboardingCompleted: boolean;
}

// db access layer for users, sessions, and accounts
export class UserRepository {
  // fetch active user by id
  async findById(id: string): Promise<User | null> {
    return db.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // throws if user isn't found
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      // TODO: replace with NotFoundError once stage 3 error types are in
      throw new Error(`User not found: ${id}`);
    }
    return user;
  }

  // fetch active user by email
  async findByEmail(email: string): Promise<User | null> {
    return db.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  // only fetch onboarding fields needed by the wizard
  async findOnboardingState(userId: string): Promise<OnboardingState | null> {
    return db.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { onboardingStep: true, onboardingCompleted: true },
    });
  }

  // check if user completed onboarding for dashboard redirect
  async findDashboardGate(userId: string): Promise<DashboardGate | null> {
    return db.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { onboardingCompleted: true },
    });
  }

  // check if user has a specific provider linked
  async hasProvider(userId: string, provider: string): Promise<boolean> {
    const account = await db.account.findFirst({
      where: { userId, provider },
      select: { id: true },
    });
    return account !== null;
  }

  // check if user has any oauth account linked
  async hasAnyLinkedAccount(userId: string): Promise<boolean> {
    const account = await db.account.findFirst({
      where: { userId },
      select: { id: true },
    });
    return account !== null;
  }

  // update onboarding progress
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

  // delete user (cascades to child tables via postgres)
  async deleteUser(userId: string): Promise<void> {
    await db.user.delete({ where: { id: userId } });
  }

  // purge expired sessions
  async deleteExpiredSessions(): Promise<number> {
    const { count } = await db.session.deleteMany({
      where: { expires: { lt: new Date() } },
    });
    return count;
  }
}

// singleton instance
export const userRepository = new UserRepository();
