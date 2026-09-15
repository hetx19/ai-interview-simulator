export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Developer login is disabled in production environment." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email?.trim() as string) || "developer@devmetric.io";

    // 1. Look for existing user by email
    let user = await db.user.findFirst({
      where: { email, deletedAt: null },
    });

    // 2. If no user exists with this email, create a new user profile
    if (!user) {
      const baseUsername =
        email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "developer";

      user = await db.user.create({
        data: {
          email,
          name: "Developer User",
          username: `${baseUsername}_dev`.slice(0, 50),
          role: "user",
          onboardingCompleted: true,
          onboardingStep: "COMPLETED",
          targetCompanies: ["Google", "Meta", "Amazon"],
        },
      });
    }

    // 3. Ensure onboardingCompleted is marked true so dashboard gate passes
    if (!user.onboardingCompleted) {
      user = await db.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true, onboardingStep: "COMPLETED" },
      });
    }

    // 4. Create active database session for NextAuth
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    const cookieName = "next-auth.session-token";

    const response = NextResponse.json({
      success: true,
      message: "Developer session created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // 5. Attach NextAuth session token cookie
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      expires,
    });

    return response;
  } catch (error: any) {
    console.error("[dev-login] Error creating developer session:", error);
    return NextResponse.json(
      { error: "Failed to authenticate developer credentials", message: error.message },
      { status: 500 }
    );
  }
}
