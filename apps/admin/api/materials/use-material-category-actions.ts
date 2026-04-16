"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { MaterialCategory } from "./types";

type CreateCategoryInput = {
  tenantId: string;
  name: string;
};

type UpdateCategoryInput = {
  tenantId: string;
  categoryId: string;
  payload: Partial<Pick<CreateCategoryInput, "name">>;
};

type ArchiveCategoryInput = {
  tenantId: string;
  categoryId: string;
};

async function createCategory(input: CreateCategoryInput) {
  const payload = {
    name: input.name,
  };
  const { data } = await apiClient.post<{ category: MaterialCategory }>(
    `/api/tenants/${input.tenantId}/material-categories`,
    payload,
  );
  return data;
}

async function updateCategory(input: UpdateCategoryInput) {
  const payload = { ...input.payload };
  const { data } = await apiClient.patch<{ category: MaterialCategory }>(
    `/api/tenants/${input.tenantId}/material-categories/${input.categoryId}`,
    payload,
  );
  return data;
}

async function archiveCategory(input: ArchiveCategoryInput) {
  const { data } = await apiClient.delete<{ category: { id: string; isArchived: true } }>(
    `/api/tenants/${input.tenantId}/material-categories/${input.categoryId}`,
  );
  return data;
}

export function useCreateMaterialCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["material-categories", variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["materials", variables.tenantId] });
    },
  });
}

export function useUpdateMaterialCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["material-categories", variables.tenantId] });
    },
  });
}

export function useArchiveMaterialCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveCategory,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["material-categories", variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["materials", variables.tenantId] });
    },
  });
}

