import * as yup from "yup";
import type { ProductStatus } from "@/api/products/types";
import { PRODUCT_IMAGE_MAX_COUNT } from "@/lib/product-media";

export type ProductFormVariantValues = {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null | undefined;
  cost: number | null | undefined;
  attributeValueIds: string[];
  imagePaths: string[];
};

export type ProductFormValues = {
  name: string;
  description: string;
  status: ProductStatus;
  catalogIds: string[];
  variants: ProductFormVariantValues[];
};

const variantSchema = yup.object({
  id: yup.string().required(),
  sku: yup
    .string()
    .trim()
    .min(1, "Вкажіть артикул (SKU)")
    .max(64, "Артикул має містити до 64 символів")
    .required("Вкажіть артикул (SKU)"),
  name: yup.string().trim().max(160, "Назва варіанту до 160 символів").default(""),
  price: yup
    .number()
    .typeError("Ціна має бути числом")
    .min(0, "Ціна не може бути від’ємною")
    .max(99_999_999.99, "Занадто велика ціна")
    .required("Вкажіть ціну"),
  compareAtPrice: yup
    .number()
    .nullable()
    .optional()
    .min(0, "Не може бути від’ємною")
    .max(99_999_999.99, "Занадто велике значення"),
  cost: yup
    .number()
    .nullable()
    .optional()
    .min(0, "Не може бути від’ємною")
    .max(99_999_999.99, "Занадто велике значення"),
  attributeValueIds: yup.array().of(yup.string().required()).default([]),
  imagePaths: yup
    .array()
    .of(yup.string().required())
    .max(PRODUCT_IMAGE_MAX_COUNT, `Не більше ${PRODUCT_IMAGE_MAX_COUNT} зображень на варіант`)
    .default([]),
});

export const productFormSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, "Введіть назву товару")
    .max(200, "Назва до 200 символів")
    .required("Введіть назву товару"),
  description: yup.string().trim().max(20_000, "Опис до 20000 символів").default(""),
  status: yup.mixed<ProductStatus>().oneOf(["DRAFT", "ACTIVE"] as const).required(),
  catalogIds: yup
    .array()
    .of(yup.string().required())
    .min(1, "Оберіть хоча б один каталог")
    .required(),
  variants: yup
    .array()
    .of(variantSchema)
    .min(1, "Додайте хоча б один варіант")
    .test("sku-unique", "Артикули варіантів не повинні повторюватися", (rows) => {
      if (!rows?.length) return true;
      const skus = rows.map((r) => r.sku.trim().toLowerCase()).filter(Boolean);
      return new Set(skus).size === skus.length;
    })
    .required(),
});
