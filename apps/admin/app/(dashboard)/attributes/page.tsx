import { AttributesView } from "@/components/attributes/attributes-view";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function AttributesPage() {
  const { activeMembership } = await requireActiveMembership();
  const canManage = activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return <AttributesView tenantId={activeMembership.tenant.id} canManage={canManage} />;
}

