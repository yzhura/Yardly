/*
  Warnings:

  - You are about to drop the column `color` on the `material_categories` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `materials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "material_categories" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "color",
ADD COLUMN     "color_id" TEXT;

-- CreateTable
CREATE TABLE "colors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "colors_tenant_id_idx" ON "colors"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "colors_tenant_id_slug_key" ON "colors"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "colors_tenant_id_hex_key" ON "colors"("tenant_id", "hex");

-- AddForeignKey
ALTER TABLE "colors" ADD CONSTRAINT "colors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
