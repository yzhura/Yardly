"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Material, MaterialSignedUploadResponse, MaterialUnit } from "./types";

type CreateMaterialInput = {
  tenantId: string;
  name: string;
  sku: string;
  categoryId: string;
  colorId: string;
  unit: MaterialUnit;
  imagePath?: string | null;
  quantityTotal?: number;
  quantityReserved?: number;
  minStock?: number;
};

type UpdateMaterialInput = {
  tenantId: string;
  materialId: string;
  payload: Partial<
    Pick<
      CreateMaterialInput,
      "name" | "sku" | "categoryId" | "colorId" | "unit" | "imagePath" | "quantityTotal" | "quantityReserved" | "minStock"
    >
  >;
};

async function createMaterial(input: CreateMaterialInput) {
  const payload = {
    name: input.name,
    sku: input.sku,
    categoryId: input.categoryId,
    colorId: input.colorId,
    unit: input.unit,
    imagePath: input.imagePath ?? null,
    quantityTotal: input.quantityTotal ?? 0,
    quantityReserved: input.quantityReserved ?? 0,
    minStock: input.minStock ?? 0,
  };

  const { data } = await apiClient.post<{ material: Material }>(
    `/api/tenants/${input.tenantId}/materials`,
    payload,
  );
  return data;
}

async function updateMaterial(input: UpdateMaterialInput) {
  const payload = {
    ...input.payload,
  };
  const { data } = await apiClient.patch<{ material: Material }>(
    `/api/tenants/${input.tenantId}/materials/${input.materialId}`,
    payload,
  );
  return data;
}

async function archiveMaterial(input: { tenantId: string; materialId: string }) {
  const { data } = await apiClient.delete<{ material: { id: string; isArchived: true } }>(
    `/api/tenants/${input.tenantId}/materials/${input.materialId}`,
  );
  return data;
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["materials", variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["material-categories", variables.tenantId] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMaterial,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["materials", variables.tenantId] });
    },
  });
}

export function useArchiveMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveMaterial,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["materials", variables.tenantId] });
    },
  });
}

