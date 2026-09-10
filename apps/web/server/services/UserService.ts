import { UserRepository } from '@/server/repositories/UserRepository';
import { AppError } from '@/server/graphql/errors';
import type { Logger } from 'pino';
import type { User } from '@prisma/client';

export class UserService {
  private readonly userRepo: UserRepository;
  private readonly logger?: Logger;

  constructor(userId: string, logger?: Logger, userRepo?: UserRepository) {
    this.userRepo = userRepo ?? new UserRepository(userId);
    this.logger = logger;
  }

  async getAuthenticatedUser(): Promise<User> {
    this.logger?.debug('Fetching authenticated user via UserRepository.findMe');
    const user = await this.userRepo.findMe();
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found');
    }
    return user;
  }
}
