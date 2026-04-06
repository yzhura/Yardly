-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "memberships"
ADD COLUMN "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE';
