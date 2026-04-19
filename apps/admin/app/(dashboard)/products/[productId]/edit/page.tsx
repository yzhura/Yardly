import { requireActiveMembership } from "@/lib/require-active-membership";
import { ProductFormView } from "@/components/products/product-form-view";

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;
  const { activeMembership } = await requireActiveMembership();
  const canManage = activeMembership.role === "OWNER" || activeMembership.role === "ADMIN";

  return (
    <div className="px-1 pb-10 pt-2 sm:px-0">
      <ProductFormView
        tenantId={activeMembership.tenant.id}
        canManage={canManage}
        mode="edit"
        productId={productId}
      />
    </div>
  );
}
