"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/api/client";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { MOTION_DURATION, MOTION_EASE, surfaceReveal, listItemReveal } from "@/lib/motion";
import type {
  Material,
  MaterialCategory,
  MaterialSignedUploadResponse,
  MaterialStockStatus,
} from "@/api/materials/types";
import { useMaterials } from "@/api/materials/use-materials";
import { useMaterialCategories } from "@/api/materials/use-material-categories";
import { useColors } from "@/api/colors/use-colors";
import { useArchiveMaterial, useCreateMaterial, useUpdateMaterial } from "@/api/materials/use-material-actions";
import {
  useArchiveMaterialCategory,
  useCreateMaterialCategory,
  useUpdateMaterialCategory,
} from "@/api/materials/use-material-category-actions";
import { MaterialsTableHeadRow } from "./materials-table-head";
import { MaterialsTableBodySkeleton } from "./materials-skeleton";
import { MaterialTableColorCell } from "./material-table-color-cell";

const PAGE_SIZE = 4;
const UNIT_OPTIONS = ["м", "шт", "кг", "см"] as const;

const MATERIAL_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MATERIAL_IMAGE_ACCEPT = MATERIAL_IMAGE_MIME_TYPES.join(",");
const MATERIAL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const STOCK_STATUS_UI: Record<
  MaterialStockStatus,
  { label: string; dotClass: string; pillClass: string }
> = {
  ENOUGH: {
    label: "Достатньо",
    dotClass: "bg-emerald-500",
    pillClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  },
  ENDING: {
    label: "Закінчується",
    dotClass: "bg-amber-500",
    pillClass: "bg-amber-500/15 text-amber-700 border-amber-500/20",
  },
  LOW: {
    label: "Мало",
    dotClass: "bg-rose-500",
    pillClass: "bg-rose-500/15 text-rose-700 border-rose-500/20",
  },
};

type MaterialsViewProps = {
  tenantId: string;
  canManage: boolean;
  currentUserId: string;
  actorRole: string;
};

type PendingConfirm =
  | { type: "material-archive"; materialId: string; name: string }
  | { type: "category-archive"; categoryId: string; name: string };

function stockStatusPill(status: MaterialStockStatus) {
  const ui = STOCK_STATUS_UI[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        ui.pillClass,
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", ui.dotClass)} aria-hidden />
      {ui.label}
    </span>
  );
}

const materialFormSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, "Введіть назву матеріалу")
    .max(140, "Назва матеріалу має містити до 140 символів")
    .required("Введіть назву матеріалу"),
  sku: yup
    .string()
    .trim()
    .min(1, "Вкажіть артикул")
    .max(64, "Артикул має містити до 64 символів")
    .required("Вкажіть артикул"),
  categoryId: yup.string().trim().min(1, "Оберіть категорію").required("Оберіть категорію"),
  colorId: yup.string().trim().min(1, "Оберіть колір").required("Оберіть колір"),
  unit: yup
    .string()
    .oneOf([...UNIT_OPTIONS], "Оберіть одиницю виміру")
    .required("Оберіть одиницю виміру"),
  imagePath: yup.string().trim().optional(),
  quantityTotal: yup
    .number()
    .typeError("Залишок має бути числом")
    .min(0, "Залишок не може бути менше 0")
    .required("Вкажіть залишок"),
  quantityReserved: yup
    .number()
    .typeError("Резерв має бути числом")
    .min(0, "Резерв не може бути менше 0")
    .required("Вкажіть резерв"),
  minStock: yup
    .number()
    .typeError("Мінімальний поріг має бути числом")
    .min(0, "Мінімальний поріг не може бути менше 0")
    .required("Вкажіть мінімальний поріг"),
});

type MaterialFormValues = {
  name: string;
  sku: string;
  categoryId: string;
  colorId: string;
  unit: (typeof UNIT_OPTIONS)[number];
  imagePath?: string;
  quantityTotal: number;
  quantityReserved: number;
  minStock: number;
};

function formatQuantity(n: number) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  const maxDigits = abs >= 100 ? 0 : abs >= 10 ? 2 : 3;
  return n.toLocaleString("uk-UA", { maximumFractionDigits: maxDigits });
}

