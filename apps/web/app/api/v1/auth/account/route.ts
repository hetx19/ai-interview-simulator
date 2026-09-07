import { auth } from "@/auth";
import { deleteAccount } from "@/server/auth/deletion";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

/**
 * DELETE /api/v1/auth/account
 *
 * Account deletion endpoint (Stage 2):
 * 1. Verifies the caller is authenticated.
 * 2. Invalidates all active authentication sessions for the user.
 * 3. Records deletion intent on the user record (deletedAt timestamp).
 * 4. Expires the session cookies in the response so the browser cannot continue authenticating.
 */
export async function DELETE(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    await deleteAccount(userId);

    const response = NextResponse.json(
      { message: "Account deleted successfully." },
      { status: 200 },
    );

    // Clear session cookies in the browser
    for (const cookieName of SESSION_COOKIE_NAMES) {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error("[DELETE /api/v1/auth/account]", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to delete account." },
      { status: 500 },
    );
  }
}
