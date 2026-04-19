"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-toastify";
import type { ProductListQuery, ProductListItem, ProductStatus } from "@/api/products/types";
import { useCatalogs } from "@/api/catalogs/use-catalogs";
import { useProductsList } from "@/api/products/use-products-list";
import { useArchiveProduct } from "@/api/products/use-product-actions";
import { productListQueryToSearchParams, parseProductListQuery } from "@/lib/products-list-query";
import {
  readProductsListViewMode,
  writeProductsListViewMode,
  type ProductsListViewMode,
} from "@/lib/products-view-storage";
import { formatVariantPriceRange } from "@/lib/product-price";
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
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MOTION_DURATION, MOTION_EASE, surfaceReveal } from "@/lib/motion";

const ProductGridCard = dynamic(
  () => import("./product-grid-card").then((m) => ({ default: m.ProductGridCard })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-xl" aria-hidden />,
  },
);

const STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: "Активний",
  DRAFT: "Чернетка",
};

const STATUS_PILL: Record<ProductStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-800 border-emerald-500/25",
  DRAFT: "bg-slate-500/10 text-slate-700 border-slate-500/20",
};

const STATUS_DOT: Record<ProductStatus, string> = {
  ACTIVE: "bg-emerald-500",
  DRAFT: "bg-slate-400",
};

function replaceListQuery(pathname: string, router: ReturnType<typeof useRouter>, next: ProductListQuery) {
  const sp = productListQueryToSearchParams(next);
  const qs = sp.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
}

