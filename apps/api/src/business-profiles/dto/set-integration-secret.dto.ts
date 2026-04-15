import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SetIntegrationSecretDto {
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  secret!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  label?: string;
}
