import type { ReadonlyURLSearchParams } from "next/navigation";
import type { ProductListQuery } from "@/api/products/types";

const DEFAULT_PAGE_SIZE = 20;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parseProductListQuery(searchParams: ReadonlyURLSearchParams): ProductListQuery {
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(100, parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE));
  const sortByRaw = searchParams.get("sortBy");
  const sortBy =
    sortByRaw === "name" || sortByRaw === "status" || sortByRaw === "createdAt" ? sortByRaw : "createdAt";
  const sortOrderRaw = searchParams.get("sortOrder");
  const sortOrder = sortOrderRaw === "asc" || sortOrderRaw === "desc" ? sortOrderRaw : "desc";
  const statusRaw = searchParams.get("status");
  const status = statusRaw === "DRAFT" || statusRaw === "ACTIVE" ? statusRaw : undefined;
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120) || undefined;
  const catalogIdRaw = (searchParams.get("catalogId") ?? "").trim();
  const catalogId = catalogIdRaw.length > 0 ? catalogIdRaw.slice(0, 32) : undefined;

  return { page, pageSize, sortBy, sortOrder, status, q, catalogId };
}

export function productListQueryToSearchParams(query: ProductListQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(query.pageSize));
  if (query.sortBy && query.sortBy !== "createdAt") sp.set("sortBy", query.sortBy);
  if (query.sortOrder && query.sortOrder !== "desc") sp.set("sortOrder", query.sortOrder);
  if (query.status) sp.set("status", query.status);
  if (query.q) sp.set("q", query.q);
  if (query.catalogId) sp.set("catalogId", query.catalogId);
  return sp;
}