function paginationItems(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

function ProductPhotoPlaceholder({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL from API
      <img
        src={imageUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg border border-border/60 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/60 text-xs font-bold text-muted-foreground"
      aria-hidden
    >
      {initials || "—"}
    </div>
  );
}

function collectTags(product: ProductListItem): string[] {
  const tags = product.variants.flatMap((v) => v.attributeTags);
  return [...new Set(tags)].slice(0, 4);
}

type ProductsViewProps = {
  tenantId: string;
  canManage: boolean;
};

export function ProductsView({ tenantId, canManage }: ProductsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listQuery = useMemo(() => parseProductListQuery(searchParams), [searchParams]);
  const { data: catalogsData } = useCatalogs(tenantId);
  const catalogOptions = useMemo(() => catalogsData?.catalogs ?? [], [catalogsData?.catalogs]);

  const [searchDraft, setSearchDraft] = useState(listQuery.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ProductsListViewMode>("table");
  const [archiveTarget, setArchiveTarget] = useState<ProductListItem | null>(null);

  useEffect(() => {
    setViewMode(readProductsListViewMode());
  }, []);

  useEffect(() => {
    setSearchDraft(listQuery.q ?? "");
  }, [listQuery.q]);

  const setQuery = useCallback(
    (next: ProductListQuery) => {
      replaceListQuery(pathname, router, next);
    },
    [pathname, router],
  );

  const handleViewMode = (mode: ProductsListViewMode) => {
    setViewMode(mode);
    writeProductsListViewMode(mode);
  };

  const { data, isLoading, isFetching } = useProductsList({ tenantId, query: listQuery });
  const archiveProduct = useArchiveProduct();

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  };

  const sortValue = `${listQuery.sortBy ?? "createdAt"}:${listQuery.sortOrder ?? "desc"}`;

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveProduct.mutateAsync({ tenantId, productId: archiveTarget.id });
      toast.success("Товар архівовано");
      setArchiveTarget(null);
      router.refresh();
    } catch {
      toast.error("Не вдалося архівувати товар");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Список товарів</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Керування каталогом: пошук, фільтри, сортування та перемикання вигляду таблиці чи карток.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              className="gap-1.5 px-3"
              onClick={() => handleViewMode("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Табличний вигляд"
            >
              <Table2 className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Таблиця</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              className="gap-1.5 px-3"
              onClick={() => handleViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Картки"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Картки</span>
            </Button>
          </div>
          {canManage ? (
            <Button asChild className="gap-2">
              <Link href="/products/new">
                <Plus className="h-4 w-4" aria-hidden />
                Додати товар
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery({
              ...listQuery,
              q: searchDraft.trim() || undefined,
              page: 1,
            });
          }}
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Пошук за назвою або артикулом (SKU)…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              aria-label="Пошук товарів"
            />
          </div>
          <Button type="submit" variant="secondary" className="sm:w-auto">
            Шукати
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          className="gap-2 self-start lg:self-center"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <Filter className="h-4 w-4" aria-hidden />
          Фільтри
        </Button>
      </div>

      {filtersOpen ? (
        <Card className="border-dashed border-primary/25 bg-primary/[0.03] shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1.5 sm:min-w-[200px]">
              <p className="text-xs font-medium text-muted-foreground">Статус</p>
              <Select
                value={listQuery.status ?? "all"}
                onValueChange={(v) =>
                  setQuery({
                    ...listQuery,
                    status: v === "all" ? undefined : (v as ProductStatus),
                    page: 1,
                  })
                }
              >
                <SelectTrigger aria-label="Фільтр за статусом">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[130]">
                  <SelectItem value="all">Усі статуси</SelectItem>
                  <SelectItem value="ACTIVE">Активні</SelectItem>
                  <SelectItem value="DRAFT">Чернетки</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:min-w-[220px]">
              <p className="text-xs font-medium text-muted-foreground">Каталог</p>
              <Select
                value={listQuery.catalogId ?? "all"}
                onValueChange={(v) =>
                  setQuery({
                    ...listQuery,
                    catalogId: v === "all" ? undefined : v,
                    page: 1,
                  })
                }
              >
                <SelectTrigger aria-label="Фільтр за каталогом">
                  <SelectValue placeholder="Усі каталоги" />
                </SelectTrigger>
                <SelectContent className="z-[130]">
                  <SelectItem value="all">Усі каталоги</SelectItem>
                  {catalogOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:min-w-[240px]">
              <p className="text-xs font-medium text-muted-foreground">Сортування</p>
              <Select
                value={sortValue}
                onValueChange={(v) => {
                  const [sortBy, sortOrder] = v.split(":") as [
                    NonNullable<ProductListQuery["sortBy"]>,
                    NonNullable<ProductListQuery["sortOrder"]>,
                  ];
                  setQuery({ ...listQuery, sortBy, sortOrder, page: 1 });
                }}
              >
                <SelectTrigger aria-label="Сортування списку">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[130]">
                  <SelectItem value="createdAt:desc">Новіші спочатку</SelectItem>
                  <SelectItem value="createdAt:asc">Старіші спочатку</SelectItem>
                  <SelectItem value="name:asc">Назва А–Я</SelectItem>
                  <SelectItem value="name:desc">Назва Я–А</SelectItem>
                  <SelectItem value="status:asc">Статус (А→Ч)</SelectItem>
                  <SelectItem value="status:desc">Статус (Ч→А)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:min-w-[140px]">
              <p className="text-xs font-medium text-muted-foreground">На сторінці</p>
              <Select
                value={String(listQuery.pageSize ?? 20)}
                onValueChange={(v) =>
                  setQuery({
                    ...listQuery,
                    pageSize: Number(v),
                    page: 1,
                  })
                }
              >
                <SelectTrigger aria-label="Кількість на сторінці">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[130]">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Завантаження товарів">
          {viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[880px] space-y-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-4 border-b border-border/60 px-4 py-4">
                        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48 max-w-full" />
                          <Skeleton className="h-3 w-28 max-w-full" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[420px] rounded-xl" />
              ))}
            </div>
          )}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Товарів не знайдено. Спробуйте змінити пошук або фільтри — або додайте перший товар до каталогу.
            </p>
            {canManage ? (
              <Button asChild>
                <Link href="/products/new">Додати товар</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="relative border-border shadow-sm">
          {isFetching ? (
            <div
              className="pointer-events-none absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-primary/80"
              aria-hidden
            />
          ) : null}
          <CardContent className="p-0">
            <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1020px] text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Фото</th>
                    <th className="px-4 py-3">Назва та артикул</th>
                    <th className="px-4 py-3">Теги</th>
                    <th className="px-4 py-3">Каталоги</th>
                    <th className="px-4 py-3">Ціна</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const tags = collectTags(p);
                    const primarySku = p.variants[0]?.sku ?? "—";
                    const prices = p.variants.map((v) => v.price);
                    return (
                      <tr key={p.id} className="border-b border-border/60 transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3 align-middle">
                          <ProductPhotoPlaceholder name={p.name} imageUrl={p.primaryImageUrl} />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-semibold text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">SKU: {primarySku}</div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {tags.length ? (
                            <div className="flex flex-wrap gap-1">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {p.catalogs?.length ? (
                            <div className="flex max-w-[220px] flex-wrap gap-1">
                              {p.catalogs.map((c) => (
                                <span
                                  key={c.id}
                                  className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle tabular-nums font-medium">
                          {formatVariantPriceRange(prices)}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              STATUS_PILL[p.status],
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[p.status])} aria-hidden />
                            {STATUS_LABEL[p.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild aria-label="Редагувати товар">
                              <Link href={`/products/${p.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            {canManage ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label="Архівувати товар"
                                onClick={() => setArchiveTarget(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isFetching ? (
            <div
              className="pointer-events-none absolute right-2 top-0 h-2 w-2 animate-pulse rounded-full bg-primary/80"
              aria-hidden
            />
          ) : null}
          {products.map((p) => (
            <ProductGridCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!isLoading && products.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Показано {from}-{to} з {pagination.total} товарів
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pagination.page <= 1}
              aria-label="Попередня сторінка"
              onClick={() => setQuery({ ...listQuery, page: Math.max(1, pagination.page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-wrap items-center gap-1">
              {paginationItems(pagination.page, pagination.totalPages).map((item, idx) =>
                item === "gap" ? (
                  <span key={`g-${idx}`} className="px-2 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={item === pagination.page ? "default" : "outline"}
                    className="min-w-9"
                    onClick={() => setQuery({ ...listQuery, page: item })}
                  >
                    {item}
                  </Button>
                ),
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pagination.page >= pagination.totalPages}
              aria-label="Наступна сторінка"
              onClick={() =>
                setQuery({
                  ...listQuery,
                  page: Math.min(pagination.totalPages, pagination.page + 1),
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Архівувати товар?"
        description={
          archiveTarget
            ? `Товар «${archiveTarget.name}» та всі його варіанти будуть приховані зі списку.`
            : undefined
        }
        confirmLabel="Архівувати"
        confirmVariant="destructive"
        loading={archiveProduct.isPending}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
    </motion.div>
  );
}
