import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateMaterialCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @MinLength(1)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name?: string;
}

