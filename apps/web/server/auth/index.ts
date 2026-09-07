import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export { authOptions } from "./options";
export {
  encryptToken,
  decryptToken,
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
} from "./encryption";
export { deleteAccount } from "./deletion";
export { validateAndRotateSession } from "./session";
export { handleAccountLinking } from "./linking";
export { EncryptedPrismaAdapter } from "./adapter";

/**
 * Server-side helper to retrieve the authenticated session in Server Components,
 * Route Handlers, and Server Actions.
 */
export async function auth() {
  return await getServerSession(authOptions);
}
