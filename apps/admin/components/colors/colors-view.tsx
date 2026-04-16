"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useColors } from "@/api/colors/use-colors";
import {
  useArchiveColor,
  useCreateColor,
  useUpdateColor,
} from "@/api/colors/use-color-actions";
import { cn } from "@/lib/utils";
import {
  APPLE_SPRING,
  listItemReveal,
  MOTION_DURATION,
  MOTION_EASE,
  surfaceReveal,
} from "@/lib/motion";

const COLOR_HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

type ColorsViewProps = {
  tenantId: string;
  canManage: boolean;
  embedded?: boolean;
};

type PendingConfirm = { type: "archive"; colorId: string; name: string } | null;
type ColorModalMode = "create" | "edit";

const formSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, "Введіть назву кольору")
    .max(80, "Назва кольору має містити до 80 символів")
    .required("Введіть назву кольору"),
  hex: yup
    .string()
    .trim()
    .matches(COLOR_HEX_REGEX, "Введіть коректний HEX у форматі #RRGGBB")
    .required("Вкажіть HEX колір"),
});

type FormValues = yup.InferType<typeof formSchema>;

export function ColorsView({
  tenantId,
  canManage,
  embedded = false,
}: ColorsViewProps) {
  const { data, isLoading } = useColors(tenantId);

  const createColor = useCreateColor();
  const updateColor = useUpdateColor();
  const archiveColor = useArchiveColor();

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const confirmBusy = archiveColor.isPending;

  const confirmCopy = useMemo(() => {
    if (!pendingConfirm) return null;
    return {
      title: "Підтвердити архівацію кольору",
      description: `Колір «${pendingConfirm.name}» буде прихований зі списку.`,
      confirmLabel: "Архівувати",
    };
  }, [pendingConfirm]);

  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [colorModalMode, setColorModalMode] = useState<ColorModalMode>("create");
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: yupResolver(formSchema),
    defaultValues: { name: "", hex: "#000000" },
    mode: "onTouched",
  });
  const formBusy = createColor.isPending || updateColor.isPending;

  function openCreateColorModal() {
    setColorModalMode("create");
    setEditingColorId(null);
    form.reset({ name: "", hex: "#000000" });
    setColorModalOpen(true);
  }

  function openEditColorModal(colorId: string) {
    const color = data?.colors.find((x) => x.id === colorId);
    if (!color) return;
    setColorModalMode("edit");
    setEditingColorId(colorId);
    form.reset({ name: color.name, hex: color.hex });
    setColorModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    if (!canManage) return;

    try {
      if (colorModalMode === "edit" && editingColorId) {
        await toast.promise(
          updateColor.mutateAsync({
            tenantId,
            colorId: editingColorId,
            payload: { name: values.name, hex: values.hex },
          }),
          {
            pending: "Збереження…",
            success: "Колір оновлено",
            error: "Не вдалося зберегти колір",
          },
        );
      } else {
        await toast.promise(
          createColor.mutateAsync({
            tenantId,
            name: values.name,
            hex: values.hex,
          }),
          {
            pending: "Збереження…",
            success: "Колір створено",
            error: "Не вдалося створити колір",
          },
        );
      }
      setEditingColorId(null);
      setColorModalOpen(false);
      form.reset({ name: "", hex: "#000000" });
    } catch {
      // toast already shows error
    }
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
        title={confirmCopy?.title ?? "Підтвердити"}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel ?? "Підтвердити"}
        confirmVariant="destructive"
        loading={confirmBusy}
        onConfirm={async () => {
          if (!pendingConfirm || pendingConfirm.type !== "archive") return;
          await archiveColor.mutateAsync({
            tenantId,
            colorId: pendingConfirm.colorId,
          });
          setPendingConfirm(null);
        }}
        onClose={() => {
          if (!confirmBusy) setPendingConfirm(null);
        }}
      />

      {typeof window !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {colorModalOpen ? (
                <motion.div
                  className="fixed inset-0 z-[120] flex min-h-dvh items-center justify-center bg-black/40 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
                  onClick={() => {
                    if (!formBusy) setColorModalOpen(false);
                  }}
                  role="presentation"
                >
                  <motion.div
                    className="w-full max-w-xl rounded-2xl border border-border/90 bg-background p-5 shadow-2xl"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{
                      ...APPLE_SPRING,
                      opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
                    }}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={colorModalMode === "edit" ? "Редагування кольору" : "Створення кольору"}
                  >
                    <h3 className="text-lg font-semibold text-foreground">
                      {colorModalMode === "edit" ? "Редагувати колір" : "Додати колір"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Вкажіть назву і HEX-код кольору.
                    </p>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((v) => void onSubmit(v))} className="mt-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Назва</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Напр. Чорний"
                                  disabled={!canManage || formBusy}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hex"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>HEX</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    disabled={!canManage || formBusy}
                                    className="h-10 w-14 cursor-pointer rounded-md border border-border/60 bg-background p-1"
                                    aria-label="Вибір кольору"
                                  />
                                  <Input
                                    value={field.value}
                                    readOnly
                                    disabled={!canManage || formBusy}
                                    className="max-w-[180px] bg-muted/60"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (!formBusy) setColorModalOpen(false);
                            }}
                            disabled={formBusy}
                          >
                            Скасувати
                          </Button>
                          <Button type="submit" disabled={!canManage || formBusy}>
                            {colorModalMode === "edit" ? "Зберегти" : "Створити"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {embedded ? (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Кольори</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Кольори потрібні для точних фільтрів у товарах та матеріалах.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Кольори
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Кольори потрібні для точних фільтрів у товарах та матеріалах.
            </p>
          </div>
        )}
        {canManage ? (
          <Button type="button" onClick={openCreateColorModal}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Додати колір
          </Button>
        ) : null}
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto overscroll-x-contain">
                <table
                  className="w-full min-w-[640px] text-left text-sm"
                  aria-busy={isLoading}
                >
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Колір
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        HEX
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.colors?.length ? (
                      data.colors.map((c) => {
                        return (
                          <motion.tr
                            key={c.id}
                            className={cn(
                              "border-b border-border/80 last:border-0 transition-colors duration-200",
                              "hover:bg-muted/30",
                            )}
                            initial={listItemReveal.initial}
                            animate={listItemReveal.animate}
                            transition={{
                              duration: MOTION_DURATION.fast,
                              ease: MOTION_EASE,
                            }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className="inline-block h-3.5 w-3.5 rounded-full border border-border/60"
                                  style={{ backgroundColor: c.hex }}
                                  aria-hidden
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">
                                    {c.name}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {c.slug}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground tabular-nums">
                              {c.hex}
                            </td>
                            <td className="px-4 py-4">
                              {canManage ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9"
                                    aria-label={`Редагувати ${c.name}`}
                                    onClick={() => openEditColorModal(c.id)}
                                  >
                                    <Pencil className="h-4 w-4" aria-hidden />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="h-9 w-9"
                                    aria-label={`Архівувати ${c.name}`}
                                    onClick={() =>
                                      setPendingConfirm({
                                        type: "archive",
                                        colorId: c.id,
                                        name: c.name,
                                      })
                                    }
                                    disabled={confirmBusy}
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-muted-foreground"
                        >
                          Немає кольорів для відображення.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
