import { auth } from "./server/auth";

export {
  authOptions,
  auth,
  encryptToken,
  decryptToken,
  isEncryptedToken,
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
  deleteAccount,
  validateAndRotateSession,
  handleAccountLinking,
  refreshGitHubAccessToken,
} from "./server/auth";

export default auth;
