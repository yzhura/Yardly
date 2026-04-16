import { buildSupabaseStoragePublicUrl } from "@/lib/supabase-storage-public-url";
import {
  USER_AVATAR_PRESET_IDS,
  isUserAvatarPresetId as isSharedUserAvatarPresetId,
} from "@yardly/shared";

export const USER_PROFILE_PRESET_IDS = USER_AVATAR_PRESET_IDS;

export type UserProfilePresetId = (typeof USER_PROFILE_PRESET_IDS)[number];

export function isUserProfilePresetId(
  value: string,
): value is UserProfilePresetId {
  return isSharedUserAvatarPresetId(value);
}

export function presetAvatarObjectUrl(presetId: string): string | null {
  if (!isUserProfilePresetId(presetId)) {
    return null;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }
  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_PRESET_AVATAR_BUCKET ?? "presets";
  const prefixRaw =
    process.env.NEXT_PUBLIC_SUPABASE_PRESET_AVATAR_PREFIX ?? "avatars";
  const prefix = prefixRaw.endsWith("/") ? prefixRaw : `${prefixRaw}/`;
  const objectKey = `${prefix}${presetId}.webp`;
  return buildSupabaseStoragePublicUrl(base, bucket, objectKey);
}

export function presetAvatarAriaLabel(id: UserProfilePresetId): string {
  const n = Number(id.replace("avatar_", ""));
  return `Пресет аватара ${Number.isFinite(n) ? n : id}`;
}
