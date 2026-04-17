"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  listItemReveal,
  MOTION_DURATION,
  MOTION_EASE,
  surfaceReveal,
} from "@/lib/motion";
import { ColorsView } from "@/components/colors/colors-view";
import { AttributeModalShell } from "./attribute-modal-shell";
import { useAttributes } from "@/api/attributes/use-attributes";
import {
  useArchiveDefinition,
  useArchiveValue,
  useCreateDefinition,
  useCreateValue,
  useUpdateDefinition,
  useUpdateValue,
} from "@/api/attributes/use-attribute-actions";
import type {
  AttributeDefinition,
  AttributeScope,
  AttributeValue,
} from "@/api/attributes/types";

type AttributesViewProps = {
  tenantId: string;
  canManage: boolean;
};

const scopeOptions: { label: string; value: AttributeScope }[] = [
  { label: "Матеріали", value: "MATERIAL" },
  { label: "Товари", value: "PRODUCT" },
  { label: "Матеріали і товари", value: "BOTH" },
];

function scopeLabel(scope: AttributeScope): string {
  return scopeOptions.find((o) => o.value === scope)?.label ?? scope;
}

const definitionSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, "Введіть назву характеристики")
    .max(80, "Назва характеристики має містити до 80 символів")
    .required("Введіть назву характеристики"),
  scope: yup
    .mixed<AttributeScope>()
    .oneOf(
      ["MATERIAL", "PRODUCT", "BOTH"],
      "Оберіть застосування характеристики",
    )
    .required("Оберіть застосування характеристики"),
});

const valueSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, "Введіть назву значення")
    .max(80, "Назва значення має містити до 80 символів")
    .required("Введіть назву значення"),
  sortIndex: yup
    .number()
    .typeError("Порядок має бути числом")
    .min(0, "Порядок не може бути менше 0")
    .required("Вкажіть порядок"),
});

type DefinitionFormValues = yup.InferType<typeof definitionSchema>;
type ValueFormValues = yup.InferType<typeof valueSchema>;

type DefinitionModalMode = "create" | "edit";
type ValueModalMode = "create" | "edit";

type ConfirmState =
  | { type: "definition"; id: string; name: string }
  | { type: "value"; definitionId: string; id: string; name: string }
  | null;

