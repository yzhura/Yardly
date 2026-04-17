import { MembershipStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import {
  MEMBERSHIP_HANDLE_INPUT_REGEX,
  MEMBERSHIP_HANDLE_MAX_LENGTH,
  MEMBERSHIP_HANDLE_MIN_LENGTH,
} from "../membership-handle.constants";
import { MANAGEABLE_ROLES } from "./update-member-role.dto";

export class UpdateMemberDto {
  @IsOptional()
  @IsIn(MANAGEABLE_ROLES)
  role?: (typeof MANAGEABLE_ROLES)[number];

  /** Only reactivation is allowed via PATCH; deactivation remains DELETE. */
  @IsOptional()
  @IsIn([MembershipStatus.ACTIVE])
  status?: MembershipStatus;

  /** Per-tenant @handle (self only). Omit when not updating. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_, v) => v !== undefined)
  @IsString()
  @MinLength(MEMBERSHIP_HANDLE_MIN_LENGTH)
  @MaxLength(MEMBERSHIP_HANDLE_MAX_LENGTH)
  @Matches(MEMBERSHIP_HANDLE_INPUT_REGEX, {
    message: "invalid_membership_handle",
  })
  handle?: string;
}
