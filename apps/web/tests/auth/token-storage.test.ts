import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/prisma";
import { EncryptedPrismaAdapter } from "@/server/auth/adapter";
import {
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
} from "@/server/auth/encryption";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("OAuth Token Storage & Persistence Encryption", () => {
  let userId: string;
  const adapter = EncryptedPrismaAdapter(db);

  beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;

    // Create test user
    const user = await adapter.createUser!({
      id: "",
      email: `token_storage_test_${Date.now()}@example.com`,
      name: "Token Storage Test",
      image: "https://avatars.githubusercontent.com/u/123",
      emailVerified: null,
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (userId) {
      await db.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it("encrypts access_token and refresh_token before storing in accounts table", async () => {
    const rawAccessToken = "gho_SuperSecretPlaintextAccessToken12345";
    const rawRefreshToken = "ghr_SuperSecretPlaintextRefreshToken67890";
    const providerAccountId = `gh_acc_${Date.now()}`;

    await adapter.linkAccount!({
      userId,
      provider: "github",
      providerAccountId,
      type: "oauth",
      access_token: rawAccessToken,
      refresh_token: rawRefreshToken,
      token_type: "bearer",
      scope: "read:user user:email",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    // Directly query database row to verify ciphertext at rest
    const storedAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
    });

    expect(storedAccount).not.toBeNull();
    // 1. Plaintext tokens must NOT be stored at rest
    expect(storedAccount!.accessToken).not.toBe(rawAccessToken);
    expect(storedAccount!.accessToken).not.toContain(rawAccessToken);
    expect(storedAccount!.refreshToken).not.toBe(rawRefreshToken);
    expect(storedAccount!.refreshToken).not.toContain(rawRefreshToken);

    // 2. Format must be iv.ciphertext.tag
    expect(storedAccount!.accessToken!.split(".")).toHaveLength(3);
    expect(storedAccount!.refreshToken!.split(".")).toHaveLength(3);

    // 3. Decryption helpers must correctly recover the original plaintext
    const decryptedAccess = await getDecryptedAccessToken(userId, "github");
    const decryptedRefresh = await getDecryptedRefreshToken(userId, "github");

    expect(decryptedAccess).toBe(rawAccessToken);
    expect(decryptedRefresh).toBe(rawRefreshToken);
  });

  it("handles accounts without refresh_token safely", async () => {
    const rawAccessToken = "ya29.google_oauth_token_without_refresh";
    const providerAccountId = `google_acc_${Date.now()}`;

    await adapter.linkAccount!({
      userId,
      provider: "google",
      providerAccountId,
      type: "oauth",
      access_token: rawAccessToken,
      token_type: "bearer",
      scope: "openid profile email",
    });

    const storedAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId,
        },
      },
    });

    expect(storedAccount).not.toBeNull();
    expect(storedAccount!.accessToken).not.toBe(rawAccessToken);
    expect(storedAccount!.refreshToken).toBeNull();

    const decryptedAccess = await getDecryptedAccessToken(userId, "google");
    const decryptedRefresh = await getDecryptedRefreshToken(userId, "google");

    expect(decryptedAccess).toBe(rawAccessToken);
    expect(decryptedRefresh).toBeNull();
  });
});
