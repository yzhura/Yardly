const TENANT_CUID_REGEX = /^c[a-z0-9]{24}$/i;

/** True if `value` is a non-empty Prisma-style cuid suitable for `tenantId`. */
export function isTenantCuid(value: string | null | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return TENANT_CUID_REGEX.test(value.trim());
}
