import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { db } from "@/lib/prisma";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce for gcm
const TAG_BYTES = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex =
    process.env.TOKEN_ENCRYPTION_KEY || process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!hex) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is required for token encryption. Please set a 64-character hex string (32 bytes).",
    );
  }

  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).",
    );
  }

  return Buffer.from(hex, "hex");
}

// encrypts string to iv.ciphertext.tag using aes-256-gcm
export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    ciphertext.toString("hex"),
    tag.toString("hex"),
  ].join(".");
}

// decrypts iv.ciphertext.tag and verifies the auth tag
export function decryptToken(stored: string): string {
  if (!stored) return stored;
  const parts = stored.split(".");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted token format. Expected iv.ciphertext.tag.",
    );
  }

  const [ivHex, ciphertextHex, tagHex] = parts;
  if (!ivHex || !ciphertextHex || !tagHex) {
    throw new Error("Invalid encrypted token format. Missing segments.");
  }

  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  if (iv.length !== IV_BYTES) {
    throw new Error(`Invalid IV length: expected ${IV_BYTES} bytes.`);
  }
  if (tag.length !== TAG_BYTES) {
    throw new Error(`Invalid tag length: expected ${TAG_BYTES} bytes.`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

// read and decrypt oauth access token
export async function getDecryptedAccessToken(
  userId: string,
  provider: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, provider },
    select: { accessToken: true },
  });

  if (!account?.accessToken) return null;

  try {
    return decryptToken(account.accessToken);
  } catch {
    throw new Error(
      `Failed to decrypt ${provider} access token for user ${userId}. ` +
        "The token may be corrupted or the encryption key has rotated. " +
        "Prompt the user to reconnect their account.",
    );
  }
}

// read and decrypt oauth refresh token
export async function getDecryptedRefreshToken(
  userId: string,
  provider: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, provider },
    select: { refreshToken: true },
  });

  if (!account?.refreshToken) return null;

  try {
    return decryptToken(account.refreshToken);
  } catch {
    throw new Error(
      `Failed to decrypt ${provider} refresh token for user ${userId}. ` +
        "The token may be corrupted or the encryption key has rotated. " +
        "Prompt the user to reconnect their account.",
    );
  }
}
