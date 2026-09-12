import { db } from "@/lib/prisma";
import { env } from "@/lib/env";
import { decryptToken, encryptToken } from "./encryption";
import { logger } from "@/server/logging/logger";
import { getCorrelationId } from "@/server/logging/correlationStore";

/**
 * Refreshes an expired GitHub OAuth access token using the stored refresh token.
 * If there’s no refresh token (as with standard OAuth apps), or the refresh token
 * has been revoked, returns null so the caller can prompt the user to sign in again.
 */

export async function refreshGitHubAccessToken(
  userId: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
  });

  if (!account?.refreshToken) {
    return null;
  }

  let decryptedRefreshToken: string;
  try {
    decryptedRefreshToken = decryptToken(account.refreshToken);
  } catch {
    logger.warn(
      { userId, provider: "github", correlationId: getCorrelationId() },
      "Failed to decrypt stored GitHub refresh token",
    );
    return null;
  }

  const clientId =
    process.env.GITHUB_CLIENT_ID ||
    (process.env.NODE_ENV !== "test" ? env.GITHUB_CLIENT_ID : "");
  const clientSecret =
    process.env.GITHUB_CLIENT_SECRET ||
    (process.env.NODE_ENV !== "test" ? env.GITHUB_CLIENT_SECRET : "");

  if (!clientId || !clientSecret) {
    logger.warn(
      { userId, correlationId: getCorrelationId() },
      "GitHub OAuth client credentials missing for token refresh",
    );
    return null;
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: decryptedRefreshToken,
        }),
      },
    );

    if (!response.ok) {
      logger.warn(
        { userId, status: response.status, correlationId: getCorrelationId() },
        "GitHub token refresh request returned non-OK HTTP status",
      );
      return null;
    }

    const data = await response.json();

    if (data.error || !data.access_token) {
      logger.warn(
        {
          userId,
          error: data.error,
          errorDescription: data.error_description,
          correlationId: getCorrelationId(),
        },
        "GitHub rejected OAuth refresh token request",
      );
      return null;
    }

    const encryptedNewAccess = encryptToken(data.access_token);
    const encryptedNewRefresh = data.refresh_token
      ? encryptToken(data.refresh_token)
      : account.refreshToken;

    const expiresAt = data.expires_in
      ? BigInt(Math.floor(Date.now() / 1000) + Number(data.expires_in))
      : account.expiresAt;

    await db.account.update({
      where: { id: account.id },
      data: {
        accessToken: encryptedNewAccess,
        refreshToken: encryptedNewRefresh,
        expiresAt,
        tokenType: data.token_type ?? account.tokenType,
        scope: data.scope ?? account.scope,
      },
    });

    logger.info(
      {
        userId,
        providerAccountId: account.providerAccountId,
        correlationId: getCorrelationId(),
      },
      "GitHub OAuth token refreshed and persisted successfully",
    );

    return data.access_token;
  } catch (err) {
    logger.warn(
      {
        userId,
        error: err instanceof Error ? err.message : String(err),
        correlationId: getCorrelationId(),
      },
      "Network exception during GitHub OAuth token refresh",
    );
    return null;
  }
}
