"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ProductListQuery, ProductsListResponse } from "./types";

export type UseProductsListParams = {
  tenantId: string | null;
  query: ProductListQuery;
};

function buildParams(query: ProductListQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.page != null && query.page > 1) params.page = String(query.page);
  if (query.pageSize != null) params.pageSize = String(query.pageSize);
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;
  if (query.status) params.status = query.status;
  if (query.q) params.q = query.q;
  if (query.catalogId) params.catalogId = query.catalogId;
  return params;
}

async function fetchProductsList(tenantId: string, query: ProductListQuery): Promise<ProductsListResponse> {
  const { data } = await apiClient.get<ProductsListResponse>(`/api/tenants/${tenantId}/products`, {
    params: buildParams(query),
  });
  return data;
}

export function useProductsList({ tenantId, query }: UseProductsListParams) {
  return useQuery({
    queryKey: ["products", tenantId, query],
    queryFn: () => fetchProductsList(tenantId as string, query),
    enabled: Boolean(tenantId),
  });
}
