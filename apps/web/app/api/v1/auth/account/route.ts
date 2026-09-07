import { auth } from "@/auth";
import { deleteAccount } from "@/server/auth/deletion";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

// deletes account, invalidates sessions, and clears auth cookies
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

    // clear auth cookies
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
