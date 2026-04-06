export type TenantMemberRole = "OWNER" | "ADMIN" | "MANAGER" | "SHIPPER";

export type TenantMemberRow = {
  id: string;
  role: TenantMemberRole;
  createdAt: string;
  user: { id: string; email: string | null };
};

export type TenantMembersResponse = {
  members: TenantMemberRow[];
};
