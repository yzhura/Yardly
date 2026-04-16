import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { AttributeScope } from "@prisma/client";

export class UpdateAttributeDefinitionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsEnum(AttributeScope)
  scope?: AttributeScope;
}

