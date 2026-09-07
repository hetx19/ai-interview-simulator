import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    sessionToken?: string;
  }

  interface User extends DefaultUser {
    id: string;
  }
}
