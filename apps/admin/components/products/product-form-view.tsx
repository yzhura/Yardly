"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { motion } from "motion/react";
import { FolderOpen, ImagePlus, Info, ListPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "@/api/client";
import type { ProductSignedUploadResponse } from "@/api/products/types";
import { useAttributes } from "@/api/attributes/use-attributes";
import { useCatalogs } from "@/api/catalogs/use-catalogs";
import type { ProductDetail } from "@/api/products/types";
import { useProduct } from "@/api/products/use-product";
import {
  useArchiveProduct,
  useArchiveProductVariant,
  useCreateProduct,
  useCreateProductVariant,
  useUpdateProduct,
  useUpdateProductVariant,
} from "@/api/products/use-product-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_COUNT,
  resolveTenantImageUploadMime,
} from "@/lib/product-media";
import { MOTION_DURATION, MOTION_EASE, surfaceReveal } from "@/lib/motion";
import { productFormSchema, type ProductFormValues } from "./product-form-schema";
import { VariantAttributePickers } from "./variant-attribute-pickers";

function newVariantId() {
  return `new-${crypto.randomUUID()}`;
}

function mapProductToFormValues(product: ProductDetail): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    status: product.status,
    catalogIds: product.catalogs.map((c) => c.id),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name ?? "",
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
      cost: v.cost != null ? Number(v.cost) : null,
      attributeValueIds: v.attributeValues.map((a) => a.id),
      imagePaths: v.imagePaths?.length ? [...v.imagePaths] : [],
    })),
  };
}

function isTempVariantId(id: string) {
  return id.startsWith("new-");
}

type ProductFormViewProps = {
  tenantId: string;
  canManage: boolean;
  mode: "create" | "edit";
  productId?: string;
};

