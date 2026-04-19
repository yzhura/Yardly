import { requireActiveMembership } from "@/lib/require-active-membership";
import { ProductFormView } from "@/components/products/product-form-view";

export default async function NewProductPage() {
  const { activeMembership } = await requireActiveMembership();
  const canManage = activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="px-1 pb-10 pt-2 sm:px-0">
      <ProductFormView tenantId={activeMembership.tenant.id} canManage={canManage} mode="create" />
    </div>
  );
}
