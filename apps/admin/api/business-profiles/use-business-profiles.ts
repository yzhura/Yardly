"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { BusinessProfilesResponse } from "@/api/business-profiles/types";

async function getBusinessProfiles(tenantId: string): Promise<BusinessProfilesResponse> {
  const { data } = await apiClient.get<BusinessProfilesResponse>(
    `/api/tenants/${tenantId}/business-profiles`,
  );
  return data;
}

export function useBusinessProfiles(tenantId: string | null) {
  return useQuery({
    queryKey: ["business-profiles", tenantId],
    queryFn: () => getBusinessProfiles(tenantId as string),
    enabled: Boolean(tenantId),
  });
}
