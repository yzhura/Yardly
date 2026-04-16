/**
 * Supabase Storage public object URL (requires public read policy on the object key).
 * Keep aligned with `apps/api/src/lib/supabase-storage-public-url.ts`.
 */
export function buildSupabaseStoragePublicUrl(
  supabaseUrl: string,
  bucket: string,
  objectKey: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encodedKey}`;
}
