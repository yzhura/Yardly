"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCatalogs } from "@/api/catalogs/use-catalogs";
import {
  useArchiveCatalog,
  useCreateCatalog,
  useUpdateCatalog,
} from "@/api/catalogs/use-catalog-actions";
import type { CatalogListItem } from "@/api/catalogs/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOTION_DURATION, MOTION_EASE, surfaceReveal } from "@/lib/motion";

type CatalogsViewProps = {
  tenantId: string;
  canManage: boolean;
};

export function CatalogsView({ tenantId, canManage }: CatalogsViewProps) {
  const { data, isLoading } = useCatalogs(tenantId);
  const createCatalog = useCreateCatalog();
  const updateCatalog = useUpdateCatalog();
  const archiveCatalog = useArchiveCatalog();

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editing, setEditing] = useState<CatalogListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<CatalogListItem | null>(
    null,
  );

  const catalogs = data?.catalogs ?? [];

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Введіть назву каталогу");
      return;
    }
    try {
      await createCatalog.mutateAsync({
        tenantId,
        name: newName.trim(),
        description: newDescription.trim() || null,
      });
      toast.success("Каталог створено");
      setNewName("");
      setNewDescription("");
    } catch {
      toast.error("Не вдалося створити каталог");
    }
  };

  const openEdit = (c: CatalogListItem) => {
    setEditing(c);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editing || !editName.trim()) return;
    try {
      await updateCatalog.mutateAsync({
        tenantId,
        catalogId: editing.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      toast.success("Каталог оновлено");
      setEditing(null);
    } catch {
      toast.error("Не вдалося зберегти зміни");
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveCatalog.mutateAsync({
        tenantId,
        catalogId: archiveTarget.id,
      });
      toast.success("Каталог архівовано");
      setArchiveTarget(null);
    } catch {
      toast.error("Не вдалося архівувати каталог");
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-8"
      variants={surfaceReveal}
      initial="initial"
      animate="animate"
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Каталоги
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Групуйте товари для вітрини та звітів. Кожен активний товар має бути
            принаймні в одному каталозі.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/products">До списку товарів</Link>
        </Button>
      </div>

      {canManage ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Новий каталог</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="catalog-new-name">Назва</Label>
                <Input
                  id="catalog-new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Напр. Халати"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="catalog-new-desc">Опис (необов’язково)</Label>
                <Textarea
                  id="catalog-new-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Коротко для команди"
                />
              </div>
            </div>
            <Button
              type="button"
              className="shrink-0 gap-2"
              onClick={handleCreate}
              disabled={createCatalog.isPending}
            >
              {createCatalog.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              Створити
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Усі каталоги</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2
                className="h-8 w-8 animate-spin text-primary"
                aria-hidden
              />
            </div>
          ) : catalogs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Каталогів ще немає. Створіть перший — він знадобиться для
              додавання товарів.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Назва</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Товарів</th>
                    <th className="px-4 py-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogs.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/60 hover:bg-muted/15"
                    >
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.slug}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {c.productCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canManage ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setArchiveTarget(c)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => !updateCatalog.isPending && setEditing(null)}
        >
          <Card
            className="w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Редагування каталогу"
          >
            <CardHeader>
              <CardTitle className="text-lg">Редагування каталогу</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Назва</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">Опис</Label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={updateCatalog.isPending}
                >
                  Скасувати
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updateCatalog.isPending}
                >
                  Зберегти
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Архівувати каталог?"
        description={
          archiveTarget
            ? `Каталог «${archiveTarget.name}» буде приховано. Товари, які залишаться лише без каталогів, блокують архівацію.`
            : undefined
        }
        confirmLabel="Архівувати"
        confirmVariant="destructive"
        loading={archiveCatalog.isPending}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
    </motion.div>
  );
}
