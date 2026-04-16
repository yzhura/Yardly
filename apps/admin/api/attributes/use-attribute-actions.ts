"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { AttributeDefinition, AttributeScope, AttributeValue } from "./types";

type CreateDefinitionInput = {
  tenantId: string;
  name: string;
  scope: AttributeScope;
};

type UpdateDefinitionInput = {
  tenantId: string;
  definitionId: string;
  payload: Partial<Pick<CreateDefinitionInput, "name" | "scope">>;
};

type ArchiveDefinitionInput = {
  tenantId: string;
  definitionId: string;
};

type CreateValueInput = {
  tenantId: string;
  definitionId: string;
  name: string;
  sortIndex?: number;
};

type UpdateValueInput = {
  tenantId: string;
  definitionId: string;
  valueId: string;
  payload: Partial<Pick<CreateValueInput, "name" | "sortIndex">>;
};

type ArchiveValueInput = {
  tenantId: string;
  definitionId: string;
  valueId: string;
};

async function createDefinition(input: CreateDefinitionInput) {
  const { data } = await apiClient.post<{ definition: AttributeDefinition }>(
    `/api/tenants/${input.tenantId}/attributes`,
    { name: input.name, scope: input.scope },
  );
  return data;
}

async function updateDefinition(input: UpdateDefinitionInput) {
  const { data } = await apiClient.patch<{ definition: AttributeDefinition }>(
    `/api/tenants/${input.tenantId}/attributes/${input.definitionId}`,
    input.payload,
  );
  return data;
}

async function archiveDefinition(input: ArchiveDefinitionInput) {
  const { data } = await apiClient.delete<{ definition: { id: string; isArchived: true } }>(
    `/api/tenants/${input.tenantId}/attributes/${input.definitionId}`,
  );
  return data;
}

async function createValue(input: CreateValueInput) {
  const { data } = await apiClient.post<{ value: AttributeValue }>(
    `/api/tenants/${input.tenantId}/attributes/${input.definitionId}/values`,
    { name: input.name, sortIndex: input.sortIndex ?? 0 },
  );
  return data;
}

async function updateValue(input: UpdateValueInput) {
  const { data } = await apiClient.patch<{ value: AttributeValue }>(
    `/api/tenants/${input.tenantId}/attributes/${input.definitionId}/values/${input.valueId}`,
    input.payload,
  );
  return data;
}

async function archiveValue(input: ArchiveValueInput) {
  const { data } = await apiClient.delete<{ value: { id: string; isArchived: true } }>(
    `/api/tenants/${input.tenantId}/attributes/${input.definitionId}/values/${input.valueId}`,
  );
  return data;
}

export function useCreateDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDefinition,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", variables.tenantId] });
    },
  });
}

export function useUpdateDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDefinition,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", variables.tenantId] });
    },
  });
}

export function useArchiveDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveDefinition,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", variables.tenantId] });
    },
  });
}

export function useCreateValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createValue,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", variables.tenantId] });
    },
  });
}

export function useUpdateValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateValue,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", variables.tenantId] });
    },
  });
}

export function useArchiveValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveValue,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attributes", variables.tenantId] });
    },
  });
}

