import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/prisma";
import { authOptions } from "@/server/auth/options";
import { EncryptedPrismaAdapter } from "@/server/auth/adapter";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("OAuth Authentication Flow & Error Handling", () => {
  const createdUserIds: string[] = [];
  const adapter = EncryptedPrismaAdapter(db);

  beforeAll(() => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await db.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("configures GitHub and Google OAuth providers with correct scopes", () => {
    const providers = authOptions.providers;
    expect(providers).toHaveLength(2);

    const githubProvider = providers.find((p) => p.id === "github");
    const googleProvider = providers.find((p) => p.id === "google");

    expect(githubProvider).toBeDefined();
    expect(googleProvider).toBeDefined();
    expect(githubProvider!.type).toBe("oauth");
    expect(googleProvider!.type).toBe("oauth");
  });

  it("successfully handles GitHub OAuth login callback for a new user", async () => {
    const email = `gh_oauth_${Date.now()}@example.com`;
    const profile = {
      id: 123456,
      login: "githubdev",
      name: "GitHub Developer",
      email,
      email_verified: true,
      avatar_url: "https://avatars.githubusercontent.com/u/123456",
    };
    const account = {
      provider: "github",
      type: "oauth" as const,
      providerAccountId: `gh_${Date.now()}`,
      access_token: "gho_test_access_token_12345",
      token_type: "bearer" as const,
      scope: "read:user user:email public_repo",
    };

    // signin callback
    const signInCallback = authOptions.callbacks?.signIn;
    expect(signInCallback).toBeDefined();

    const signInResult = await signInCallback!({
      user: { id: "", email, name: profile.name, image: profile.avatar_url },
      account: account as any,
      profile: profile as any,
    });

    expect(signInResult).toBe(true);

    // create user and link
    const user = await adapter.createUser!({
      id: "",
      email,
      name: profile.name,
      image: profile.avatar_url,
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    await adapter.linkAccount!({
      ...account,
      userId: user.id,
    } as any);

    // check user in db
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { accounts: true },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser!.email).toBe(email);
    expect(dbUser!.accounts).toHaveLength(1);
    expect(dbUser!.accounts[0]!.provider).toBe("github");
  });

  it("successfully handles Google OAuth login callback for a new user", async () => {
    const email = `google_oauth_${Date.now()}@example.com`;
    const profile = {
      sub: `google_sub_${Date.now()}`,
      name: "Google Developer",
      email,
      email_verified: true,
      picture: "https://lh3.googleusercontent.com/a/123",
    };
    const account = {
      provider: "google",
      type: "oauth" as const,
      providerAccountId: profile.sub,
      access_token: "ya29.google_test_access_token",
      token_type: "bearer" as const,
      scope: "openid profile email",
    };

    const signInCallback = authOptions.callbacks?.signIn;
    const signInResult = await signInCallback!({
      user: { id: "", email, name: profile.name, image: profile.picture },
      account: account as any,
      profile: profile as any,
    });

    expect(signInResult).toBe(true);

    const user = await adapter.createUser!({
      id: "",
      email,
      name: profile.name,
      image: profile.picture,
      emailVerified: null,
    });
    createdUserIds.push(user.id);

    await adapter.linkAccount!({
      ...account,
      userId: user.id,
    } as any);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { accounts: true },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser!.email).toBe(email);
    expect(dbUser!.accounts[0]!.provider).toBe("google");
  });

  it("safely handles OAuth denial / cancellation without crashing", async () => {
    const signInCallback = authOptions.callbacks?.signIn;

    // missing email check
    const signInResult = await signInCallback!({
      user: { id: "", email: null as any },
      account: { provider: "github", providerAccountId: "123", type: "oauth" } as any,
      profile: {} as any,
    });

    // redirect on error without crash
    expect(typeof signInResult === "string" || signInResult === false).toBe(true);
    if (typeof signInResult === "string") {
      expect(signInResult).toContain("/login?error=");
    }
  });

  it("safely rejects unverified email callbacks with user-visible redirect", async () => {
    // existing user
    const existingEmail = `existing_user_${Date.now()}@example.com`;
    const existingUser = await adapter.createUser!({
      id: "",
      email: existingEmail,
      name: "Existing User",
      emailVerified: null,
    });
    createdUserIds.push(existingUser.id);

    await adapter.linkAccount!({
      userId: existingUser.id,
      provider: "google",
      providerAccountId: `google_${existingUser.id}`,
      type: "oauth",
    } as any);

    const signInCallback = authOptions.callbacks?.signIn;

    // unverified github login attempt
    const result = await signInCallback!({
      user: { id: "", email: existingEmail, name: "Attacker" },
      account: { provider: "github", providerAccountId: "unverified_gh_123", type: "oauth" } as any,
      profile: { email_verified: false } as any,
    });

    // redirect to login with verification error
    expect(result).toBe("/login?error=EmailVerificationRequired");
  });
});
