import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/server/repositories/UserRepository";
import { Sidebar } from "@/components/ui/Sidebar";
import { Topbar } from "@/components/ui/Topbar";

// auth and onboarding gate for dashboard shell
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const gate = await userRepository.findDashboardGate(session.user.id);

  if (!gate) {
    redirect("/login");
  }

  if (!gate.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#13131b]">
      {/* sidebar */}
      <Sidebar />

      {/* content */}
      <div className="pl-64">
        {/* topbar */}
        <Topbar
          userName={session.user.name ?? "Developer"}
          userImage={session.user.image ?? undefined}
        />

        {/* main view */}
        <main className="w-full pt-16 bg-[#13131b] min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
