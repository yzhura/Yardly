import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/require-active-membership";
import { ProductsView } from "@/components/products/products-view";
import { ProductsPageSkeleton } from "@/components/products/products-page-skeleton";

export default async function ProductsPage() {
  const { activeMembership } = await requireActiveMembership();
  const canManage = activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsView tenantId={activeMembership.tenant.id} canManage={canManage} />
    </Suspense>
  );
}
