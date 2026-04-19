-- CreateTable
CREATE TABLE "catalogs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_index" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_products" (
    "catalog_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sort_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("catalog_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogs_tenant_id_slug_key" ON "catalogs"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "catalogs_tenant_id_idx" ON "catalogs"("tenant_id");

-- CreateIndex
CREATE INDEX "catalog_products_product_id_idx" ON "catalog_products"("product_id");

-- CreateIndex
CREATE INDEX "catalog_products_catalog_id_idx" ON "catalog_products"("catalog_id");

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one default catalog per tenant that already has products, link all active products.
INSERT INTO "catalogs" ("id", "tenant_id", "name", "slug", "description", "sort_index", "is_archived", "created_at", "updated_at")
SELECT
    'c' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 24) AS "id",
    t."tenant_id",
    'Основний каталог' AS "name",
    'osnovnyy-katalog' AS "slug",
    NULL AS "description",
    0 AS "sort_index",
    false AS "is_archived",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "tenant_id" FROM "products" WHERE "is_archived" = false) AS t("tenant_id");

INSERT INTO "catalog_products" ("catalog_id", "product_id", "sort_index")
SELECT c."id", p."id", 0
FROM "products" AS p
INNER JOIN "catalogs" AS c
    ON c."tenant_id" = p."tenant_id"
    AND c."slug" = 'osnovnyy-katalog'
    AND c."is_archived" = false
WHERE p."is_archived" = false;
