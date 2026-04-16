"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ColorsResponse } from "./types";

async function getColors(tenantId: string): Promise<ColorsResponse> {
  const { data } = await apiClient.get<ColorsResponse>(
    `/api/tenants/${tenantId}/colors`,
  );
  return data;
}

export function useColors(tenantId: string | null) {
  return useQuery({
    queryKey: ["colors", tenantId],
    queryFn: () => getColors(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

