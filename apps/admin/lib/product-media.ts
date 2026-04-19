/** Shared rules for product gallery + material image uploads (Supabase signed upload). */

export const TENANT_IMAGE_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** MIME types plus extensions (macOS / Windows often leave `file.type` empty for HEIC). */
export const TENANT_IMAGE_UPLOAD_ACCEPT = [
  TENANT_IMAGE_UPLOAD_MIME_TYPES.join(","),
  ".heic",
  ".heif",
].join(",");

export function resolveTenantImageUploadMime(
  file: File,
): (typeof TENANT_IMAGE_UPLOAD_MIME_TYPES)[number] | null {
  const t = file.type?.trim().toLowerCase();
  if (t && (TENANT_IMAGE_UPLOAD_MIME_TYPES as readonly string[]).includes(t)) {
    return t as (typeof TENANT_IMAGE_UPLOAD_MIME_TYPES)[number];
  }
  const n = file.name.toLowerCase();
  if (n.endsWith(".heic")) return "image/heic";
  if (n.endsWith(".heif")) return "image/heif";
  return null;
}

// —— Products (form + API client) ——
export const PRODUCT_IMAGE_MIME_TYPES = TENANT_IMAGE_UPLOAD_MIME_TYPES;
export const PRODUCT_IMAGE_ACCEPT = TENANT_IMAGE_UPLOAD_ACCEPT;
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_COUNT = 10;

// —— Materials (same MIME/accept as products) ——
export const MATERIAL_IMAGE_MIME_TYPES = TENANT_IMAGE_UPLOAD_MIME_TYPES;
export const MATERIAL_IMAGE_ACCEPT = TENANT_IMAGE_UPLOAD_ACCEPT;
export const MATERIAL_IMAGE_MAX_BYTES = PRODUCT_IMAGE_MAX_BYTES;
