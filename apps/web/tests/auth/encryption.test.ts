import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  encryptToken,
  decryptToken,
} from "@/server/auth/encryption";

const VALID_TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("OAuth Token Encryption (AES-256-GCM)", () => {
  const originalKey = process.env.TOKEN_ENCRYPTION_KEY;
  const originalGhKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = VALID_TEST_KEY;
  });

  afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = originalGhKey;
  });

  it("successfully encrypts and decrypts a plaintext OAuth token (round-trip)", () => {
    const plaintext = "gho_16C7e42F292c6912E7710c838347Ae178B4a";
    const ciphertext = encryptToken(plaintext);

    expect(ciphertext).toBeDefined();
    expect(ciphertext).not.toBe(plaintext);
    expect(decryptToken(ciphertext)).toBe(plaintext);
  });

  it("stores ciphertext in the standard iv.ciphertext.tag hex format", () => {
    const plaintext = "ya29.a0AfH6SMB_GoogleOAuthAccessTokenExample123";
    const encrypted = encryptToken(plaintext);
    const parts = encrypted.split(".");

    expect(parts).toHaveLength(3);
    const [ivHex, cipherHex, tagHex] = parts;

    // 12-byte iv (24 hex chars)
    expect(ivHex).toHaveLength(24);
    // 16-byte auth tag (32 hex chars)
    expect(tagHex).toHaveLength(32);
    // non-empty ciphertext hex
    expect(cipherHex!.length).toBeGreaterThan(0);
    expect(/^[0-9a-f]+$/i.test(ivHex!)).toBe(true);
    expect(/^[0-9a-f]+$/i.test(cipherHex!)).toBe(true);
    expect(/^[0-9a-f]+$/i.test(tagHex!)).toBe(true);
  });

  it("uses a unique nonce/IV per encryption operation (same plaintext produces different ciphertexts)", () => {
    const plaintext = "ghr_identical_refresh_token_example";
    const enc1 = encryptToken(plaintext);
    const enc2 = encryptToken(plaintext);

    expect(enc1).not.toBe(enc2);
    const [iv1] = enc1.split(".");
    const [iv2] = enc2.split(".");
    expect(iv1).not.toBe(iv2);

    // should decrypt to same plaintext
    expect(decryptToken(enc1)).toBe(plaintext);
    expect(decryptToken(enc2)).toBe(plaintext);
  });

  it("fails safely when ciphertext has been tampered with (integrity validation)", () => {
    const plaintext = "sensitive_oauth_access_token";
    const encrypted = encryptToken(plaintext);
    const parts = encrypted.split(".");

    // flip bit in ciphertext
    const tamperedCipher = parts[1]!.slice(0, -2) + (parts[1]!.endsWith("a") ? "b" : "a");
    const tampered = [parts[0], tamperedCipher, parts[2]].join(".");

    expect(() => decryptToken(tampered)).toThrow();
  });

  it("fails safely when authentication tag has been tampered with", () => {
    const plaintext = "sensitive_oauth_token";
    const encrypted = encryptToken(plaintext);
    const parts = encrypted.split(".");

    // fake auth tag
    const badTag = "0".repeat(32);
    const tampered = [parts[0], parts[1], badTag].join(".");

    expect(() => decryptToken(tampered)).toThrow();
  });

  it("fails safely on invalid format or corrupted segments", () => {
    expect(() => decryptToken("invalid_format_string")).toThrow(
      "Invalid encrypted token format",
    );
    expect(() => decryptToken("part1.part2")).toThrow(
      "Invalid encrypted token format",
    );
    expect(() => decryptToken("..")).toThrow(
      "Invalid encrypted token format",
    );
  });

  it("fails safely when encryption key is missing", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

    expect(() => encryptToken("some_token")).toThrow(
      "TOKEN_ENCRYPTION_KEY is required",
    );
  });

  it("fails safely when encryption key is invalid length (not 32 bytes / 64 hex chars)", () => {
    process.env.TOKEN_ENCRYPTION_KEY = "short_invalid_key";

    expect(() => encryptToken("some_token")).toThrow(
      "TOKEN_ENCRYPTION_KEY must be a 64-character hex string",
    );
  });
});
