import { requireActiveMembership } from "@/lib/require-active-membership";
import { MaterialsView } from "@/components/materials/materials-view";

export default async function MaterialsPage() {
  const { me, activeMembership } = await requireActiveMembership();
  const canManage = activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <MaterialsView
      tenantId={activeMembership.tenant.id}
      currentUserId={me.user.id}
      canManage={canManage}
      actorRole={activeMembership.role}
    />
  );
}