function ModalShell({
  open,
  title,
  description,
  children,
  loading,
  onClose,
  confirmLabel,
  onConfirm,
  hidePrimaryAction,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
  onClose: () => void;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  hidePrimaryAction?: boolean;
}) {
  if (!open) return null;
  const modal = (
    <motion.div
      className="fixed inset-0 z-[120] flex min-h-dvh items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
      role="presentation"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-xl rounded-2xl border border-border/90 bg-background p-5 shadow-2xl"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{
          ...{
            type: "spring",
            stiffness: 420,
            damping: 34,
            mass: 0.7,
          },
          opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-4">{children}</div>
        {hidePrimaryAction ? null : (
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Скасувати
            </Button>
            <Button
              type="button"
              onClick={() => {
                void onConfirm?.();
              }}
              disabled={loading}
            >
              {loading ? "Зачекайте..." : confirmLabel ?? "Підтвердити"}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  if (typeof window === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}

export function MaterialsView({ tenantId, canManage }: MaterialsViewProps) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data, isLoading, isError } = useMaterials({
    tenantId,
    filters: {
      q: q.trim() ? q.trim() : undefined,
      categoryId: selectedCategoryId ?? undefined,
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useMaterialCategories(tenantId);
  const { data: colorsData, isLoading: colorsLoading } = useColors(tenantId);

  const materials = useMemo(() => data?.materials ?? [], [data?.materials]);

  useEffect(() => {
    setPage(1);
  }, [q, selectedCategoryId]);

  const total = materials.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = materials.slice(start, start + PAGE_SIZE);
  const from = total === 0 ? 0 : start + 1;
  const to = start + pageRows.length;

  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialModalMode, setMaterialModalMode] = useState<"create" | "edit">("create");
  const [materialBeingEdited, setMaterialBeingEdited] = useState<Material | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const materialImageFileInputRef = useRef<HTMLInputElement>(null);

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const archiveMaterial = useArchiveMaterial();

  const createCategory = useCreateMaterialCategory();
  const updateCategory = useUpdateMaterialCategory();
  const archiveCategory = useArchiveMaterialCategory();

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const confirmCopy = useMemo(() => {
    if (!pendingConfirm) {
      return { title: "", description: "", confirmLabel: "" };
    }
    if (pendingConfirm.type === "material-archive") {
      return {
        title: "Підтвердити архівацію матеріалу",
        description: `Матеріал «${pendingConfirm.name}» буде прихований зі списку.`,
        confirmLabel: "Архівувати",
      };
    }
    return {
      title: "Підтвердити архівацію категорії",
      description: `Категорія «${pendingConfirm.name}» буде прихована зі списку.`,
      confirmLabel: "Архівувати",
    };
  }, [pendingConfirm]);

  async function onConfirmDelete() {
    if (!pendingConfirm) return;
    try {
      if (pendingConfirm.type === "material-archive") {
        await archiveMaterial.mutateAsync({
          tenantId,
          materialId: pendingConfirm.materialId,
        });
      } else {
        await archiveCategory.mutateAsync({
          tenantId,
          categoryId: pendingConfirm.categoryId,
        });
      }
    } finally {
      setPendingConfirm(null);
    }
  }

  // Categories modal
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<MaterialCategory | null>(null);

  const categoryFormSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(1, "Введіть назву категорії")
      .max(80, "Назва категорії має містити до 80 символів")
      .required("Введіть назву категорії"),
  });
  type CategoryFormValues = yup.InferType<typeof categoryFormSchema>;

  const categoryForm = useForm<CategoryFormValues>({
    resolver: yupResolver(categoryFormSchema),
    defaultValues: { name: "" },
    mode: "onTouched",
  });

  function startEditCategory(cat: MaterialCategory) {
    setCategoryEditing(cat);
    categoryForm.reset({ name: cat.name });
  }

  async function submitCategory(values: CategoryFormValues) {
    if (!categoriesData?.categories) return;
    try {
      if (categoryEditing) {
        await toast.promise(
          updateCategory.mutateAsync({
            tenantId,
            categoryId: categoryEditing.id,
            payload: { name: values.name },
          }),
          {
            pending: "Збереження…",
            success: "Категорію оновлено",
            error: "Не вдалося зберегти категорію",
          },
        );
      } else {
        await toast.promise(
          createCategory.mutateAsync({
            tenantId,
            name: values.name,
          }),
          {
            pending: "Збереження…",
            success: "Категорію створено",
            error: "Не вдалося створити категорію",
          },
        );
      }
      setCategoriesModalOpen(false);
      setCategoryEditing(null);
    } catch {
      // errors already handled by toast
    }
  }

  // Material form
  const materialForm = useForm<MaterialFormValues>({
    resolver: yupResolver(materialFormSchema) as Resolver<MaterialFormValues>,
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      colorId: "",
      unit: UNIT_OPTIONS[0],
      imagePath: undefined,
      quantityTotal: 0,
      quantityReserved: 0,
      minStock: 0,
    },
    mode: "onTouched",
  });

  const previewUrl = materialBeingEdited?.imageUrl ?? null;
  const [imagePreviewObjectUrl, setImagePreviewObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewObjectUrl) URL.revokeObjectURL(imagePreviewObjectUrl);
    };
  }, [imagePreviewObjectUrl]);

  function openCreateMaterial() {
    setMaterialModalMode("create");
    setMaterialBeingEdited(null);
    setImagePreviewObjectUrl(null);
    materialForm.reset({
      name: "",
      sku: "",
      categoryId: selectedCategoryId ?? categoriesData?.categories?.[0]?.id ?? "",
      colorId: colorsData?.colors?.[0]?.id ?? "",
      unit: UNIT_OPTIONS[0],
      imagePath: undefined,
      quantityTotal: 0,
      quantityReserved: 0,
      minStock: 0,
    });
    setMaterialModalOpen(true);
  }

  function openEditMaterial(m: Material) {
    setMaterialModalMode("edit");
    setMaterialBeingEdited(m);
    setImagePreviewObjectUrl(null);
    materialForm.reset({
      name: m.name,
      sku: m.sku,
      categoryId: m.category.id,
      colorId: m.color?.id ?? "",
      unit: m.unit,
      imagePath: undefined, // keep existing unless user uploads a new file
      quantityTotal: m.quantityTotal,
      quantityReserved: m.quantityReserved,
      minStock: m.minStock,
    });
    setMaterialModalOpen(true);
  }

  async function uploadMaterialImage(file: File) {
    const mimeType = file.type;
    if (!(MATERIAL_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
      toast.error("Дозволені лише JPEG, PNG або WebP.");
      return;
    }
    if (file.size > MATERIAL_IMAGE_MAX_BYTES) {
      toast.error("Файл завеликий. Максимум 5 МБ.");
      return;
    }

    setUploadBusy(true);
    try {
      await toast.promise(
        (async () => {
          const { data: sig } = await apiClient.post<MaterialSignedUploadResponse>(
            `/api/tenants/${tenantId}/materials/image/signed-upload`,
            { mimeType },
          );
          const supabase = createClient();
          const { error } = await supabase.storage
            .from(sig.bucket)
            .uploadToSignedUrl(sig.path, sig.token, file, { contentType: mimeType });

          if (error) throw error;

          if (imagePreviewObjectUrl) URL.revokeObjectURL(imagePreviewObjectUrl);
          const blobUrl = URL.createObjectURL(file);
          setImagePreviewObjectUrl(blobUrl);
          materialForm.setValue("imagePath", sig.storagePath ?? sig.path);
        })(),
        {
          pending: "Завантаження зображення…",
          success: "Зображення завантажено",
          error: "Не вдалося завантажити файл. Спробуйте ще раз.",
        },
      );
    } finally {
      setUploadBusy(false);
    }
  }

  const materialBusy = uploadBusy || createMaterial.isPending || updateMaterial.isPending;

  async function submitMaterial(values: MaterialFormValues) {
    const payloadBase = {
      tenantId,
      name: values.name,
      sku: values.sku,
      categoryId: values.categoryId,
      colorId: values.colorId,
      unit: values.unit,
      imagePath: values.imagePath ?? null,
      quantityTotal: values.quantityTotal,
      quantityReserved: values.quantityReserved,
      minStock: values.minStock,
    };

    if (materialModalMode === "create") {
      await toast.promise(createMaterial.mutateAsync(payloadBase), {
        pending: "Збереження…",
        success: "Матеріал створено",
        error: "Не вдалося зберегти матеріал",
      });
    } else if (materialBeingEdited) {
      const payload = {
        name: values.name,
        sku: values.sku,
        categoryId: values.categoryId,
        colorId: values.colorId,
        unit: values.unit,
        quantityTotal: values.quantityTotal,
        quantityReserved: values.quantityReserved,
        minStock: values.minStock,
        ...(values.imagePath ? { imagePath: values.imagePath } : {}),
      };
      await toast.promise(
        updateMaterial.mutateAsync({
          tenantId,
          materialId: materialBeingEdited.id,
          payload,
        }),
        {
          pending: "Збереження…",
          success: "Матеріал оновлено",
          error: "Не вдалося зберегти матеріал",
        },
      );
    }

    setMaterialModalOpen(false);
    setMaterialBeingEdited(null);
  }

  const isConfirmBusy = archiveMaterial.isPending || archiveCategory.isPending;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Склад матеріалів</h1>
        <Card className="border-destructive/40 shadow-sm" role="alert">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Не вдалося завантажити матеріали. Спробуйте оновити сторінку.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={surfaceReveal.initial}
      animate={surfaceReveal.animate}
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE }}
    >
      <ConfirmModal
        open={Boolean(pendingConfirm)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        confirmVariant="destructive"
        loading={isConfirmBusy}
        onConfirm={() => onConfirmDelete()}
        onClose={() => setPendingConfirm(null)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Склад матеріалів
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Додавайте матеріали для виробництва та керуйте залишками.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-col gap-2 sm:items-end sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoriesModalOpen(true)}
              disabled={categoriesLoading}
            >
              Керувати категоріями
            </Button>
            <Button type="button" className="shadow-sm" onClick={openCreateMaterial}>
              <Plus className="h-4 w-4" aria-hidden />
              Додати матеріал
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-[320px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук за назвою або артикулом…"
              aria-label="Пошук матеріалів"
            />
          </div>
          <div className="w-full sm:w-[260px]">
            <Select value={selectedCategoryId ?? "all"} onValueChange={(v) => setSelectedCategoryId(v === "all" ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Категорія" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі категорії</SelectItem>
                {categoriesData?.categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Показано {from}–{to} з {total}
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[960px] text-left text-sm" aria-busy={isLoading}>
              <thead>
                <MaterialsTableHeadRow />
              </thead>
              <tbody>
                {isLoading ? (
                  <MaterialsTableBodySkeleton />
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      Немає матеріалів для відображення.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((m) => (
                    <motion.tr
                      key={m.id}
                      className="border-b border-border/80 last:border-0 transition-colors duration-200 hover:bg-muted/30"
                      initial={listItemReveal.initial}
                      animate={listItemReveal.animate}
                      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40"
                            aria-hidden
                          >
                            {m.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">
                                {m.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{m.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.category.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{m.sku}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-border/60 bg-muted-foreground/20"
                            aria-hidden
                          />
                          <span className="text-foreground">{m.category.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <MaterialTableColorCell color={m.color} />
                      </td>
                      <td className="px-4 py-4 tabular-nums">
                        {formatQuantity(m.quantityAvailable)} {m.unit}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">—</td>
                      <td className="px-4 py-4">{stockStatusPill(m.stockStatus)}</td>
                      <td className="px-6 py-4">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 shrink-0"
                              aria-label={`Редагувати ${m.name}`}
                              disabled={materialBusy}
                              onClick={() => openEditMaterial(m)}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-9 w-9 shrink-0"
                              aria-label={`Архівувати ${m.name}`}
                              disabled={isConfirmBusy}
                              onClick={() => {
                                setPendingConfirm({
                                  type: "material-archive",
                                  materialId: m.id,
                                  name: m.name,
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Показано {from}–{to} з {total} матеріалів
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Попередня сторінка"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === safePage ? "default" : "outline"}
                size="sm"
                className={cn("h-9 w-9 p-0", p === safePage ? "" : "border-border")}
                onClick={() => setPage(p)}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Наступна сторінка"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Categories modal */}
      <ModalShell
        open={categoriesModalOpen}
        title="Категорії матеріалів"
        description="Категорії допомагають швидко фільтрувати матеріали."
        loading={createCategory.isPending || updateCategory.isPending || archiveCategory.isPending}
        onClose={() => {
          setCategoriesModalOpen(false);
          setCategoryEditing(null);
        }}
        hidePrimaryAction
      >
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <Form {...categoryForm}>
                <form
                  onSubmit={categoryForm.handleSubmit((v) => void submitCategory(v))}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Назва</FormLabel>
                          <FormControl>
                            <Input placeholder="Напр. Тканини" {...field} disabled={createCategory.isPending || updateCategory.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCategoryEditing(null);
                        categoryForm.reset({ name: "" });
                      }}
                      disabled={createCategory.isPending || updateCategory.isPending}
                    >
                      Очистити
                    </Button>
                    <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                      {categoryEditing ? "Зберегти зміни" : "Додати категорію"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              {categoriesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : categoriesData?.categories?.length ? (
                <div className="flex flex-col gap-2">
                  {categoriesData.categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 items-center gap-3 text-left"
                        onClick={() => startEditCategory(c)}
                        disabled={createCategory.isPending || updateCategory.isPending}
                      >
                        <span
                          className="h-3 w-3 rounded-full bg-muted-foreground/20"
                          aria-hidden
                        />
                        <span className="truncate font-medium">{c.name}</span>
                      </button>
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            onClick={() => startEditCategory(c)}
                            disabled={createCategory.isPending || updateCategory.isPending}
                            aria-label={`Редагувати категорію ${c.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-9 w-9"
                            onClick={() =>
                              setPendingConfirm({
                                type: "category-archive",
                                categoryId: c.id,
                                name: c.name,
                              })
                            }
                            disabled={isConfirmBusy}
                            aria-label={`Архівувати категорію ${c.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Категорій поки немає.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </ModalShell>

      {/* Material modal */}
      <ModalShell
        open={materialModalOpen}
        title={materialModalMode === "create" ? "Додати матеріал" : "Редагувати матеріал"}
        description="Заповніть основні поля та за потреби завантажте фото."
        loading={materialBusy || createMaterial.isPending || updateMaterial.isPending}
        onClose={() => {
          if (materialBusy) return;
          setMaterialModalOpen(false);
          setMaterialBeingEdited(null);
          materialForm.reset();
        }}
        confirmLabel={materialModalMode === "create" ? "Створити" : "Зберегти"}
        onConfirm={() => materialForm.handleSubmit((v) => void submitMaterial(v))()}
        hidePrimaryAction
      >
        <div className="space-y-4">
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit((v) => void submitMaterial(v))} className="space-y-4">
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <FormField
                        control={materialForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Назва</FormLabel>
                            <FormControl>
                              <Input placeholder="Напр. Атлас чорний" {...field} disabled={materialBusy} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={materialForm.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Артикул</FormLabel>
                            <FormControl>
                              <Input placeholder="SKU" {...field} disabled={materialBusy} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <div
                        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/40"
                        aria-label="Фото матеріалу"
                      >
                        {imagePreviewObjectUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagePreviewObjectUrl} alt="" className="h-full w-full object-cover" />
                        ) : previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">IMG</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={materialImageFileInputRef}
                          type="file"
                          accept={MATERIAL_IMAGE_ACCEPT}
                          className="sr-only"
                          tabIndex={-1}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadMaterialImage(file);
                            e.target.value = "";
                          }}
                          disabled={materialBusy}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={materialBusy}
                          onClick={() => materialImageFileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" aria-hidden />
                          Завантажити
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={materialForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категорія</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                          disabled={materialBusy || categoriesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть категорію" />
                          </SelectTrigger>
                          <SelectContent className="z-[130]">
                            {categoriesData?.categories?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={materialForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Одиниця виміру</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={(v) => field.onChange(v)} disabled={materialBusy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть одиницю" />
                          </SelectTrigger>
                          <SelectContent className="z-[130]">
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={materialForm.control}
                name="colorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Колір</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                        disabled={materialBusy || colorsLoading || !colorsData?.colors?.length}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть колір" />
                        </SelectTrigger>
                        <SelectContent className="z-[130]">
                          {colorsData?.colors?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full border border-border/60"
                                  style={{ backgroundColor: c.hex }}
                                  aria-hidden
                                />
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={materialForm.control}
                  name="quantityTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Залишок (всього)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={materialBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={materialForm.control}
                  name="quantityReserved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Зарезервовано</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={materialBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={materialForm.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Мінімальний поріг</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={materialBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image path stored in hidden field */}
              <FormField
                control={materialForm.control}
                name="imagePath"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input type="hidden" value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (materialBusy) return;
                    setMaterialModalOpen(false);
                    setMaterialBeingEdited(null);
                  }}
                  disabled={materialBusy}
                >
                  Скасувати
                </Button>
                <Button type="submit" disabled={materialBusy}>
                  {materialModalMode === "create" ? "Створити" : "Зберегти"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ModalShell>
    </motion.div>
  );
}

