import { auth } from "@/auth";
import { userRepository } from "@/server/repositories/UserRepository";
import { NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// PATCH /api/v1/user/onboarding
//
// Persists an onboarding step transition for the authenticated user.
//
// Business rules (per PRD US-002 and US-003):
//   - Users who signed up via Google (and have not linked GitHub) must be
//     allowed to complete onboarding without a GitHub account.
//   - The CONNECT_GITHUB step itself remains optional — advancing past it
//     still succeeds even if no GitHub account is linked, because the user
//     may have signed up via Google and chosen to skip GitHub connection.
//   - Only a hard prerequisite (no account of *any* provider) would block
//     advancement, which is unreachable in practice (the user is already
//     authenticated).
// ---------------------------------------------------------------------------

const VALID_STEPS = [
  "CONNECT_GITHUB",
  "SET_LEETCODE",
  "UPLOAD_RESUME",
  "COMPLETE",
] as const;

const PatchOnboardingSchema = z.object({
  step: z.enum(VALID_STEPS),
  completed: z.boolean(),
});

export async function PATCH(req: Request): Promise<NextResponse> {
  // Defense-in-depth: authoritative DB-backed auth check.
  // The middleware only verifies cookie presence; this confirms the session
  // exists in the database.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // Parse and validate the request body.
  const body = await req.json().catch(() => null);
  const parsed = PatchOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const { step, completed } = parsed.data;

  // PRD US-002 fix:
  // Previously this check required a GitHub account for any step != CONNECT_GITHUB,
  // permanently blocking users who signed up via Google OAuth.
  //
  // Correct behaviour: only the *GitHub-specific features* (sync, score) require
  // a GitHub account. The onboarding wizard itself must be completable by any
  // authenticated user regardless of their OAuth provider.
  //
  // We therefore only block advancement if the user somehow has no linked
  // OAuth account at all — a state that is theoretically impossible for an
  // authenticated user, but we guard it as belt-and-suspenders.
  if (step !== "CONNECT_GITHUB") {
    const hasAccount = await userRepository.hasAnyLinkedAccount(userId);

    if (!hasAccount) {
      // This branch is unreachable for a properly authenticated user, but
      // we fail closed rather than failing open.
      return NextResponse.json(
        {
          error: "PRECONDITION_FAILED",
          message: "No linked OAuth account found. Please sign in again.",
        },
        { status: 412 },
      );
    }
  }

  await userRepository.updateOnboardingStep(userId, step, completed);

  return NextResponse.json({ step, completed }, { status: 200 });
}
