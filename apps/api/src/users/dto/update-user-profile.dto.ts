import { Transform } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import {
  MEMBERSHIP_HANDLE_INPUT_REGEX,
  MEMBERSHIP_HANDLE_MAX_LENGTH,
  MEMBERSHIP_HANDLE_MIN_LENGTH,
} from "../../tenants/membership-handle.constants";
import { USER_AVATAR_PRESET_IDS } from "../user-avatar-presets";

const presetList = [...USER_AVATAR_PRESET_IDS];

function trimOrNull(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const t = value.trim();
  return t.length === 0 ? null : t;
}

export class UpdateUserProfileDto {
  @IsOptional()
  @Transform(({ value }) => trimOrNull(value))
  @IsString()
  @MaxLength(80)
  firstName?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimOrNull(value))
  @IsString()
  @MaxLength(80)
  lastName?: string | null;

  /**
   * Custom avatar: HTTPS URL (legacy) or Storage object path in the user avatars bucket
   * (e.g. `avatars/{userId}/{file}.webp` when `SUPABASE_USER_AVATAR_BUCKET` is `users`).
   */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(512)
  avatarUrl?: string | null;

  /** Preset id (`avatar_1`…`avatar_18`), or null to clear preset selection. */
  @IsOptional()
  @Transform(({ value }) => trimOrNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @IsIn(presetList)
  avatarPresetId?: string | null;

  /**
   * `@handle` for the active organization (requires `X-Tenant-Id` on the request).
   */
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_, v) => v !== undefined)
  @IsString()
  @MinLength(MEMBERSHIP_HANDLE_MIN_LENGTH)
  @MaxLength(MEMBERSHIP_HANDLE_MAX_LENGTH)
  @Matches(MEMBERSHIP_HANDLE_INPUT_REGEX, {
    message: "invalid_membership_handle",
  })
  tenantHandle?: string;
}