export function ProductFormView({ tenantId, canManage, mode, productId }: ProductFormViewProps) {
  const router = useRouter();
  const { data: productData, isLoading: productLoading } = useProduct({
    tenantId,
    productId: mode === "edit" ? productId ?? null : null,
  });
  const { data: attrData, isLoading: attrLoading } = useAttributes({ tenantId, scope: "PRODUCT" });
  const { data: catalogsData, isLoading: catalogsLoading } = useCatalogs(tenantId);

  const definitions = useMemo(() => attrData?.definitions ?? [], [attrData?.definitions]);
  const catalogs = useMemo(() => catalogsData?.catalogs ?? [], [catalogsData?.catalogs]);
  const soleCatalogIdForAutoSelect = useMemo(
    () => (catalogs.length === 1 ? (catalogs[0]?.id ?? null) : null),
    [catalogs],
  );

  const newProductDraftSessionId = useMemo(() => crypto.randomUUID(), []);

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      name: "",
      description: "",
      status: "DRAFT",
      catalogIds: [],
      variants: [
        {
          id: newVariantId(),
          sku: "",
          name: "",
          price: 0,
          compareAtPrice: null,
          cost: null,
          attributeValueIds: [],
          imagePaths: [],
        },
      ],
    }),
    [],
  );

  const form = useForm<ProductFormValues>({
    resolver: yupResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues,
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createVariant = useCreateProductVariant();
  const updateVariant = useUpdateProductVariant();
  const archiveProduct = useArchiveProduct();
  const archiveVariant = useArchiveProductVariant();

  const [confirmArchiveProduct, setConfirmArchiveProduct] = useState(false);
  const [confirmArchiveVariant, setConfirmArchiveVariant] = useState<{
    variantId: string;
    label: string;
  } | null>(null);
  const [blobByPath, setBlobByPath] = useState<Record<string, string>>({});
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const productSnapshot = productData?.product;
  const serverImagePathsKey = [
    ...(productSnapshot?.imagePaths ?? []),
    ...(productSnapshot?.variants ?? []).flatMap((v) => v.imagePaths ?? []),
  ].join("\0");

  useEffect(() => {
    const ref = blobUrlsRef;
    return () => {
      const urls = ref.current;
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    const known = new Set<string>();
    productSnapshot?.imagePaths?.forEach((p) => known.add(p));
    productSnapshot?.variants?.forEach((v) => v.imagePaths?.forEach((p) => known.add(p)));
    if (known.size === 0) return;
    setBlobByPath((prev) => {
      const next = { ...prev };
      for (const path of Object.keys(prev)) {
        if (known.has(path)) {
          URL.revokeObjectURL(prev[path]!);
          blobUrlsRef.current.delete(prev[path]!);
          delete next[path];
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverImagePathsKey mirrors all server image paths
  }, [productSnapshot?.id, productSnapshot?.updatedAt, serverImagePathsKey]);

  useEffect(() => {
    if (mode !== "create" || !soleCatalogIdForAutoSelect) return;
    const current = form.getValues("catalogIds");
    if (current.length > 0) return;
    form.setValue("catalogIds", [soleCatalogIdForAutoSelect], { shouldValidate: true });
  }, [mode, soleCatalogIdForAutoSelect, form]);

  useEffect(() => {
    if (mode === "edit" && productSnapshot) {
      form.reset(mapProductToFormValues(productSnapshot));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync form when server product identity/version changes
  }, [mode, productSnapshot?.id, productSnapshot?.updatedAt]);

  const submitting =
    createProduct.isPending ||
    updateProduct.isPending ||
    createVariant.isPending ||
    updateVariant.isPending;

  const onSubmit = async () => {
    if (!canManage) return;
    const values = form.getValues();
    try {
      if (mode === "create") {
        const anyVariantPhotos = values.variants.some((v) => v.imagePaths.length > 0);
        await createProduct.mutateAsync({
          tenantId,
          name: values.name.trim(),
          description: values.description.trim() || null,
          status: values.status,
          catalogIds: values.catalogIds,
          ...(anyVariantPhotos ? { draftUploadSessionId: newProductDraftSessionId } : {}),
          variants: values.variants.map((v) => {
            const p = Number(v.price);
            return {
              sku: v.sku.trim(),
              name: v.name.trim() || undefined,
              price: Number.isFinite(p) ? p : 0,
              compareAtPrice: v.compareAtPrice ?? undefined,
              cost: v.cost ?? undefined,
              attributeValueIds: v.attributeValueIds.length ? v.attributeValueIds : undefined,
              imagePaths: v.imagePaths.length ? v.imagePaths : undefined,
            };
          }),
        });
        toast.success("Товар створено");
        router.push("/products");
        router.refresh();
        return;
      }

      if (!productId) return;

      await updateProduct.mutateAsync({
        tenantId,
        productId,
        payload: {
          name: values.name.trim(),
          description: values.description.trim() || null,
          status: values.status,
          catalogIds: values.catalogIds,
        },
      });

      for (const row of values.variants) {
        const priceNum = Number(row.price);
        const price = Number.isFinite(priceNum) ? priceNum : 0;
        const payload = {
          sku: row.sku.trim(),
          name: row.name.trim() ? row.name.trim() : null,
          price,
          compareAtPrice: row.compareAtPrice ?? null,
          cost: row.cost ?? null,
          attributeValueIds: row.attributeValueIds,
          imagePaths: row.imagePaths,
        };

        if (isTempVariantId(row.id)) {
          await createVariant.mutateAsync({
            tenantId,
            productId,
            line: {
              sku: payload.sku,
              name: payload.name,
              price: payload.price,
              compareAtPrice: payload.compareAtPrice ?? undefined,
              cost: payload.cost ?? undefined,
              attributeValueIds: payload.attributeValueIds,
              imagePaths: payload.imagePaths.length ? payload.imagePaths : undefined,
            },
          });
        } else {
          await updateVariant.mutateAsync({
            tenantId,
            productId,
            variantId: row.id,
            payload,
          });
        }
      }

      toast.success("Зміни збережено");
      router.push("/products");
      router.refresh();
    } catch {
      toast.error("Не вдалося зберегти. Спробуйте ще раз.");
    }
  };

  const handleArchiveProduct = async () => {
    if (!productId || !canManage) return;
    try {
      await archiveProduct.mutateAsync({ tenantId, productId });
      toast.success("Товар архівовано");
      router.push("/products");
      router.refresh();
    } catch {
      toast.error("Не вдалося архівувати товар");
    } finally {
      setConfirmArchiveProduct(false);
    }
  };

  const handleArchiveVariantConfirmed = async () => {
    if (!confirmArchiveVariant || !productId || !canManage) return;
    try {
      await archiveVariant.mutateAsync({
        tenantId,
        productId,
        variantId: confirmArchiveVariant.variantId,
      });
      toast.success("Варіант архівовано");
      setConfirmArchiveVariant(null);
      router.refresh();
    } catch {
      toast.error("Не вдалося архівувати варіант");
    }
  };

  if (mode === "edit" && (productLoading || !productData?.product)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Завантаження товару…</p>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto flex max-w-5xl flex-col gap-8"
      variants={surfaceReveal}
      initial="initial"
      animate="animate"
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE }}
    >
      <nav className="text-sm text-muted-foreground">
        <Link href="/products" className="font-medium text-primary hover:underline">
          Товари
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{mode === "create" ? "Додати" : "Редагування"}</span>
      </nav>

      {!canManage ? (
        <Alert>
          <AlertTitle>Лише перегляд</AlertTitle>
          <AlertDescription>
            У вашій ролі немає прав на зміну товарів. Зверніться до адміністратора організації.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {mode === "create" ? "Новий товар" : "Редагування товару"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Заповніть основні дані та варіанти (SKU). Характеристики опційні; матеріали та фото — у наступних
            оновленнях.
          </p>
        </div>
        {mode === "edit" && productId ? (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmArchiveProduct(true)}
            disabled={!canManage || archiveProduct.isPending}
          >
            Архівувати товар
          </Button>
        ) : null}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Info className="h-4 w-4 text-primary" aria-hidden />
                <CardTitle className="text-base">Загальна інформація</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Назва товару</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Напр. Корсетний топ «Amour»"
                          disabled={!canManage}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!canManage}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[130]">
                          <SelectItem value="DRAFT">Чернетка</SelectItem>
                          <SelectItem value="ACTIVE">Активний</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Опис</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Короткий опис для команди та клієнтів"
                          rows={5}
                          disabled={!canManage}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <FolderOpen className="h-4 w-4 text-primary" aria-hidden />
              <CardTitle className="text-base">Каталоги</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {catalogsLoading ? (
                <p className="text-sm text-muted-foreground">Завантаження каталогів…</p>
              ) : catalogs.length === 0 ? (
                <Alert>
                  <AlertTitle>Немає каталогів</AlertTitle>
                  <AlertDescription>
                    Спочатку створіть хоча б один каталог на сторінці{" "}
                    <Link href="/catalogs" className="font-medium text-primary underline underline-offset-2">
                      Каталоги
                    </Link>
                    , інакше товар не можна зберегти.
                  </AlertDescription>
                </Alert>
              ) : (
                <FormField
                  control={form.control}
                  name="catalogIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Де показувати товар</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Оберіть один або кілька каталогів. Мінімум один обов’язковий.
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {catalogs.map((c) => {
                          const checked = field.value.includes(c.id);
                          return (
                            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                              <Checkbox
                                id={`catalog-${c.id}`}
                                checked={checked}
                                disabled={!canManage || (checked && field.value.length <= 1)}
                                onCheckedChange={(isOn) => {
                                  if (isOn === true) {
                                    field.onChange([...field.value, c.id]);
                                  } else {
                                    const next = field.value.filter((id: string) => id !== c.id);
                                    if (next.length === 0) return;
                                    field.onChange(next);
                                  }
                                }}
                              />
                              <Label htmlFor={`catalog-${c.id}`} className="cursor-pointer text-sm font-normal">
                                {c.name}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <ListPlus className="h-4 w-4 text-primary" aria-hidden />
              <CardTitle className="text-base">Варіанти (SKU)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {attrLoading ? (
                <p className="text-sm text-muted-foreground">Завантаження характеристик…</p>
              ) : null}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-border/80 bg-muted/10 p-4 shadow-inner"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Варіант {index + 1}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {fields.length > 1 && isTempVariantId(form.watch(`variants.${index}.id`)) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={!canManage}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                          Прибрати
                        </Button>
                      ) : null}
                      {mode === "edit" && !isTempVariantId(form.watch(`variants.${index}.id`)) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canManage || fields.length < 2}
                          onClick={() =>
                            setConfirmArchiveVariant({
                              variantId: form.watch(`variants.${index}.id`),
                              label: form.watch(`variants.${index}.sku`) || "варіант",
                            })
                          }
                        >
                          Архівувати
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Артикул (SKU)</FormLabel>
                          <FormControl>
                            <Input placeholder="ART-001" disabled={!canManage} {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Назва варіанту (необов’язково)</FormLabel>
                          <FormControl>
                            <Input placeholder="Напр. Чорний / M" disabled={!canManage} {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Ціна (UAH)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              disabled={!canManage}
                              {...f}
                              value={(() => {
                                const v = f.value as unknown;
                                if (v === null || v === undefined) return "";
                                const n = typeof v === "number" ? v : Number.parseFloat(String(v));
                                return Number.isFinite(n) ? String(n) : "";
                              })()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw.trim() === "") {
                                  f.onChange(0);
                                  return;
                                }
                                const n = Number.parseFloat(raw);
                                f.onChange(Number.isFinite(n) ? n : 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.compareAtPrice`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Стара ціна (необов’язково)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              disabled={!canManage}
                              value={f.value === null || f.value === undefined ? "" : f.value}
                              onChange={(e) => {
                                const raw = e.target.value;
                                f.onChange(raw === "" ? null : Number(raw));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.cost`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Собівартість (необов’язково)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              disabled={!canManage}
                              value={f.value === null || f.value === undefined ? "" : f.value}
                              onChange={(e) => {
                                const raw = e.target.value;
                                f.onChange(raw === "" ? null : Number(raw));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Фото для цього варіанту (окремо для кожного кольору / SKU)
                    </p>
                    <FormField
                      control={form.control}
                      name={`variants.${index}.imagePaths`}
                      render={({ field }) => {
                        const variantRowId = form.watch(`variants.${index}.id`);

                        function displayUrlForVariantPath(path: string): string | null {
                          const blob = blobByPath[path];
                          if (blob) return blob;
                          const snap = productSnapshot?.variants?.find((x) => x.id === variantRowId);
                          const paths = snap?.imagePaths ?? [];
                          const urls = snap?.imageUrls ?? [];
                          const idx = paths.indexOf(path);
                          if (idx >= 0 && urls[idx]) return urls[idx]!;
                          return null;
                        }

                        async function onPickVariantFile(e: React.ChangeEvent<HTMLInputElement>) {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file || !canManage) return;
                          const mimeType = resolveTenantImageUploadMime(file);
                          if (!mimeType) {
                            toast.error("Дозволені лише JPEG, PNG, WebP або HEIC/HEIF (Apple).");
                            return;
                          }
                          if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
                            toast.error(
                              `Файл завеликий. Максимум ${Math.round(PRODUCT_IMAGE_MAX_BYTES / (1024 * 1024))} МБ.`,
                            );
                            return;
                          }
                          if (field.value.length >= PRODUCT_IMAGE_MAX_COUNT) {
                            toast.error(`Не більше ${PRODUCT_IMAGE_MAX_COUNT} зображень на варіант.`);
                            return;
                          }

                          await toast.promise(
                            (async () => {
                              let sig: ProductSignedUploadResponse;
                              if (mode === "create") {
                                const { data } = await apiClient.post<ProductSignedUploadResponse>(
                                  `/api/tenants/${tenantId}/products/variant-images/draft/signed-upload`,
                                  {
                                    mimeType,
                                    draftKind: "new",
                                    sessionId: newProductDraftSessionId,
                                  },
                                );
                                sig = data;
                              } else if (isTempVariantId(variantRowId)) {
                                if (!productId) throw new Error("missing_product");
                                const { data } = await apiClient.post<ProductSignedUploadResponse>(
                                  `/api/tenants/${tenantId}/products/variant-images/draft/signed-upload`,
                                  {
                                    mimeType,
                                    draftKind: "product",
                                    productId,
                                  },
                                );
                                sig = data;
                              } else {
                                if (!productId) throw new Error("missing_product");
                                const { data } = await apiClient.post<ProductSignedUploadResponse>(
                                  `/api/tenants/${tenantId}/products/${productId}/variants/${variantRowId}/image/signed-upload`,
                                  { mimeType },
                                );
                                sig = data;
                              }
                              const supabase = createClient();
                              const { error } = await supabase.storage
                                .from(sig.bucket)
                                .uploadToSignedUrl(sig.path, sig.token, file, { contentType: mimeType });
                              if (error) throw error;
                              const storagePath = sig.storagePath ?? sig.path;
                              const blobUrl = URL.createObjectURL(file);
                              blobUrlsRef.current.add(blobUrl);
                              setBlobByPath((m) => ({ ...m, [storagePath]: blobUrl }));
                              field.onChange([...field.value, storagePath]);
                            })(),
                            {
                              pending: "Завантаження зображення…",
                              success: "Зображення додано (збережіть форму)",
                              error: "Не вдалося завантажити файл.",
                            },
                          );
                        }

                        function removeVariantPath(path: string) {
                          const blob = blobByPath[path];
                          if (blob) {
                            URL.revokeObjectURL(blob);
                            blobUrlsRef.current.delete(blob);
                            setBlobByPath((m) => {
                              const next = { ...m };
                              delete next[path];
                              return next;
                            });
                          }
                          field.onChange(field.value.filter((p) => p !== path));
                        }

                        const uploadInputId = `variant-gallery-upload-${index}`;

                        return (
                          <FormItem>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                id={uploadInputId}
                                type="file"
                                accept={PRODUCT_IMAGE_ACCEPT}
                                className="sr-only"
                                disabled={!canManage || field.value.length >= PRODUCT_IMAGE_MAX_COUNT}
                                onChange={(ev) => {
                                  void onPickVariantFile(ev);
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                                disabled={!canManage || field.value.length >= PRODUCT_IMAGE_MAX_COUNT}
                                onClick={() => document.getElementById(uploadInputId)?.click()}
                              >
                                <ImagePlus className="h-4 w-4" aria-hidden />
                                Додати фото варіанту
                              </Button>
                              {field.value.length >= PRODUCT_IMAGE_MAX_COUNT ? (
                                <span className="text-xs text-muted-foreground">Досягнуто ліміт фото</span>
                              ) : null}
                            </div>
                            {field.value.length > 0 ? (
                              <ul className="mt-3 flex flex-wrap gap-3">
                                {field.value.map((path) => {
                                  const src = displayUrlForVariantPath(path);
                                  return (
                                    <li
                                      key={path}
                                      className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted/30"
                                    >
                                      {src ? (
                                        // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs
                                        <img src={src} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                          Попередній перегляд
                                        </div>
                                      )}
                                      {canManage ? (
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="absolute right-1 top-1 h-7 w-7"
                                          aria-label="Прибрати зображення"
                                          onClick={() => removeVariantPath(path)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">Ще немає фото для цього варіанту.</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <VariantAttributePickers definitions={definitions} variantIndex={index} />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canManage}
                onClick={() =>
                  append({
                    id: newVariantId(),
                    sku: "",
                    name: "",
                    price: 0,
                    compareAtPrice: null,
                    cost: null,
                    attributeValueIds: [],
                    imagePaths: [],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Додати варіант
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 border-dashed shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Технологічна карта / матеріали</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Прив’язка матеріалів до варіантів для виробництва з’явиться в окремому оновленні API та UI.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/products">Скасувати</Link>
            </Button>
            <Button type="submit" disabled={!canManage || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Збереження…
                </>
              ) : mode === "create" ? (
                "Створити товар"
              ) : (
                "Зберегти зміни"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmModal
        open={confirmArchiveProduct}
        title="Архівувати товар?"
        description="Товар і всі варіанти будуть приховані зі списку. Пізніше відновлення може бути недоступне."
        confirmLabel="Архівувати"
        confirmVariant="destructive"
        loading={archiveProduct.isPending}
        onClose={() => setConfirmArchiveProduct(false)}
        onConfirm={handleArchiveProduct}
      />

      <ConfirmModal
        open={Boolean(confirmArchiveVariant)}
        title="Архівувати варіант?"
        description={
          confirmArchiveVariant
            ? `Буде архівовано варіант «${confirmArchiveVariant.label}». Цю дію не можна скасувати в інтерфейсі.`
            : ""
        }
        confirmLabel="Архівувати"
        confirmVariant="destructive"
        loading={archiveVariant.isPending}
        onClose={() => setConfirmArchiveVariant(null)}
        onConfirm={handleArchiveVariantConfirmed}
      />
    </motion.div>
  );
}
