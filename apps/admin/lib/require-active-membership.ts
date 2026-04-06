import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";
import { requireAuthMe } from "@/lib/auth-server";

export async function requireActiveMembership() {
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

  return { me, activeMembership };
}
