import { auth } from "@/auth";
import { userRepository } from "@/server/repositories/UserRepository";
import { NextResponse } from "next/server";
import { z } from "zod";

// persists onboarding step transitions
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
  // verify authenticated session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required." },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // validate request body
  const body = await req.json().catch(() => null);
  const parsed = PatchOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const { step, completed } = parsed.data;

  // allow google-only users to proceed without forcing github
  if (step !== "CONNECT_GITHUB") {
    const hasAccount = await userRepository.hasAnyLinkedAccount(userId);

    if (!hasAccount) {
      // sanity check: user must have at least one linked account
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
