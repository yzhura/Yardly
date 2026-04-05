import type { InviteErrorCode } from "@/constants/team-invite";

export class InviteMutationError extends Error {
  constructor(public readonly code: InviteErrorCode) {
    super(code);
    this.name = "InviteMutationError";
  }
}
