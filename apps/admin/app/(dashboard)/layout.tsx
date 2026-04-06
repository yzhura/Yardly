import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardMotion } from "@/components/layout/dashboard-motion";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { me, activeMembership } = await requireActiveMembership();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          tenantName={activeMembership.tenant.name}
          userEmail={me.user.email}
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
            <DashboardMotion>{children}</DashboardMotion>
          </div>
        </main>
      </div>
    </div>
  );
}
