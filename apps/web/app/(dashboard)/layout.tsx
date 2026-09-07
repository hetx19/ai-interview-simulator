import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/server/repositories/UserRepository";

// ---------------------------------------------------------------------------
// Dashboard layout — server-side auth & onboarding gate.
//
// Responsibility: HTTP-level concerns only.
//   ✓ Verify session exists (auth()).
//   ✓ Check onboarding completion via UserRepository (no raw db.* calls).
//   ✓ Redirect unauthenticated / incomplete users.
//
// Skills.md §4 (Separation of Concerns):
//   "Business logic lives in services, not in API routes or UI components."
//   This layout performs no business logic — it delegates data access to the
//   repository layer and acts on the result.
// ---------------------------------------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Use the focused repository projection — only the single boolean field
  // needed here is fetched. The full User row is never loaded.
  const gate = await userRepository.findDashboardGate(session.user.id);

  if (!gate) {
    // User row is gone (deleted between session check and this query).
    redirect("/login");
  }

  if (!gate.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
