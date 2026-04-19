"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { CatalogMutationResponse } from "./types";

function invalidateCatalogs(queryClient: QueryClient, tenantId: string) {
  queryClient.invalidateQueries({ queryKey: ["catalogs", tenantId] });
  queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
}

export function useCreateCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tenantId: string; name: string; description?: string | null }) => {
      const { data } = await apiClient.post<CatalogMutationResponse>(`/api/tenants/${input.tenantId}/catalogs`, {
        name: input.name,
        description: input.description ?? null,
      });
      return data;
    },
    onSuccess: (_d, v) => invalidateCatalogs(queryClient, v.tenantId),
  });
}

export function useUpdateCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tenantId: string;
      catalogId: string;
      name?: string;
      description?: string | null;
    }) => {
      const { data } = await apiClient.patch<CatalogMutationResponse>(
        `/api/tenants/${input.tenantId}/catalogs/${input.catalogId}`,
        { name: input.name, description: input.description },
      );
      return data;
    },
    onSuccess: (_d, v) => invalidateCatalogs(queryClient, v.tenantId),
  });
}

export function useArchiveCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tenantId: string; catalogId: string }) => {
      const { data } = await apiClient.delete<{ catalog: { id: string; isArchived: true } }>(
        `/api/tenants/${input.tenantId}/catalogs/${input.catalogId}`,
      );
      return data;
    },
    onSuccess: (_d, v) => invalidateCatalogs(queryClient, v.tenantId),
  });
}
