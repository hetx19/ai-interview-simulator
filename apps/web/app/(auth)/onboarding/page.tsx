import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    include: {
      accounts: { select: { provider: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.onboardingCompleted) {
    redirect("/dashboard");
  }

  const githubConnected = user.accounts.some((a) => a.provider === "github");

  return (
    <OnboardingWizard
      initialStep={
        (user.onboardingStep as
          | "CONNECT_GITHUB"
          | "SET_LEETCODE"
          | "UPLOAD_RESUME"
          | "COMPLETE") ?? "CONNECT_GITHUB"
      }
      githubConnected={githubConnected}
    />
  );
}
