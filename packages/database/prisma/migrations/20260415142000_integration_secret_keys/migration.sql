-- CreateEnum
CREATE TYPE "IntegrationSecretKey" AS ENUM (
  'NOVA_POSHTA_API_KEY',
  'CHECKBOX_LICENCE_KEY',
  'CHECKBOX_TEST_LICENCE_KEY',
  'CHECKBOX_PINCODE',
  'CHECKOX_TEST_PINCODE'
);

-- AlterTable
ALTER TABLE "integration_credentials"
ADD COLUMN "key_name" "IntegrationSecretKey";

-- Backfill existing rows based on provider
UPDATE "integration_credentials"
SET "key_name" = CASE
  WHEN "provider" = 'NOVA_POSHTA' THEN 'NOVA_POSHTA_API_KEY'::"IntegrationSecretKey"
  WHEN "provider" = 'CHECKBOX' THEN 'CHECKBOX_LICENCE_KEY'::"IntegrationSecretKey"
  ELSE 'NOVA_POSHTA_API_KEY'::"IntegrationSecretKey"
END
WHERE "key_name" IS NULL;

-- AlterTable
ALTER TABLE "integration_credentials"
ALTER COLUMN "key_name" SET NOT NULL;

-- DropIndex
DROP INDEX "integration_credentials_business_profile_id_provider_key";

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_business_profile_id_provider_key_name_key"
ON "integration_credentials"("business_profile_id", "provider", "key_name");
