import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";
import { requireAuthMe } from "@/lib/auth-server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me = await requireAuthMe();

  if (me.memberships.length === 0) {
    redirect("/setup-tenant");
  }

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const activeMembership = activeTenantId
    ? me.memberships.find((m) => m.tenant.id === activeTenantId)
    : undefined;

  if (!activeMembership) {
    redirect("/select-organization");
  }

  const canInvite =
    activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          tenantName={activeMembership.tenant.name}
          userEmail={me.user.email}
          canInvite={canInvite}
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
