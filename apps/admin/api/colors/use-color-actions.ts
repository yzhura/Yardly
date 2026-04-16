"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Color } from "./types";

type CreateColorInput = {
  tenantId: string;
  name: string;
  hex: string;
};

type UpdateColorInput = {
  tenantId: string;
  colorId: string;
  payload: Partial<Pick<CreateColorInput, "name" | "hex">>;
};

type ArchiveColorInput = {
  tenantId: string;
  colorId: string;
};

async function createColor(input: CreateColorInput) {
  const { data } = await apiClient.post<{ color: Color }>(
    `/api/tenants/${input.tenantId}/colors`,
    {
      name: input.name,
      hex: input.hex,
    },
  );
  return data;
}

async function updateColor(input: UpdateColorInput) {
  const { data } = await apiClient.patch<{ color: Color }>(
    `/api/tenants/${input.tenantId}/colors/${input.colorId}`,
    input.payload,
  );
  return data;
}

async function archiveColor(input: ArchiveColorInput) {
  const { data } = await apiClient.delete<{ color: { id: string; isArchived: true } }>(
    `/api/tenants/${input.tenantId}/colors/${input.colorId}`,
  );
  return data;
}

export function useCreateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createColor,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["colors", variables.tenantId] });
    },
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateColor,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["colors", variables.tenantId] });
    },
  });
}

export function useArchiveColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveColor,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["colors", variables.tenantId] });
    },
  });
}

