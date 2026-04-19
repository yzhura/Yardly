import { requireActiveMembership } from "@/lib/require-active-membership";
import { CatalogsView } from "@/components/catalogs/catalogs-view";

export default async function CatalogsPage() {
  const { activeMembership } = await requireActiveMembership();
  const canManage = activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="px-1 pb-10 pt-2 sm:px-0">
      <CatalogsView tenantId={activeMembership.tenant.id} canManage={canManage} />
    </div>
  );
}
