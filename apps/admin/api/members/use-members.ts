"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { TenantMembersResponse } from "@/api/members/types";

async function getMembers(tenantId: string): Promise<TenantMembersResponse> {
  const { data } = await apiClient.get<TenantMembersResponse>(
    `/api/tenants/${tenantId}/members`,
  );
  return data;
}

export function useMembers(tenantId: string | null) {
  return useQuery({
    queryKey: ["members", tenantId],
    queryFn: () => getMembers(tenantId as string),
    enabled: Boolean(tenantId),
  });
}
