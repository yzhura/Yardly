import type { User } from "@prisma/client";
import { buildSupabaseStoragePublicUrl } from "../lib/supabase-storage-public-url";
import { isUserAvatarPresetId } from "./user-avatar-presets";

export type ResolvedAvatarUrlOptions = {
  supabaseUrl: string;
  /** Storage bucket containing preset images (default: `presets`). */
  presetBucket?: string;
  /** Path prefix inside the bucket, e.g. `avatars` → `avatars/avatar_1.webp` (default: `avatars`). */
  presetPrefix?: string;
};

/** Public object URL for a preset under `object/public/{bucket}/{prefix}/{id}.webp`. */
export function buildPresetAvatarPublicUrl(
  presetId: string,
  opts: ResolvedAvatarUrlOptions,
): string | null {
  if (!isUserAvatarPresetId(presetId)) {
    return null;
  }
  const bucket = opts.presetBucket ?? "presets";
  const prefixRaw = opts.presetPrefix ?? "avatars";
  const prefix = prefixRaw.endsWith("/") ? prefixRaw : `${prefixRaw}/`;
  const objectKey = `${prefix}${presetId}.webp`;
  return buildSupabaseStoragePublicUrl(opts.supabaseUrl, bucket, objectKey);
}

export function resolveUserDisplayName(
  user: Pick<User, "firstName" | "lastName" | "email">,
): string | null {
  const first = user.firstName?.trim() ?? "";
  const last = user.lastName?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  if (combined.length > 0) {
    return combined;
  }
  const email = user.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    return local || email;
  }
  return null;
}
