"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { CatalogsListResponse } from "./types";

async function fetchCatalogs(tenantId: string): Promise<CatalogsListResponse> {
  const { data } = await apiClient.get<CatalogsListResponse>(`/api/tenants/${tenantId}/catalogs`);
  return data;
}

export function useCatalogs(tenantId: string | null) {
  return useQuery({
    queryKey: ["catalogs", tenantId],
    queryFn: () => fetchCatalogs(tenantId as string),
    enabled: Boolean(tenantId),
  });
}
