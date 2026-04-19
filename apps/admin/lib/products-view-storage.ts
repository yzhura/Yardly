export type ProductsListViewMode = "table" | "grid";

const STORAGE_KEY = "yardly.products.listViewMode";

export function readProductsListViewMode(): ProductsListViewMode {
  if (typeof window === "undefined") return "table";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "grid" ? "grid" : "table";
  } catch {
    return "table";
  }
}

export function writeProductsListViewMode(mode: ProductsListViewMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}
