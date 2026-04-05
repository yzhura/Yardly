export type MembershipDto = {
  id: string;
  role: string;
  tenant: { id: string; name: string };
};

export type AuthMeResponse = {
  user: { id: string; authUserId: string; email: string | null };
  memberships: MembershipDto[];
};
