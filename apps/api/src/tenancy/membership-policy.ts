import { ForbiddenException } from "@nestjs/common";
import { MembershipStatus, OrganizationRole } from "@prisma/client";
import type { PrismaService } from "../prisma/prisma.service";

/**
 * Shared tenant membership checks for domain services (materials, products, etc.).
 */
export async function assertActiveTenantMembership(
  prisma: PrismaService,
  appUserId: string,
  tenantId: string,
) {
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: appUserId, tenantId } },
  });

  if (!membership) {
    throw new ForbiddenException("not_a_member_of_tenant");
  }
  if (membership.status !== MembershipStatus.ACTIVE) {
    throw new ForbiddenException("membership_deactivated");
  }

  return membership;
}

export async function assertOwnerOrAdminTenantMembership(
  prisma: PrismaService,
  appUserId: string,
  tenantId: string,
  insufficientRoleMessage: string,
) {
  const membership = await assertActiveTenantMembership(prisma, appUserId, tenantId);

  if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
    throw new ForbiddenException(insufficientRoleMessage);
  }

  return membership;
}
