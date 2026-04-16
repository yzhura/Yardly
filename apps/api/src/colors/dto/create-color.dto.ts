import { Transform } from "class-transformer";
import { IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

function normalizeHex(value: string): string {
  // Keep strict #RRGGBB (Supabase accepts case-insensitive, but we normalize).
  const v = value.trim();
  return v.startsWith("#") ? v.toUpperCase() : `#${v.toUpperCase()}`;
}

export class CreateColorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? normalizeHex(value) : value,
  )
  @IsHexColor()
  hex!: string;
}

