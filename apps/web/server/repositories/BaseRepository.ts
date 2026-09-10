import { db as prismaDb } from '@/lib/prisma';

export abstract class BaseRepository {
  protected readonly userId: string;
  protected readonly db: typeof prismaDb;

  constructor(userId: string) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('BaseRepository requires a userId');
    }
    this.userId = userId;
    this.db = prismaDb;
  }

  protected userScope(isUserModel = false): Record<string, any> {
    return isUserModel
      ? { id: this.userId, deletedAt: null }
      : { userId: this.userId, deletedAt: null };
  }

  protected async findFirst<T>(
    delegate: any,
    where?: Record<string, any>,
    select?: Record<string, any>,
  ): Promise<T | null> {
    const isUserModel = delegate === this.db.user;
    const baseWhere = isUserModel
      ? { id: this.userId, deletedAt: null }
      : { userId: this.userId, deletedAt: null };

    return delegate.findFirst({
      where: { ...baseWhere, ...where },
      ...(select ? { select } : {}),
    });
  }

  protected async findMany<T>(
    delegate: any,
    where?: Record<string, any>,
    orderBy?: Record<string, any>,
  ): Promise<T[]> {
    const isUserModel = delegate === this.db.user;
    const baseWhere = isUserModel
      ? { id: this.userId, deletedAt: null }
      : { userId: this.userId };

    return delegate.findMany({
      where: { ...baseWhere, ...where },
      ...(orderBy ? { orderBy } : {}),
    });
  }

  public async update<T>(id: string, data: object): Promise<T>;
  public async update<T>(delegate: any, id: string, data: object): Promise<T>;
  public async update<T>(delegateOrId: any, idOrData: any, maybeData?: any): Promise<T> {
    if (maybeData !== undefined) {
      const delegate = delegateOrId;
      const id = idOrData;
      const data = maybeData;
      const isUserModel = delegate === this.db.user;
      if (isUserModel) {
        const targetId =
          id === this.userId ? this.userId : '00000000-0000-0000-0000-000000000000';
        return delegate.update({
          where: { id: targetId },
          data,
        });
      }

      return delegate.update({
        where: { id, userId: this.userId },
        data,
      });
    } else {
      const id = delegateOrId;
      const data = idOrData;
      const targetId =
        id === this.userId ? this.userId : '00000000-0000-0000-0000-000000000000';
      return this.db.user.update({
        where: { id: targetId },
        data,
      }) as unknown as Promise<T>;
    }
  }

  public async hardDelete(id: string): Promise<void>;
  public async hardDelete(delegate: any, id: string): Promise<void>;
  public async hardDelete(delegateOrId: any, maybeId?: string): Promise<void> {
    if (maybeId !== undefined) {
      const delegate = delegateOrId;
      const id = maybeId;
      const isUserModel = delegate === this.db.user;
      if (isUserModel) {
        const targetId =
          id === this.userId ? this.userId : '00000000-0000-0000-0000-000000000000';
        await delegate.delete({
          where: { id: targetId },
        });
        return;
      }

      await delegate.delete({
        where: { id, userId: this.userId },
      });
    } else {
      const id = delegateOrId;
      const targetId =
        id === this.userId ? this.userId : '00000000-0000-0000-0000-000000000000';
      await this.db.user.delete({
        where: { id: targetId },
      });
    }
  }

  public async softDelete(delegate: any, id: string): Promise<void> {
    const isUserModel = delegate === this.db.user;
    if (isUserModel) {
      const targetId =
        id === this.userId ? this.userId : '00000000-0000-0000-0000-000000000000';
      await delegate.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
      return;
    }

    await delegate.update({
      where: { id, userId: this.userId },
      data: { deletedAt: new Date() },
    });
  }

  public async deleteMany(delegate: any, where?: object): Promise<number> {
    const isUserModel = delegate === this.db.user;
    const { count } = await delegate.deleteMany({
      where: isUserModel
        ? { id: this.userId, ...where }
        : { userId: this.userId, ...where },
    });
    return count;
  }
}
