import { OrganizationRole } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";

export const INVITABLE_ROLES = [
  OrganizationRole.ADMIN,
  OrganizationRole.MANAGER,
  OrganizationRole.SHIPPER,
] as const;

export class CreateInvitationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  tenantId!: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsIn(INVITABLE_ROLES)
  role!: (typeof INVITABLE_ROLES)[number];
}
