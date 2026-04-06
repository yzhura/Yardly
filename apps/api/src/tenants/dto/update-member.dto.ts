import { MembershipStatus } from "@prisma/client";
import { IsIn, IsOptional } from "class-validator";
import { MANAGEABLE_ROLES } from "./update-member-role.dto";

export class UpdateMemberDto {
  @IsOptional()
  @IsIn(MANAGEABLE_ROLES)
  role?: (typeof MANAGEABLE_ROLES)[number];

  /** Only reactivation is allowed via PATCH; deactivation remains DELETE. */
  @IsOptional()
  @IsIn([MembershipStatus.ACTIVE])
  status?: MembershipStatus;
}
