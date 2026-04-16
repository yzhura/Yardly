export type MaterialStockStatus = "ENOUGH" | "ENDING" | "LOW";

export type MaterialUnit = "м" | "шт" | "кг" | "см";

export type MaterialCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Color = {
  id: string;
  name: string;
  slug: string;
  hex: string;
};

export type Material = {
  id: string;
  name: string;
  sku: string;
  category: {
    id: string;
    name: string;
  };
  color: Color | null;
  unit: MaterialUnit;
  imageUrl: string | null;
  quantityTotal: number;
  quantityReserved: number;
  quantityAvailable: number;
  minStock: number;
  stockStatus: MaterialStockStatus;
  createdAt: string;
  updatedAt: string;
};

export type MaterialsResponse = {
  materials: Material[];
};

export type MaterialCategoriesResponse = {
  categories: MaterialCategory[];
};

export type MaterialSignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
  storagePath: string;
};

