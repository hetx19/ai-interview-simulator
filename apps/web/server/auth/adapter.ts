import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";
import { encryptToken, decryptToken } from "./encryption";
import { randomBytes } from "crypto";

// custom next-auth adapter that keeps oauth tokens encrypted in the db
export function EncryptedPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const email = data.email;
      const baseUsername =
        data.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        "user";
      const randomSuffix = randomBytes(3).toString("hex");
      const username = `${baseUsername}_${randomSuffix}`.slice(0, 50);

      const user = await prisma.user.create({
        data: {
          email,
          name: data.name ?? null,
          username,
          avatarUrl: data.image ?? null,
          targetCompanies: [],
        },
      });

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: user.avatarUrl,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
      });
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: user.avatarUrl,
      };
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const user = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: user.avatarUrl,
      };
    },

    async getUserByAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });

      if (!account?.user || account.user.deletedAt !== null) {
        return null;
      }

      return {
        id: account.user.id,
        email: account.user.email,
        emailVerified: null,
        name: account.user.name,
        image: account.user.avatarUrl,
      };
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name !== undefined ? user.name : undefined,
          email: user.email !== undefined ? user.email : undefined,
          avatarUrl: user.image !== undefined ? user.image : undefined,
        },
      });

      return {
        id: updated.id,
        email: updated.email,
        emailVerified: null,
        name: updated.name,
        image: updated.avatarUrl,
      };
    },

    async deleteUser(userId: string): Promise<void> {
      await prisma.user.delete({ where: { id: userId } });
    },

    async linkAccount(account: AdapterAccount): Promise<AdapterAccount | null | undefined> {
      // encrypt tokens before saving to db
      const encryptedAccessToken = account.access_token
        ? encryptToken(account.access_token)
        : null;
      const encryptedRefreshToken = account.refresh_token
        ? encryptToken(account.refresh_token)
        : null;

      await prisma.account.create({
        data: {
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenType: account.token_type ?? null,
          scope: account.scope ?? null,
          expiresAt: account.expires_at ? BigInt(account.expires_at) : null,
        },
      });

      return account;
    },

    async unlinkAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<void> {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },

    async getSessionAndUser(sessionToken: string) {
      const userAndSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!userAndSession || userAndSession.user.deletedAt !== null) {
        return null;
      }

      const { user, ...session } = userAndSession;

      return {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: null,
          name: user.name,
          image: user.avatarUrl,
        },
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
      };
    },

    async createSession(data: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      const session = await prisma.session.create({
        data: {
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
        },
      });

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async updateSession(data: {
      sessionToken: string;
      userId?: string;
      expires?: Date;
    }) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: {
          expires: data.expires,
        },
      });

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      try {
        await prisma.session.delete({ where: { sessionToken } });
      } catch {
        // ignore if already cleaned up
      }
    },
  };
}
