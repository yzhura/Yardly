import { Transform } from "class-transformer";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import {
  MATERIAL_ALLOWED_UNITS,
  parseOptionalFloat,
  transformMaterialUnit,
} from "./material-dto-helpers";

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  sku?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  categoryId?: string;

  @IsOptional()
  @IsString()
  colorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Transform(transformMaterialUnit)
  @IsIn([...MATERIAL_ALLOWED_UNITS])
  unit?: (typeof MATERIAL_ALLOWED_UNITS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(512)
  imagePath?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }: { value: unknown }) => parseOptionalFloat(value))
  quantityTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }: { value: unknown }) => parseOptionalFloat(value))
  quantityReserved?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }: { value: unknown }) => parseOptionalFloat(value))
  minStock?: number;
}
