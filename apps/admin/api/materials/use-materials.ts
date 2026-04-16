"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Material, MaterialsResponse, MaterialStockStatus } from "./types";

type MaterialListFilters = {
  q?: string;
  categoryId?: string;
  colorId?: string;
};

export type UseMaterialsParams = {
  tenantId: string | null;
  filters?: MaterialListFilters;
};

async function getMaterials(
  tenantId: string,
  filters?: MaterialListFilters,
): Promise<MaterialsResponse> {
  const params: Record<string, string> = {};
  if (filters?.q) params.q = filters.q;
  if (filters?.categoryId) params.categoryId = filters.categoryId;
  if (filters?.colorId) params.colorId = filters.colorId;

  const { data } = await apiClient.get<MaterialsResponse>(
    `/api/tenants/${tenantId}/materials`,
    { params },
  );
  return data;
}

export function useMaterials({ tenantId, filters }: UseMaterialsParams) {
  return useQuery({
    queryKey: ["materials", tenantId, filters ?? {}],
    queryFn: () => getMaterials(tenantId as string, filters),
    enabled: Boolean(tenantId),
  });
}

export type { Material, MaterialStockStatus };

