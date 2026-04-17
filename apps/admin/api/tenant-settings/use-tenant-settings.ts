"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { TenantSettingsResponse } from "@/api/tenant-settings/types";

async function getTenantSettings(tenantId: string): Promise<TenantSettingsResponse> {
  const { data } = await apiClient.get<TenantSettingsResponse>(
    `/api/tenants/${tenantId}/settings`,
  );
  return data;
}

export function useTenantSettings(tenantId: string | null) {
  return useQuery({
    queryKey: ["tenant-settings", tenantId],
    queryFn: () => getTenantSettings(tenantId as string),
    enabled: Boolean(tenantId),
  });
}
