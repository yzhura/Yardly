import { IsEnum, IsOptional } from "class-validator";
import { AttributeScope } from "@prisma/client";

export class ListAttributesQueryDto {
  @IsOptional()
  @IsEnum(AttributeScope)
  scope?: AttributeScope;
}

