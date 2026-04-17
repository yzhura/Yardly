export type TenantMemberRole = "OWNER" | "ADMIN" | "MANAGER" | "SHIPPER";
export type TenantMemberStatus = "ACTIVE" | "DEACTIVATED";

export type TenantMemberRow = {
  id: string;
  role: TenantMemberRole;
  status: TenantMemberStatus;
  /** Lowercase unique @handle within the tenant. */
  handle: string;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    avatarPresetId: string | null;
    displayName: string | null;
    resolvedAvatarUrl: string | null;
  };
};

export type TenantMembersResponse = {
  members: TenantMemberRow[];
};
