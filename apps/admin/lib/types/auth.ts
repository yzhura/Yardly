export type MembershipDto = {
  id: string;
  role: string;
  handle: string;
  tenant: { id: string; name: string };
};

export type AuthMeUserDto = {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  avatarPresetId: string | null;
  displayName: string | null;
  resolvedAvatarUrl: string | null;
};

export type AuthMeResponse = {
  user: AuthMeUserDto;
  memberships: MembershipDto[];
};
