import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

function trimString(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

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
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }) => trimString(value))
  name?: string;

  /**
   * Company logo reference: HTTPS URL (legacy) or Storage object path
   * (`logos/{tenantId}/{filename}`).
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(512)
  @Transform(({ value }) => trimOrNull(value))
  logoUrl?: string | null;
}
