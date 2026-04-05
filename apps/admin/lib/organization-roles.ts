export const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  OWNER: "Власник",
  ADMIN: "Адміністратор",
  MANAGER: "Менеджер",
  SHIPPER: "Відправник",
};

export function organizationRoleLabel(role: string): string {
  return ORGANIZATION_ROLE_LABELS[role] ?? role;
}
