import { OrganizationRole } from "@prisma/client";
import { IsIn } from "class-validator";

export const MANAGEABLE_ROLES = [
  OrganizationRole.ADMIN,
  OrganizationRole.MANAGER,
  OrganizationRole.SHIPPER,
] as const;

export class UpdateMemberRoleDto {
  @IsIn(MANAGEABLE_ROLES)
  role!: (typeof MANAGEABLE_ROLES)[number];
}
