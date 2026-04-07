import { OrganizationRole } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional, Matches, MaxLength } from "class-validator";

export const INVITABLE_ROLES = [
  OrganizationRole.ADMIN,
  OrganizationRole.MANAGER,
  OrganizationRole.SHIPPER,
] as const;

export class CreateInvitationDto {
  @IsOptional()
  @Matches(/^c[a-z0-9]{24}$/i)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  tenantId?: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsIn(INVITABLE_ROLES)
  role!: (typeof INVITABLE_ROLES)[number];
}
