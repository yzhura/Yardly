/** Allowed `File.type` values for custom avatar upload (aligned with API `AvatarSignedUploadDto`). */
export const USER_PROFILE_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const USER_PROFILE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const USER_PROFILE_UPLOAD_ACCEPT_ATTR = USER_PROFILE_UPLOAD_MIME_TYPES.join(",");
