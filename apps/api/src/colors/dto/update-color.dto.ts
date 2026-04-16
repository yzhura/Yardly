import { Transform } from "class-transformer";
import { IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

function normalizeHex(value: string): string {
  const v = value.trim();
  return v.startsWith("#") ? v.toUpperCase() : `#${v.toUpperCase()}`;
}

export class UpdateColorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? normalizeHex(value) : value,
  )
  @IsHexColor()
  hex?: string;
}

