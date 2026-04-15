"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  IntegrationProvider,
  IntegrationSecretKey,
} from "@/api/business-profiles/types";

type CreateProfileInput = {
  tenantId: string;
  displayName: string;
  legalName?: string;
  taxId?: string;
  registrationNumber?: string;
};

type ActivateProfileInput = {
  tenantId: string;
  profileId: string;
};

type UpdateProfileInput = {
  tenantId: string;
  profileId: string;
  displayName: string;
  legalName?: string;
  taxId?: string;
  registrationNumber?: string;
};

type UpsertSecretInput = {
  tenantId: string;
  profileId: string;
  provider: IntegrationProvider;
  keyName: IntegrationSecretKey;
  secret: string;
  label?: string;
};

type RemoveSecretInput = {
  tenantId: string;
  profileId: string;
  provider: IntegrationProvider;
  keyName: IntegrationSecretKey;
};

async function createProfile(input: CreateProfileInput) {
  const payload = {
    displayName: input.displayName,
    legalName: input.legalName,
    taxId: input.taxId,
    registrationNumber: input.registrationNumber,
  };
  const { data } = await apiClient.post(
    `/api/tenants/${input.tenantId}/business-profiles`,
    payload,
  );
  return data;
}

async function activateProfile(input: ActivateProfileInput) {
  const { data } = await apiClient.post(
    `/api/tenants/${input.tenantId}/business-profiles/${input.profileId}/activate`,
  );
  return data;
}

async function updateProfile(input: UpdateProfileInput) {
  const payload = {
    displayName: input.displayName,
    legalName: input.legalName,
    taxId: input.taxId,
    registrationNumber: input.registrationNumber,
  };
  const { data } = await apiClient.patch(
    `/api/tenants/${input.tenantId}/business-profiles/${input.profileId}`,
    payload,
  );
  return data;
}

async function upsertSecret(input: UpsertSecretInput) {
  const { data } = await apiClient.put(
    `/api/tenants/${input.tenantId}/business-profiles/${input.profileId}/credentials/${input.provider}/${input.keyName}`,
    { secret: input.secret, label: input.label },
  );
  return data;
}

async function removeSecret(input: RemoveSecretInput) {
  const { data } = await apiClient.delete(
    `/api/tenants/${input.tenantId}/business-profiles/${input.profileId}/credentials/${input.provider}/${input.keyName}`,
  );
  return data;
}

export function useCreateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProfile,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-profiles", variables.tenantId],
      });
    },
  });
}

export function useActivateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateProfile,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-profiles", variables.tenantId],
      });
    },
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-profiles", variables.tenantId],
      });
    },
  });
}

export function useUpsertIntegrationSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertSecret,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-profiles", variables.tenantId],
      });
    },
  });
}

export function useRemoveIntegrationSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeSecret,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-profiles", variables.tenantId],
      });
    },
  });
}
