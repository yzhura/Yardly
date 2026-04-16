"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { MaterialCategoriesResponse } from "./types";

async function getMaterialCategories(
  tenantId: string,
): Promise<MaterialCategoriesResponse> {
  const { data } = await apiClient.get<MaterialCategoriesResponse>(
    `/api/tenants/${tenantId}/material-categories`,
  );
  return data;
}

export function useMaterialCategories(tenantId: string | null) {
  return useQuery({
    queryKey: ["material-categories", tenantId],
    queryFn: () => getMaterialCategories(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

