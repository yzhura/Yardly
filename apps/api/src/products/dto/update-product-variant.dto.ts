import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const MAX_VARIANT_IMAGES = 10;

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) =>
    value === null ? null : typeof value === "string" ? (value.trim() === "" ? null : value.trim()) : value,
  )
  name?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99_999_999.99)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99_999_999.99)
  @Type(() => Number)
  compareAtPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99_999_999.99)
  @Type(() => Number)
  cost?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  @Type(() => Number)
  sortIndex?: number;

  /** When sent (including empty array), replaces all attribute bindings for the variant. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  attributeValueIds?: string[];

  /** Повна заміна галереї варіанта (разом з чернетковими `vd/p/…` шляхами). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_VARIANT_IMAGES)
  @IsString({ each: true })
  imagePaths?: string[];
}
