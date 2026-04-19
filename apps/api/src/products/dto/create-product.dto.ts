import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

const MAX_CATALOG_LINKS = 40;
import { ProductStatus } from "@prisma/client";
import { CreateProductVariantLineDto } from "./create-product-variant-line.dto";

const MAX_VARIANT_LINES = 200;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  description?: string | null;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CATALOG_LINKS)
  @IsString({ each: true })
  catalogIds!: string[];

  /** Обов’язковий, якщо хоча б у одного варіанта є `imagePaths` (завантаження до створення товару). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  draftUploadSessionId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VARIANT_LINES)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantLineDto)
  variants!: CreateProductVariantLineDto[];
}
