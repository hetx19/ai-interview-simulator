import type { User } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { AppError } from '@/server/graphql/errors';

export interface OnboardingState {
  onboardingStep: string;
  onboardingCompleted: boolean;
}

export interface DashboardGate {
  onboardingCompleted: boolean;
}

export class UserRepository extends BaseRepository {
  constructor(userId: string) {
    super(userId);
  }

  // Scoped to current authenticated user
  async findMe(): Promise<User | null> {
    return this.findFirst<User>(this.db.user);
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new AppError('NOT_FOUND', `User not found: ${id}`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findOnboardingState(targetUserId?: string): Promise<OnboardingState | null> {
    const id = targetUserId ?? this.userId;
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      select: { onboardingStep: true, onboardingCompleted: true },
    });
  }

  async findDashboardGate(targetUserId?: string): Promise<DashboardGate | null> {
    const id = targetUserId ?? this.userId;
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      select: { onboardingCompleted: true },
    });
  }

  async hasProvider(providerOrUserId: string, maybeProvider?: string): Promise<boolean> {
    const userId = maybeProvider ? providerOrUserId : this.userId;
    const provider = maybeProvider ?? providerOrUserId;
    const account = await this.db.account.findFirst({
      where: { userId, provider },
      select: { id: true },
    });
    return account !== null;
  }

  async hasAnyLinkedAccount(targetUserId?: string): Promise<boolean> {
    const userId = targetUserId ?? this.userId;
    const account = await this.db.account.findFirst({
      where: { userId },
      select: { id: true },
    });
    return account !== null;
  }

  async updateOnboardingStep(
    stepOrUserId: string,
    completedOrStep: boolean | string,
    maybeCompleted?: boolean,
  ): Promise<void> {
    let id = this.userId;
    let step: string;
    let completed: boolean;

    if (typeof completedOrStep === 'string' && typeof maybeCompleted === 'boolean') {
      id = stepOrUserId;
      step = completedOrStep;
      completed = maybeCompleted;
    } else {
      step = stepOrUserId;
      completed = completedOrStep as boolean;
    }

    await this.db.user.update({
      where: { id },
      data: {
        onboardingStep: step,
        onboardingCompleted: completed,
        updatedAt: new Date(),
      },
    });
  }

  public override async update<T = User>(id: string, data: any): Promise<T>;
  public override async update<T>(delegate: any, id: string, data: object): Promise<T>;
  public override async update<T>(delegateOrId: any, idOrData: any, maybeData?: any): Promise<T> {
    return super.update(delegateOrId, idOrData, maybeData);
  }

  public override async hardDelete(id: string): Promise<void>;
  public override async hardDelete(delegate: any, id: string): Promise<void>;
  public override async hardDelete(delegateOrId: any, maybeId?: string): Promise<void> {
    if (maybeId !== undefined) {
      return super.hardDelete(delegateOrId, maybeId);
    }
    return super.hardDelete(delegateOrId);
  }

  async deleteManySessions(): Promise<number> {
    return this.deleteMany(this.db.session);
  }

  async deleteUser(targetUserId?: string): Promise<void> {
    const id = targetUserId ?? this.userId;
    await this.db.user.delete({ where: { id } });
  }

  async deleteExpiredSessions(): Promise<number> {
    const { count } = await this.db.session.deleteMany({
      where: { expires: { lt: new Date() } },
    });
    return count;
  }
}

// Backward compatibility helper
export const userRepository = {
  findDashboardGate: (userId: string) => new UserRepository(userId).findDashboardGate(),
  findOnboardingState: (userId: string) => new UserRepository(userId).findOnboardingState(),
  hasAnyLinkedAccount: (userId: string) => new UserRepository(userId).hasAnyLinkedAccount(),
  updateOnboardingStep: (userId: string, step: string, completed: boolean) =>
    new UserRepository(userId).updateOnboardingStep(step, completed),
  findById: (userId: string) => new UserRepository(userId).findById(userId),
};
