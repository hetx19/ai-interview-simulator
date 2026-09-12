import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/prisma";
import { handleAccountLinking } from "@/server/auth/linking";
import { EncryptedPrismaAdapter } from "@/server/auth/adapter";
import { decryptToken, getDecryptedAccessToken } from "@/server/auth/encryption";
import { gitHubApiClient } from "@/server/external/GitHubApiClient";
import { AppError } from "@/server/graphql/errors";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Verified-Email Account Linking & Security", () => {
  let existingUserId: string;
  const userEmail = `verified_linking_test_${Date.now()}@example.com`;
  const adapter = EncryptedPrismaAdapter(db);

  beforeAll(async () => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = TEST_KEY;

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

describe("GitHub OAuth Token Lifecycle & Reconnection Flow", () => {
  const adapter = EncryptedPrismaAdapter(db);
  const createdUserIds: string[] = [];

  beforeAll(() => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await db.user.delete({ where: { id } }).catch(() => {});
    }
  });

  // Test 1 — Initial GitHub connection
  it("Test 1: Initial GitHub connection creates account with encrypted tokens and metadata", async () => {
    const user = await adapter.createUser!({
      id: "",
      email: `gh_lifecycle_test_${Date.now()}@example.com`,
      name: "GitHub Lifecycle User",
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    const providerAccountId = `gh_lifecycle_${Date.now()}`;
    const rawAccessToken = "gho_initial_access_token_12345";
    const rawRefreshToken = "ghr_initial_refresh_token_67890";
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const scope = "read:user user:email public_repo";

    const linkResult = await handleAccountLinking({
      email: user.email,
      provider: "github",
      providerAccountId,
      isEmailVerified: true,
      accessToken: rawAccessToken,
      refreshToken: rawRefreshToken,
      expiresAt,
      scope,
      tokenType: "bearer",
    });
    expect(linkResult.allowed).toBe(true);

    await adapter.linkAccount!({
      userId: user.id,
      provider: "github",
      providerAccountId,
      type: "oauth",
      access_token: rawAccessToken,
      refresh_token: rawRefreshToken,
      expires_at: expiresAt,
      scope,
      token_type: "bearer",
    });

    const account = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
    });

    expect(account).not.toBeNull();
    // Access token is encrypted
    expect(account!.accessToken).not.toBe(rawAccessToken);
    expect(decryptToken(account!.accessToken!)).toBe(rawAccessToken);
    // Refresh token is encrypted
    expect(account!.refreshToken).not.toBe(rawRefreshToken);
    expect(decryptToken(account!.refreshToken!)).toBe(rawRefreshToken);
    // Expiry is persisted
    expect(account!.expiresAt).toBe(BigInt(expiresAt));
    // Scope is persisted
    expect(account!.scope).toBe(scope);
  });

  // Test 2 — Existing GitHub account reconnect
  it("Test 2: Reconnecting GitHub updates existing Account row with new encrypted credentials without duplicate records", async () => {
    const user = await adapter.createUser!({
      id: "",
      email: `gh_reconnect_test_${Date.now()}@example.com`,
      name: "GitHub Reconnect User",
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    const providerAccountId = `gh_reconn_acc_${Date.now()}`;
    const oldAccessToken = "gho_old_stale_access_token";
    const oldRefreshToken = "ghr_old_stale_refresh_token";

    // Initial connection
    await adapter.linkAccount!({
      userId: user.id,
      provider: "github",
      providerAccountId,
      type: "oauth",
      access_token: oldAccessToken,
      refresh_token: oldRefreshToken,
      token_type: "bearer",
    });

    const initialAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
    });
    expect(initialAccount).not.toBeNull();

    // Reconnection with new OAuth credentials
    const newAccessToken = "gho_brand_new_fresh_access_token_999";
    const newRefreshToken = "ghr_brand_new_fresh_refresh_token_888";

    const reconnectResult = await handleAccountLinking({
      email: user.email,
      provider: "github",
      providerAccountId,
      isEmailVerified: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    expect(reconnectResult.allowed).toBe(true);
    expect(reconnectResult.userId).toBe(user.id);

    const updatedAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
    });

    // The SAME Account row is updated
    expect(updatedAccount!.id).toBe(initialAccount!.id);
    // Access token changes
    expect(updatedAccount!.accessToken).not.toBe(initialAccount!.accessToken);
    expect(decryptToken(updatedAccount!.accessToken!)).toBe(newAccessToken);
    // Refresh token changes
    expect(updatedAccount!.refreshToken).not.toBe(initialAccount!.refreshToken);
    expect(decryptToken(updatedAccount!.refreshToken!)).toBe(newRefreshToken);
    // Plaintext credentials are never stored
    expect(updatedAccount!.accessToken).not.toBe(newAccessToken);
    expect(updatedAccount!.refreshToken).not.toBe(newRefreshToken);
  });

  // Test 3 — Provider omits refresh token
  it("Test 3: Preserves existing valid refresh token when provider omits refresh token on reconnect", async () => {
    const user = await adapter.createUser!({
      id: "",
      email: `gh_omit_refresh_${Date.now()}@example.com`,
      name: "GitHub Omit Refresh User",
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    const providerAccountId = `gh_omit_acc_${Date.now()}`;
    const initialAccess = "gho_initial_access_111";
    const validRefresh = "ghr_valid_persistent_refresh_token";

    await adapter.linkAccount!({
      userId: user.id,
      provider: "github",
      providerAccountId,
      type: "oauth",
      access_token: initialAccess,
      refresh_token: validRefresh,
      token_type: "bearer",
    });

    // Reconnection where refresh_token is omitted (null/undefined)
    const subsequentAccess = "gho_subsequent_access_222";
    await handleAccountLinking({
      email: user.email,
      provider: "github",
      providerAccountId,
      isEmailVerified: true,
      accessToken: subsequentAccess,
      // refresh token omitted
    });

    const account = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
    });

    expect(decryptToken(account!.accessToken!)).toBe(subsequentAccess);
    // Existing valid refresh token is NOT replaced with null
    expect(account!.refreshToken).not.toBeNull();
    expect(decryptToken(account!.refreshToken!)).toBe(validRefresh);
  });

  // Test 4 — Token expiry
  it("Test 4: Correctly updates expires_at when a new expiration value is provided", async () => {
    const user = await adapter.createUser!({
      id: "",
      email: `gh_expiry_test_${Date.now()}@example.com`,
      name: "GitHub Expiry User",
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    const providerAccountId = `gh_exp_acc_${Date.now()}`;
    const initialExpiry = Math.floor(Date.now() / 1000) + 1800; // 30 min

    await adapter.linkAccount!({
      userId: user.id,
      provider: "github",
      providerAccountId,
      type: "oauth",
      access_token: "gho_expiry_access",
      expires_at: initialExpiry,
      token_type: "bearer",
    });

    const updatedExpiry = Math.floor(Date.now() / 1000) + 28800; // 8 hours
    await handleAccountLinking({
      email: user.email,
      provider: "github",
      providerAccountId,
      isEmailVerified: true,
      expiresAt: updatedExpiry,
    });

    const account = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
    });

    expect(account!.expiresAt).toBe(BigInt(updatedExpiry));
  });

  // Test 5 — Duplicate prevention
  it("Test 5: Repeated GitHub authentications do not create multiple Account records for same identity", async () => {
    const user = await adapter.createUser!({
      id: "",
      email: `gh_idempotency_${Date.now()}@example.com`,
      name: "GitHub Idempotency User",
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    const providerAccountId = `gh_unique_acc_${Date.now()}`;

    // Multiple connections with the same identity
    for (let i = 1; i <= 3; i++) {
      await handleAccountLinking({
        email: user.email,
        provider: "github",
        providerAccountId,
        isEmailVerified: true,
        accessToken: `gho_token_iteration_${i}`,
      });

      await adapter.linkAccount!({
        userId: user.id,
        provider: "github",
        providerAccountId,
        type: "oauth",
        access_token: `gho_token_iteration_${i}`,
        token_type: "bearer",
      });
    }

    const matchingAccounts = await db.account.findMany({
      where: {
        provider: "github",
        providerAccountId,
      },
    });

    expect(matchingAccounts).toHaveLength(1);
    expect(decryptToken(matchingAccounts[0]!.accessToken!)).toBe("gho_token_iteration_3");
  });

  // Test 6 — Revoked credentials
  it("Test 6: Returns UNAUTHENTICATED and user-friendly reconnect message when GitHub API returns 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers(),
    } as any);

    let caughtError: any;
    try {
      await gitHubApiClient.getUserProfile("gho_stale_or_revoked_token");
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(AppError);
    expect(caughtError.code).toBe("UNAUTHENTICATED");
    expect(caughtError.message).toBe(
      "GitHub authorization has expired or was revoked. Please reconnect your GitHub account.",
    );
  });

  // Test 7 — Successful sync after reconnect
  it("Test 7: Stale token fails with 401 -> reconnect persists new token -> GitHub API sync succeeds", async () => {
    const user = await adapter.createUser!({
      id: "",
      email: `gh_full_lifecycle_${Date.now()}@example.com`,
      name: "GitHub Full Lifecycle User",
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    const providerAccountId = `gh_full_acc_${Date.now()}`;
    const staleToken = "gho_stale_token_before_reconnect";

    // 1. Initial link with stale token
    await adapter.linkAccount!({
      userId: user.id,
      provider: "github",
      providerAccountId,
      type: "oauth",
      access_token: staleToken,
      token_type: "bearer",
    });

    // 2. Proactive check fails with 401
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers(),
    } as any);

    await expect(gitHubApiClient.getUserProfile(staleToken)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });

    // 3. User reconnects -> OAuth callback receives fresh token -> handleAccountLinking updates DB
    const freshToken = "gho_fresh_reconnected_token_after_oauth";
    const reconnectResult = await handleAccountLinking({
      email: user.email,
      provider: "github",
      providerAccountId,
      isEmailVerified: true,
      accessToken: freshToken,
    });
    expect(reconnectResult.allowed).toBe(true);

    // 4. Stored token in DB is now the encrypted fresh token
    const retrievedToken = await getDecryptedAccessToken(user.id, "github");
    expect(retrievedToken).toBe(freshToken);

    // 5. Subsequent sync call with fresh token succeeds (HTTP 200)
    const mockUserPayload = {
      id: 987654,
      login: "reconnected-dev",
      name: "Reconnected Developer",
      avatar_url: "https://avatars.githubusercontent.com/u/987654",
      bio: "Active developer",
      public_repos: 15,
      followers: 25,
      following: 5,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2026-09-11T00:00:00Z",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUserPayload,
      headers: new Headers(),
    } as any);

    const profile = await gitHubApiClient.getUserProfile(retrievedToken!);
    expect(profile.login).toBe("reconnected-dev");
    expect(profile.publicRepos).toBe(15);
  });
});
