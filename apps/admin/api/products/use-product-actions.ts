"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ProductResponse, ProductStatus } from "./types";

export type CreateProductVariantInput = {
  sku: string;
  name?: string | null;
  price: number;
  compareAtPrice?: number | null;
  cost?: number | null;
  attributeValueIds?: string[];
  imagePaths?: string[];
};

export type CreateProductInput = {
  tenantId: string;
  name: string;
  description?: string | null;
  status?: ProductStatus;
  catalogIds: string[];
  /** Потрібно, якщо у варіантів є `imagePaths` при першому збереженні товару. */
  draftUploadSessionId?: string;
  variants: CreateProductVariantInput[];
};

export type UpdateProductInput = {
  tenantId: string;
  productId: string;
  payload: Partial<{
    name: string;
    description: string | null;
    status: ProductStatus;
    catalogIds: string[];
    imagePaths: string[];
  }>;
};

export type UpdateVariantInput = {
  tenantId: string;
  productId: string;
  variantId: string;
  payload: Partial<{
    sku: string;
    name: string | null;
    price: number;
    compareAtPrice: number | null;
    cost: number | null;
    sortIndex: number;
    attributeValueIds: string[];
    imagePaths: string[];
  }>;
};

async function createProduct(input: CreateProductInput): Promise<ProductResponse> {
  const { data } = await apiClient.post<ProductResponse>(`/api/tenants/${input.tenantId}/products`, {
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    catalogIds: input.catalogIds,
    ...(input.draftUploadSessionId ? { draftUploadSessionId: input.draftUploadSessionId } : {}),
    variants: input.variants.map((v) => ({
      sku: v.sku,
      name: v.name,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      cost: v.cost,
      attributeValueIds: v.attributeValueIds,
      ...(v.imagePaths?.length ? { imagePaths: v.imagePaths } : {}),
    })),
  });
  return data;
}

async function updateProduct(input: UpdateProductInput): Promise<ProductResponse> {
  const { data } = await apiClient.patch<ProductResponse>(
    `/api/tenants/${input.tenantId}/products/${input.productId}`,
    input.payload,
  );
  return data;
}

async function archiveProduct(input: { tenantId: string; productId: string }) {
  const { data } = await apiClient.delete<{ product: { id: string; isArchived: true } }>(
    `/api/tenants/${input.tenantId}/products/${input.productId}`,
  );
  return data;
}

async function createVariant(input: {
  tenantId: string;
  productId: string;
  line: CreateProductVariantInput;
}): Promise<ProductResponse> {
  const { data } = await apiClient.post<ProductResponse>(
    `/api/tenants/${input.tenantId}/products/${input.productId}/variants`,
    input.line,
  );
  return data;
}

async function updateVariant(input: UpdateVariantInput): Promise<ProductResponse> {
  const { data } = await apiClient.patch<ProductResponse>(
    `/api/tenants/${input.tenantId}/products/${input.productId}/variants/${input.variantId}`,
    input.payload,
  );
  return data;
}

async function archiveVariant(input: { tenantId: string; productId: string; variantId: string }) {
  const { data } = await apiClient.delete<ProductResponse>(
    `/api/tenants/${input.tenantId}/products/${input.productId}/variants/${input.variantId}`,
  );
  return data;
}

function invalidateProductLists(queryClient: QueryClient, tenantId: string) {
  queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: (_data, variables) => {
      invalidateProductLists(queryClient, variables.tenantId);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (data, variables) => {
      invalidateProductLists(queryClient, variables.tenantId);
      queryClient.invalidateQueries({ queryKey: ["product", variables.tenantId, variables.productId] });
      queryClient.setQueryData(["product", variables.tenantId, variables.productId], data);
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveProduct,
    onSuccess: (_data, variables) => {
      invalidateProductLists(queryClient, variables.tenantId);
      queryClient.removeQueries({ queryKey: ["product", variables.tenantId, variables.productId] });
    },
  });
}

export function useCreateProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVariant,
    onSuccess: (data, variables) => {
      invalidateProductLists(queryClient, variables.tenantId);
      queryClient.setQueryData(["product", variables.tenantId, variables.productId], data);
    },
  });
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVariant,
    onSuccess: (data, variables) => {
      invalidateProductLists(queryClient, variables.tenantId);
      queryClient.setQueryData(["product", variables.tenantId, variables.productId], data);
    },
  });
}

export function useArchiveProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveVariant,
    onSuccess: (data, variables) => {
      invalidateProductLists(queryClient, variables.tenantId);
      queryClient.setQueryData(["product", variables.tenantId, variables.productId], data);
    },
  });
}
