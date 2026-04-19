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

export class CreateProductVariantLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? (value.trim() === "" ? undefined : value.trim()) : value,
  )
  name?: string | null;

  @IsNumber()
  @Min(0)
  @Max(99_999_999.99)
  @Type(() => Number)
  price!: number;

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
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  attributeValueIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_VARIANT_IMAGES)
  @IsString({ each: true })
  imagePaths?: string[];
}
