-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('NOVA_POSHTA', 'CHECKBOX');

-- AlterTable
ALTER TABLE "tenants"
ADD COLUMN "active_business_profile_id" TEXT;

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "tax_id" TEXT,
    "registration_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_credentials" (
    "id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "auth_tag" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "masked_value" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_active_business_profile_id_key" ON "tenants"("active_business_profile_id");

-- CreateIndex
CREATE INDEX "business_profiles_tenant_id_idx" ON "business_profiles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_business_profile_id_provider_key" ON "integration_credentials"("business_profile_id", "provider");

-- CreateIndex
CREATE INDEX "integration_credentials_provider_idx" ON "integration_credentials"("provider");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_active_business_profile_id_fkey" FOREIGN KEY ("active_business_profile_id") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
