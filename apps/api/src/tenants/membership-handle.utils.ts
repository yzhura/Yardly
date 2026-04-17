import { BadRequestException } from "@nestjs/common";
import { MEMBERSHIP_HANDLE_STORED_REGEX } from "./membership-handle.constants";

export function normalizeAndValidateMembershipHandle(raw: string): string {
  if (typeof raw !== "string") {
    throw new BadRequestException("invalid_membership_handle");
  }
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0 || !MEMBERSHIP_HANDLE_STORED_REGEX.test(trimmed)) {
    throw new BadRequestException("invalid_membership_handle");
  }
  return trimmed;
}
