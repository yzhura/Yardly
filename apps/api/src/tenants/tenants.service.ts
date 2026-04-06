import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrganizationRole } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async setup(supabaseUser: SupabaseUser, name: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name } });
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "OWNER",
        },
      });

      return {
        tenant: { id: tenant.id, name: tenant.name },
        membership: {
          id: membership.id,
          role: membership.role,
          tenantId: membership.tenantId,
        },
      };
    });
  }

  async listMembers(supabaseUser: SupabaseUser, tenantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertTenantMember(user.id, tenantId);

    const rows = await this.prisma.membership.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      members: rows.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
        user: { id: m.user.id, email: m.user.email },
      })),
    };
  }

  private async assertTenantMember(appUserId: string, tenantId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: { userId: appUserId, tenantId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("not_a_member_of_tenant");
    }
    return membership;
  }

  private async assertCanManageMembers(appUserId: string, tenantId: string) {
    const actorMembership = await this.assertTenantMember(appUserId, tenantId);
    if (
      actorMembership.role !== OrganizationRole.OWNER &&
      actorMembership.role !== OrganizationRole.ADMIN
    ) {
      throw new ForbiddenException("insufficient_role_to_manage_members");
    }
    return actorMembership;
  }

  private async getTargetMembership(tenantId: string, membershipId: string) {
    const target = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!target) {
      throw new NotFoundException("membership_not_found");
    }
    return target;
  }

  async updateMemberRole(
    supabaseUser: SupabaseUser,
    tenantId: string,
    membershipId: string,
    nextRole: "ADMIN" | "MANAGER" | "SHIPPER",
  ) {
    const actor = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    const actorMembership = await this.assertCanManageMembers(actor.id, tenantId);
    const target = await this.getTargetMembership(tenantId, membershipId);
    if (target.userId === actor.id) {
      throw new BadRequestException("cannot_change_own_role");
    }
    if (target.role === OrganizationRole.OWNER) {
      throw new ForbiddenException("cannot_change_owner_role");
    }
    if (
      actorMembership.role === OrganizationRole.ADMIN &&
      target.role === OrganizationRole.ADMIN
    ) {
      throw new ForbiddenException("admin_cannot_change_admin_role");
    }

    const updated = await this.prisma.membership.update({
      where: { id: target.id },
      data: { role: nextRole },
      include: { user: true },
    });

    return {
      member: {
        id: updated.id,
        role: updated.role,
        createdAt: updated.createdAt.toISOString(),
        user: { id: updated.user.id, email: updated.user.email },
      },
    };
  }

  async removeMember(
    supabaseUser: SupabaseUser,
    tenantId: string,
    membershipId: string,
  ) {
    const actor = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    const actorMembership = await this.assertCanManageMembers(actor.id, tenantId);
    const target = await this.getTargetMembership(tenantId, membershipId);
    if (target.userId === actor.id) {
      throw new BadRequestException("cannot_remove_self");
    }
    if (target.role === OrganizationRole.OWNER) {
      throw new ForbiddenException("cannot_remove_owner");
    }
    if (
      actorMembership.role === OrganizationRole.ADMIN &&
      target.role === OrganizationRole.ADMIN
    ) {
      throw new ForbiddenException("admin_cannot_remove_admin");
    }

    await this.prisma.membership.delete({ where: { id: target.id } });
    return { ok: true };
  }
}
