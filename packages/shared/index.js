const PRESET_AVATAR_COUNT = 14;

const USER_AVATAR_PRESET_IDS = Array.from(
  { length: PRESET_AVATAR_COUNT },
  (_, i) => `avatar_${i + 1}`,
);

function isUserAvatarPresetId(value) {
  return USER_AVATAR_PRESET_IDS.includes(value);
}

module.exports = {
  PRESET_AVATAR_COUNT,
  USER_AVATAR_PRESET_IDS,
  isUserAvatarPresetId,
};