export function AttributesView({ tenantId, canManage }: AttributesViewProps) {
  const { data, isLoading } = useAttributes({ tenantId });

  const createDefinition = useCreateDefinition();
  const updateDefinition = useUpdateDefinition();
  const archiveDefinition = useArchiveDefinition();
  const createValue = useCreateValue();
  const updateValue = useUpdateValue();
  const archiveValue = useArchiveValue();

  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const confirmBusy = archiveDefinition.isPending || archiveValue.isPending;

  const confirmCopy = useMemo(() => {
    if (!confirmState) return null;
    if (confirmState.type === "definition") {
      return {
        title: "Підтвердити архівацію характеристики",
        description: `Характеристика «${confirmState.name}» і її значення будуть приховані.`,
        confirmLabel: "Архівувати",
      };
    }
    return {
      title: "Підтвердити архівацію значення",
      description: `Значення «${confirmState.name}» буде приховано.`,
      confirmLabel: "Архівувати",
    };
  }, [confirmState]);

  const [definitionModalOpen, setDefinitionModalOpen] = useState(false);
  const [definitionModalMode, setDefinitionModalMode] =
    useState<DefinitionModalMode>("create");
  const [editingDefinitionId, setEditingDefinitionId] = useState<string | null>(
    null,
  );

  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [valueModalMode, setValueModalMode] =
    useState<ValueModalMode>("create");
  const [valueModalDefinitionId, setValueModalDefinitionId] = useState<
    string | null
  >(null);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);

  const definitionForm = useForm<DefinitionFormValues>({
    resolver: yupResolver(definitionSchema),
    defaultValues: { name: "", scope: "BOTH" },
    mode: "onTouched",
  });

  const valueForm = useForm<ValueFormValues>({
    resolver: yupResolver(valueSchema),
    defaultValues: { name: "", sortIndex: 0 },
    mode: "onTouched",
  });

  const definitionBusy =
    createDefinition.isPending || updateDefinition.isPending;
  const valueBusy = createValue.isPending || updateValue.isPending;

  const valueModalDefinition = useMemo(
    () =>
      data?.definitions.find((d) => d.id === valueModalDefinitionId) ?? null,
    [data?.definitions, valueModalDefinitionId],
  );

  function nextValueSortIndex(definition: AttributeDefinition): number {
    if (!definition.values.length) return 0;
    const max = Math.max(...definition.values.map((v) => v.sortIndex));
    return max + 1;
  }

  function openCreateDefinitionModal() {
    setDefinitionModalMode("create");
    setEditingDefinitionId(null);
    definitionForm.reset({ name: "", scope: "BOTH" });
    setDefinitionModalOpen(true);
  }

  function openEditDefinitionModal(definition: AttributeDefinition) {
    setDefinitionModalMode("edit");
    setEditingDefinitionId(definition.id);
    definitionForm.reset({ name: definition.name, scope: definition.scope });
    setDefinitionModalOpen(true);
  }

  function openCreateValueModal(definitionId: string) {
    const definition = data?.definitions.find((d) => d.id === definitionId);
    if (!definition) return;
    setValueModalMode("create");
    setValueModalDefinitionId(definitionId);
    setEditingValueId(null);
    valueForm.reset({ name: "", sortIndex: nextValueSortIndex(definition) });
    setValueModalOpen(true);
  }

  function openEditValueModal(definitionId: string, value: AttributeValue) {
    setValueModalMode("edit");
    setValueModalDefinitionId(definitionId);
    setEditingValueId(value.id);
    valueForm.reset({ name: value.name, sortIndex: value.sortIndex });
    setValueModalOpen(true);
  }

  async function submitDefinition(values: DefinitionFormValues) {
    if (!canManage) return;
    try {
      if (definitionModalMode === "edit" && editingDefinitionId) {
        await toast.promise(
          updateDefinition.mutateAsync({
            tenantId,
            definitionId: editingDefinitionId,
            payload: values,
          }),
          {
            pending: "Збереження…",
            success: "Характеристику оновлено",
            error: "Не вдалося зберегти характеристику",
          },
        );
      } else {
        await toast.promise(
          createDefinition.mutateAsync({ tenantId, ...values }),
          {
            pending: "Збереження…",
            success: "Характеристику створено",
            error: "Не вдалося створити характеристику",
          },
        );
      }
      setEditingDefinitionId(null);
      setDefinitionModalOpen(false);
      definitionForm.reset({ name: "", scope: "BOTH" });
    } catch {
      // toast
    }
  }

  async function submitValue(values: ValueFormValues) {
    if (!canManage || !valueModalDefinitionId) return;
    try {
      if (valueModalMode === "edit" && editingValueId) {
        await toast.promise(
          updateValue.mutateAsync({
            tenantId,
            definitionId: valueModalDefinitionId,
            valueId: editingValueId,
            payload: values,
          }),
          {
            pending: "Збереження…",
            success: "Значення оновлено",
            error: "Не вдалося оновити значення",
          },
        );
      } else {
        await toast.promise(
          createValue.mutateAsync({
            tenantId,
            definitionId: valueModalDefinitionId,
            ...values,
          }),
          {
            pending: "Збереження…",
            success: "Значення створено",
            error: "Не вдалося створити значення",
          },
        );
      }
      setEditingValueId(null);
      setValueModalOpen(false);
      setValueModalDefinitionId(null);
      valueForm.reset({ name: "", sortIndex: 0 });
    } catch {
      // toast
    }
  }

  const definitionModalTitle =
    definitionModalMode === "edit"
      ? "Редагувати характеристику"
      : "Додати характеристику";
  const definitionModalAria =
    definitionModalMode === "edit"
      ? "Редагування характеристики"
      : "Створення характеристики";

  const valueModalTitle =
    valueModalMode === "edit" ? "Редагувати значення" : "Додати значення";
  const valueModalAria =
    valueModalMode === "edit"
      ? "Редагування значення характеристики"
      : "Додавання значення характеристики";

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={surfaceReveal.initial}
      animate={surfaceReveal.animate}
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE }}
    >
      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmCopy?.title ?? "Підтвердити"}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel ?? "Підтвердити"}
        confirmVariant="destructive"
        loading={confirmBusy}
        onClose={() => {
          if (!confirmBusy) setConfirmState(null);
        }}
        onConfirm={async () => {
          if (!confirmState) return;
          if (confirmState.type === "definition") {
            await archiveDefinition.mutateAsync({
              tenantId,
              definitionId: confirmState.id,
            });
            if (editingDefinitionId === confirmState.id) {
              setDefinitionModalOpen(false);
              setEditingDefinitionId(null);
              definitionForm.reset({ name: "", scope: "BOTH" });
            }
          } else {
            await archiveValue.mutateAsync({
              tenantId,
              definitionId: confirmState.definitionId,
              valueId: confirmState.id,
            });
            if (valueModalOpen && editingValueId === confirmState.id) {
              setValueModalOpen(false);
              setValueModalDefinitionId(null);
              setEditingValueId(null);
              valueForm.reset({ name: "", sortIndex: 0 });
            }
          }
          setConfirmState(null);
        }}
      />

      {typeof window !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {definitionModalOpen ? (
                <AttributeModalShell
                  key="definition-modal"
                  busy={definitionBusy}
                  onBackdropClose={() => setDefinitionModalOpen(false)}
                  ariaLabel={definitionModalAria}
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {definitionModalTitle}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Назва та сфера застосування характеристики для матеріалів і
                    товарів.
                  </p>

                  <Form {...definitionForm}>
                    <form
                      onSubmit={definitionForm.handleSubmit(
                        (v) => void submitDefinition(v),
                      )}
                      className="mt-4 space-y-4"
                    >
                      <FormField
                        control={definitionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Назва характеристики</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Напр. Розмір чашки"
                                disabled={!canManage || definitionBusy}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={definitionForm.control}
                        name="scope"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Застосування</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!canManage || definitionBusy}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть сферу" />
                                </SelectTrigger>
                                <SelectContent className="z-[130]">
                                  {scopeOptions.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!definitionBusy) setDefinitionModalOpen(false);
                          }}
                          disabled={definitionBusy}
                        >
                          Скасувати
                        </Button>
                        <Button
                          type="submit"
                          disabled={!canManage || definitionBusy}
                        >
                          {definitionModalMode === "edit"
                            ? "Зберегти"
                            : "Створити"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </AttributeModalShell>
              ) : null}
              {valueModalOpen ? (
                <AttributeModalShell
                  key="value-modal"
                  busy={valueBusy}
                  onBackdropClose={() => setValueModalOpen(false)}
                  ariaLabel={valueModalAria}
                >
                  {!valueModalDefinition ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Характеристику не знайдено.
                      <div className="mt-4 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setValueModalOpen(false)}
                        >
                          Закрити
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">
                        {valueModalTitle}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Характеристика:{" "}
                        <span className="font-medium text-foreground">
                          {valueModalDefinition.name}
                        </span>
                      </p>

                      <Form {...valueForm}>
                        <form
                          onSubmit={valueForm.handleSubmit(
                            (v) => void submitValue(v),
                          )}
                          className="mt-4 space-y-4"
                        >
                          <FormField
                            control={valueForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Назва значення</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Напр. Чашка A"
                                    disabled={!canManage || valueBusy}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={valueForm.control}
                            name="sortIndex"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Порядок</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    disabled={!canManage || valueBusy}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex flex-wrap justify-end gap-2 pt-1">
                            {valueModalMode === "edit" &&
                            editingValueId &&
                            canManage ? (
                              <Button
                                type="button"
                                variant="destructive"
                                className="mr-auto"
                                disabled={valueBusy}
                                onClick={() => {
                                  const v = valueModalDefinition.values.find(
                                    (x) => x.id === editingValueId,
                                  );
                                  setConfirmState({
                                    type: "value",
                                    definitionId: valueModalDefinition.id,
                                    id: editingValueId,
                                    name: v?.name ?? "значення",
                                  });
                                }}
                              >
                                Архівувати
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (!valueBusy) setValueModalOpen(false);
                              }}
                              disabled={valueBusy}
                            >
                              Скасувати
                            </Button>
                            <Button
                              type="submit"
                              disabled={!canManage || valueBusy}
                            >
                              {valueModalMode === "edit"
                                ? "Зберегти"
                                : "Створити"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </>
                  )}
                </AttributeModalShell>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Характеристики
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Створюйте керовані характеристики та значення, щоб уникнути
            дублювань і хаосу у фільтрах.
          </p>
        </div>
        {canManage ? (
          <Button type="button" onClick={openCreateDefinitionModal}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Додати характеристику
          </Button>
        ) : null}
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {data?.definitions?.length ? (
                data.definitions.map((definition) => (
                  <motion.div
                    key={definition.id}
                    className="rounded-lg border border-border/80 bg-background p-4"
                    initial={listItemReveal.initial}
                    animate={listItemReveal.animate}
                    transition={{
                      duration: MOTION_DURATION.fast,
                      ease: MOTION_EASE,
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {definition.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {definition.slug} · {scopeLabel(definition.scope)}
                          {definition.isSystem ? " · системний" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canManage ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openCreateValueModal(definition.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" aria-hidden />
                            Додати значення
                          </Button>
                        ) : null}
                        {canManage ? (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-9 w-9"
                              aria-label={`Редагувати характеристику ${definition.name}`}
                              onClick={() =>
                                openEditDefinitionModal(definition)
                              }
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-9 w-9"
                              aria-label={`Архівувати характеристику ${definition.name}`}
                              onClick={() =>
                                setConfirmState({
                                  type: "definition",
                                  id: definition.id,
                                  name: definition.name,
                                })
                              }
                              disabled={confirmBusy}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {definition.values.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {definition.values.map((value) => (
                          <div
                            key={value.id}
                            className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/80 bg-muted/20 pl-3 pr-1 py-1 text-xs text-foreground"
                          >
                            <button
                              type="button"
                              className="min-w-0 truncate text-left hover:underline"
                              onClick={() =>
                                openEditValueModal(definition.id, value)
                              }
                            >
                              <span>{value.name}</span>
                              <span className="ml-1 text-muted-foreground tabular-nums">
                                #{value.sortIndex}
                              </span>
                            </button>
                            {canManage ? (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                aria-label={`Архівувати значення ${value.name}`}
                                disabled={confirmBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmState({
                                    type: "value",
                                    definitionId: definition.id,
                                    id: value.id,
                                    name: value.name,
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Немає значень.
                      </p>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/80 p-10 text-center text-muted-foreground">
                  Характеристики ще не створені.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ColorsView tenantId={tenantId} canManage={canManage} embedded />
    </motion.div>
  );
}
