import { authOptions, auth } from "./server/auth";

export {
  authOptions,
  auth,
  encryptToken,
  decryptToken,
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
  deleteAccount,
  validateAndRotateSession,
  handleAccountLinking,
} from "./server/auth";

export default auth;
