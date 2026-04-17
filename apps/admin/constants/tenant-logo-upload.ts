export const TENANT_LOGO_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const TENANT_LOGO_UPLOAD_ACCEPT_ATTR = TENANT_LOGO_UPLOAD_MIME_TYPES.join(",");
export const TENANT_LOGO_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
