import { Transform, Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ProductStatus } from "@prisma/client";

export type ProductListSortBy = "createdAt" | "name" | "status";
export type ProductListSortOrder = "asc" | "desc";

export class ListProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsIn(["createdAt", "name", "status"])
  sortBy?: ProductListSortBy;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: ProductListSortOrder;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  catalogId?: string;
}
