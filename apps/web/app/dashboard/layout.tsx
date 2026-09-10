import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/server/repositories/UserRepository";
import { Sidebar } from "@/components/ui/Sidebar";
import { Topbar } from "@/components/ui/Topbar";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";

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
      {/* desktop sidebar */}
      <Sidebar />

      {/* content wrapper */}
      <div className="lg:pl-64 pl-0 pb-20 lg:pb-0 min-h-screen flex flex-col">
        {/* topbar */}
        <Topbar
          userName={session.user.name ?? "Developer"}
          userImage={session.user.image ?? undefined}
        />

        {/* main view */}
        <main className="w-full pt-16 bg-[#13131b] flex-1">
          {children}
        </main>
      </div>

      {/* mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
