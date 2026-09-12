import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export { authOptions } from "./options";
export {
  encryptToken,
  decryptToken,
  isEncryptedToken,
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
} from "./encryption";
export { deleteAccount } from "./deletion";
export { validateAndRotateSession } from "./session";
export { handleAccountLinking } from "./linking";
export { EncryptedPrismaAdapter } from "./adapter";
export { refreshGitHubAccessToken } from "./tokenRefresh";

// session helper for server components and routes
export async function auth() {
  return await getServerSession(authOptions);
}
