export const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  OWNER: "Власник",
  ADMIN: "Адміністратор",
  MANAGER: "Менеджер",
  SHIPPER: "Відправник",
};

/** Roles that can be assigned when inviting a user (OWNER is never invite-only). */
export const INVITABLE_ROLES = ["ADMIN", "MANAGER", "SHIPPER"] as const;

export function organizationRoleLabel(role: string): string {
  return ORGANIZATION_ROLE_LABELS[role] ?? role;
}
