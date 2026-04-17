export type UserProfileTenantPersona = {
  tenantId: string;
  membershipId: string;
  tenantName: string;
  handle: string;
};

export type UserProfileResponse = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  avatarPresetId: string | null;
  displayName: string | null;
  resolvedAvatarUrl: string | null;
  /** Present when `X-Tenant-Id` is sent and the user belongs to that tenant. */
  tenantPersona: UserProfileTenantPersona | null;
};

export type UpdateUserProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  avatarPresetId?: string | null;
  /** `@handle` in the active organization (same request must include active tenant cookie → `X-Tenant-Id`). */
  tenantHandle?: string;
};

export type AvatarSignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
  /** Object path to persist in `avatarUrl` after upload (same as `path`). */
  storagePath: string;
};
