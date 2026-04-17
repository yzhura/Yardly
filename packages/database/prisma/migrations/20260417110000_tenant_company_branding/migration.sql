-- Add tenant company branding fields.
ALTER TABLE "tenants"
ADD COLUMN "logo_url" TEXT;
