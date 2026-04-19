ALTER TABLE "product_variants"
ADD COLUMN "image_paths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
