import {
  USER_AVATAR_PRESET_IDS,
  isUserAvatarPresetId as isSharedUserAvatarPresetId,
} from "@yardly/shared";

export { USER_AVATAR_PRESET_IDS };

export type UserAvatarPresetId = (typeof USER_AVATAR_PRESET_IDS)[number];

export function isUserAvatarPresetId(value: string): value is UserAvatarPresetId {
  return isSharedUserAvatarPresetId(value);
}
