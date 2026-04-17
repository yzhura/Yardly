/**
 * Must match `apps/api/src/tenancy/tenant-cuid.ts` (Prisma-style tenant id).
 */
const TENANT_CUID_REGEX = /^c[a-z0-9]{24}$/i;

export function isTenantCuid(value: string | null | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return TENANT_CUID_REGEX.test(value.trim());
}
