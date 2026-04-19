-- Ordered gallery: storage paths inside tenant folder (private bucket + signed URLs from API).
ALTER TABLE "products"
ADD COLUMN "image_paths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
