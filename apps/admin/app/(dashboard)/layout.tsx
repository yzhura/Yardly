import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardMotion } from "@/components/layout/dashboard-motion";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";
import { buildGreetingFirstName } from "@/lib/dashboard-header-greeting";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { me, activeMembership } = await requireActiveMembership();
  const greetingFirstName = buildGreetingFirstName(me.user.firstName);
  let tenantName = activeMembership.tenant.name;
  let tenantLogoUrl: string | null = null;
  const token = await getServerAccessToken();
  if (token) {
    const res = await fetch(
      `${getApiBaseUrl()}/tenants/${activeMembership.tenant.id}/settings`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        tenant?: { name?: string; resolvedLogoUrl?: string | null };
      };
      tenantName = data.tenant?.name ?? tenantName;
      tenantLogoUrl = data.tenant?.resolvedLogoUrl ?? null;
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar tenantName={tenantName} tenantLogoUrl={tenantLogoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          tenantName={tenantName}
          tenantLogoUrl={tenantLogoUrl}
          userEmail={me.user.email}
          userDisplayName={me.user.displayName ?? null}
          userAvatarUrl={me.user.resolvedAvatarUrl ?? null}
          greetingFirstName={greetingFirstName}
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <DashboardMotion>{children}</DashboardMotion>
          </div>
        </main>
      </div>
    </div>
  );
}
