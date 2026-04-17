"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { TenantLogoSignedUploadResponse } from "@/api/tenant-settings/types";

type UpdateTenantSettingsInput = {
  tenantId: string;
  name?: string;
  logoUrl?: string | null;
};

type CreateTenantLogoSignedUploadInput = {
  tenantId: string;
  mimeType: string;
};

async function updateTenantSettings(input: UpdateTenantSettingsInput) {
  const payload: { name?: string; logoUrl?: string | null } = {};
  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.logoUrl !== undefined) {
    payload.logoUrl = input.logoUrl;
  }
  const { data } = await apiClient.patch(`/api/tenants/${input.tenantId}/settings`, payload);
  return data;
}

async function createTenantLogoSignedUpload(
  input: CreateTenantLogoSignedUploadInput,
): Promise<TenantLogoSignedUploadResponse> {
  const { data } = await apiClient.post<TenantLogoSignedUploadResponse>(
    `/api/tenants/${input.tenantId}/logo/signed-upload`,
    { mimeType: input.mimeType },
  );
  return data;
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-settings", variables.tenantId],
      });
    },
  });
}

export function useCreateTenantLogoSignedUpload() {
  return useMutation({
    mutationFn: createTenantLogoSignedUpload,
  });
}
