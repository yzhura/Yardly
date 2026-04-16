"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { AttributeDefinitionsResponse, AttributeScope } from "./types";

type UseAttributesParams = {
  tenantId: string | null;
  scope?: AttributeScope;
};

async function getAttributes(tenantId: string, scope?: AttributeScope): Promise<AttributeDefinitionsResponse> {
  const params = scope ? { scope } : undefined;
  const { data } = await apiClient.get<AttributeDefinitionsResponse>(
    `/api/tenants/${tenantId}/attributes`,
    { params },
  );
  return data;
}

export function useAttributes({ tenantId, scope }: UseAttributesParams) {
  return useQuery({
    queryKey: ["attributes", tenantId, scope ?? "ALL"],
    queryFn: () => getAttributes(tenantId as string, scope),
    enabled: Boolean(tenantId),
  });
}

