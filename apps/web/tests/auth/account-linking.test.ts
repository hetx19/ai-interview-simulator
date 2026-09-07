import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/prisma";
import { handleAccountLinking } from "@/server/auth/linking";
import { EncryptedPrismaAdapter } from "@/server/auth/adapter";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Verified-Email Account Linking & Security", () => {
  let existingUserId: string;
  const userEmail = `verified_linking_test_${Date.now()}@example.com`;
  const adapter = EncryptedPrismaAdapter(db);

  beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;

    // user with github account
    const user = await adapter.createUser!({
      id: "",
      email: userEmail,
      name: "Existing Verified User",
      image: "https://example.com/avatar.png",
      emailVerified: null,
    });
    existingUserId = user.id;

    await adapter.linkAccount!({
      userId: existingUserId,
      provider: "github",
      providerAccountId: `gh_${existingUserId}`,
      type: "oauth",
      access_token: "gho_initial_token",
      token_type: "bearer",
    });
  });

  afterAll(async () => {
    if (existingUserId) {
      await db.user.delete({ where: { id: existingUserId } }).catch(() => {});
    }
  });

  it("links a secondary OAuth provider (Google) to existing user when provider reports verified email", async () => {
    const googleAccountId = `google_sub_${Date.now()}`;

    const linkingResult = await handleAccountLinking({
      email: userEmail,
      provider: "google",
      providerAccountId: googleAccountId,
      isEmailVerified: true, // google verified
    });

    expect(linkingResult.allowed).toBe(true);
    expect(linkingResult.userId).toBe(existingUserId);
    expect(linkingResult.isNewUser).toBe(false);

    // link account
    await adapter.linkAccount!({
      userId: linkingResult.userId!,
      provider: "google",
      providerAccountId: googleAccountId,
      type: "oauth",
      access_token: "ya29.second_provider_token",
      token_type: "bearer",
    });

    // verify user preserved with multiple accounts
    const userAccounts = await db.account.findMany({
      where: { userId: existingUserId },
    });

    expect(userAccounts).toHaveLength(2);
    const providers = userAccounts.map((a) => a.provider);
    expect(providers).toContain("github");
    expect(providers).toContain("google");
  });

  it("rejects automatic account linking when provider reports unverified email (anti-takeover)", async () => {
    const maliciousAccountId = `unverified_provider_${Date.now()}`;

    const linkingResult = await handleAccountLinking({
      email: userEmail, // unverified email takeover attempt
      provider: "github",
      providerAccountId: maliciousAccountId,
      isEmailVerified: false, // unverified email
    });

    expect(linkingResult.allowed).toBe(false);
    expect(linkingResult.error).toBe("EmailVerificationRequired");
  });

  it("allows new user signup with unlinked email", async () => {
    const newEmail = `brand_new_user_${Date.now()}@example.com`;
    const newAccountId = `new_account_${Date.now()}`;

    const linkingResult = await handleAccountLinking({
      email: newEmail,
      provider: "google",
      providerAccountId: newAccountId,
      isEmailVerified: true,
    });

    expect(linkingResult.allowed).toBe(true);
    expect(linkingResult.isNewUser).toBe(true);
  });

  it("rejects duplicate provider account login if user is marked as deleted", async () => {
    // deleted user
    const deletedUser = await db.user.create({
      data: {
        email: `deleted_user_${Date.now()}@example.com`,
        username: `del_${Date.now()}`.slice(0, 30),
        deletedAt: new Date(),
        targetCompanies: [],
      },
    });

    const linkingResult = await handleAccountLinking({
      email: deletedUser.email,
      provider: "github",
      providerAccountId: `gh_deleted_${Date.now()}`,
      isEmailVerified: true,
    });

    expect(linkingResult.allowed).toBe(false);
    expect(linkingResult.error).toBe("AccountDeleted");

    await db.user.delete({ where: { id: deletedUser.id } }).catch(() => {});
  });
});
