"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ProductResponse } from "./types";

export type UseProductParams = {
  tenantId: string | null;
  productId: string | null;
};

async function fetchProduct(tenantId: string, productId: string): Promise<ProductResponse> {
  const { data } = await apiClient.get<ProductResponse>(`/api/tenants/${tenantId}/products/${productId}`);
  return data;
}

export function useProduct({ tenantId, productId }: UseProductParams) {
  return useQuery({
    queryKey: ["product", tenantId, productId],
    queryFn: () => fetchProduct(tenantId as string, productId as string),
    enabled: Boolean(tenantId && productId),
  });
}
