export type CatalogListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortIndex: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogsListResponse = {
  catalogs: CatalogListItem[];
};

export type CatalogMutationResponse = {
  catalog: CatalogListItem;
};
