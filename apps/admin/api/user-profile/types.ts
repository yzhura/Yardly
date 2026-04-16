export type UserProfileResponse = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  avatarPresetId: string | null;
  displayName: string | null;
  resolvedAvatarUrl: string | null;
};

export type UpdateUserProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  avatarPresetId?: string | null;
};

export type AvatarSignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
  /** Object path to persist in `avatarUrl` after upload (same as `path`). */
  storagePath: string;
};
