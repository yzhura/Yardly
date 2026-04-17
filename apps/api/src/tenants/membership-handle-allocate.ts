import { InternalServerErrorException } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import {
  MEMBERSHIP_HANDLE_GENERATED_MAX_LENGTH,
  MEMBERSHIP_HANDLE_STORED_REGEX,
} from "./membership-handle.constants";

/**
 * Picks a unique `handle` for `(tenantId, user)` inside a transaction.
 */
export async function allocateUniqueMembershipHandle(
  tx: Prisma.TransactionClient,
  tenantId: string,
  user: Pick<User, "id">,
): Promise<string> {
  const idClean = user.id.replace(/-/g, "").toLowerCase();
  const tail = idClean.slice(-4);
  for (let n = 0; n < 500; n++) {
    const extra = n === 0 ? "" : String(n);
    const candidate = (`user${tail}${extra}`)
      .slice(0, MEMBERSHIP_HANDLE_GENERATED_MAX_LENGTH)
      .toLowerCase();
    if (candidate.length < 3 || !MEMBERSHIP_HANDLE_STORED_REGEX.test(candidate)) {
      continue;
    }
    const taken = await tx.membership.findFirst({
      where: { tenantId, handle: candidate },
      select: { id: true },
    });
    if (!taken) {
      return candidate;
    }
  }
  throw new InternalServerErrorException("membership_handle_allocate_failed");
}
