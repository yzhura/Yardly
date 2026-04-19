export type ProductStatus = "DRAFT" | "ACTIVE";

export type ProductCatalogRef = {
  id: string;
  name: string;
  slug: string;
};

export type ProductListVariant = {
  id: string;
  sku: string;
  price: string;
  sortIndex: number;
  attributeTags: string[];
};

export type ProductListItem = {
  id: string;
  name: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  /** First resolved image URL for table/thumbnail. */
  primaryImageUrl: string | null;
  /** Up to three signed URLs for grid carousel. */
  imageUrls: string[];
  catalogs: ProductCatalogRef[];
  variants: ProductListVariant[];
};

export type ProductListPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProductsListResponse = {
  products: ProductListItem[];
  pagination: ProductListPagination;
};

export type ProductListQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "name" | "status";
  sortOrder?: "asc" | "desc";
  status?: ProductStatus;
  q?: string;
  catalogId?: string;
};

export type ProductVariantAttributeValue = {
  id: string;
  name: string;
  slug: string;
  definition: { id: string; name: string; slug: string };
};

export type ProductVariantDetail = {
  id: string;
  sku: string;
  name: string | null;
  price: string;
  compareAtPrice: string | null;
  cost: string | null;
  sortIndex: number;
  createdAt: string;
  updatedAt: string;
  imagePaths: string[];
  imageUrls: (string | null)[];
  attributeValues: ProductVariantAttributeValue[];
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  /** Застарілі фото на рівні товару (лише для старих даних); нові фото — у варіантів. */
  imagePaths: string[];
  imageUrls: (string | null)[];
  catalogs: ProductCatalogRef[];
  variants: ProductVariantDetail[];
};

export type ProductResponse = {
  product: ProductDetail;
};

/** Response from `POST .../products/image/signed-upload`. */
export type ProductSignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
  storagePath: string;
};
