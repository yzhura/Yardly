-- CreateEnum
CREATE TYPE "AttributeScope" AS ENUM ('MATERIAL', 'PRODUCT', 'BOTH');

-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "scope" "AttributeScope" NOT NULL DEFAULT 'BOTH',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "attribute_definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_index" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attribute_definitions_tenant_id_idx" ON "attribute_definitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_tenant_id_slug_key" ON "attribute_definitions"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "attribute_values_tenant_id_idx" ON "attribute_values"("tenant_id");

-- CreateIndex
CREATE INDEX "attribute_values_attribute_definition_id_idx" ON "attribute_values"("attribute_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_values_attribute_definition_id_slug_key" ON "attribute_values"("attribute_definition_id", "slug");

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_definition_id_fkey" FOREIGN KEY ("attribute_definition_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
