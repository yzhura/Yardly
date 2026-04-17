import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AttributeScope, MembershipStatus, OrganizationRole } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { buildSupabaseStoragePublicUrl } from "../lib/supabase-storage-public-url";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { TenantLogoSignedUploadDto } from "./dto/tenant-logo-signed-upload.dto";
import { PrismaService } from "../prisma/prisma.service";
import { resolveUserDisplayName } from "../users/user-profile.utils";
import { UsersService } from "../users/users.service";
import { UpdateTenantSettingsDto } from "./dto/update-tenant-settings.dto";

const TENANT_LOGO_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async setup(supabaseUser: SupabaseUser, name: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name } });
      const sizeDefinition = await tx.attributeDefinition.create({
        data: {
          tenantId: tenant.id,
          name: "Розмір",
          slug: "size",
          scope: AttributeScope.BOTH,
          isSystem: true,
        },
      });
      await tx.attributeValue.createMany({
        data: [
          { tenantId: tenant.id, attributeDefinitionId: sizeDefinition.id, name: "XS", slug: "xs", sortIndex: 10 },
          { tenantId: tenant.id, attributeDefinitionId: sizeDefinition.id, name: "S", slug: "s", sortIndex: 20 },
          { tenantId: tenant.id, attributeDefinitionId: sizeDefinition.id, name: "M", slug: "m", sortIndex: 30 },
          { tenantId: tenant.id, attributeDefinitionId: sizeDefinition.id, name: "L", slug: "l", sortIndex: 40 },
          { tenantId: tenant.id, attributeDefinitionId: sizeDefinition.id, name: "XL", slug: "xl", sortIndex: 50 },
        ],
      });
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

    const members = await Promise.all(
      rows.map(async (m) => {
        const resolvedAvatarUrl = await this.usersService.getResolvedAvatarUrl(m.user);
        return {
          id: m.id,
          role: m.role,
          status: m.status,
          createdAt: m.createdAt.toISOString(),
          user: {
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            avatarUrl: m.user.avatarUrl,
            avatarPresetId: m.user.avatarPresetId,
            displayName: resolveUserDisplayName(m.user),
            resolvedAvatarUrl,
          },
        };
      }),
    );

    return { members };
  }

  async getTenantSettings(supabaseUser: SupabaseUser, tenantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertTenantMember(user.id, tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, logoUrl: true },
    });
    if (!tenant) {
      throw new NotFoundException("tenant_not_found");
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        resolvedLogoUrl: await this.getResolvedTenantLogoUrl(tenant.id, tenant.logoUrl),
      },
    };
  }

  async updateTenantSettings(
    supabaseUser: SupabaseUser,
    tenantId: string,
    dto: UpdateTenantSettingsDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageTenantSettings(user.id, tenantId);

    if (dto.name === undefined && dto.logoUrl === undefined) {
      throw new BadRequestException("no_updates");
    }

    if (dto.logoUrl !== undefined && dto.logoUrl !== null) {
      this.assertTenantLogoUrlAllowed(tenantId, dto.logoUrl);
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl,
      },
      select: { id: true, name: true, logoUrl: true },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        resolvedLogoUrl: await this.getResolvedTenantLogoUrl(tenant.id, tenant.logoUrl),
      },
    };
  }

  async createTenantLogoSignedUpload(
    supabaseUser: SupabaseUser,
    tenantId: string,
    dto: TenantLogoSignedUploadDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageTenantSettings(user.id, tenantId);

    const bucket = this.getTenantLogoBucket();
    const ext = TENANT_LOGO_MIME_TO_EXT[dto.mimeType];
    if (!ext) {
      throw new BadRequestException("unsupported_mime");
    }

    const path = this.buildTenantLogoObjectPath(tenantId, `${randomUUID()}.${ext}`);
    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      throw new InternalServerErrorException("tenant_logo_upload_unavailable");
    }

    return {
      bucket,
      path,
      token: data.token,
      storagePath: path,
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
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException("membership_deactivated");
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

  private async assertCanManageTenantSettings(appUserId: string, tenantId: string) {
    const membership = await this.assertTenantMember(appUserId, tenantId);
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenException("insufficient_role_to_manage_tenant_settings");
    }
    return membership;
  }

  private getTenantLogoBucket(): string {
    return this.config.get<string>("SUPABASE_TENANT_LOGO_BUCKET") ?? "users";
  }

  private getTenantLogoPrefix(): string {
    const raw = this.config.get<string>("SUPABASE_TENANT_LOGO_PREFIX") ?? "logos";
    return raw.replace(/^\/+|\/+$/g, "");
  }

  private buildTenantLogoObjectPath(tenantId: string, fileName: string): string {
    return `${this.getTenantLogoPrefix()}/${tenantId}/${fileName}`;
  }

  private tenantLogoPathPrefixForTenant(tenantId: string): string {
    return `${this.getTenantLogoPrefix()}/${tenantId}/`;
  }

  private assertTenantLogoUrlAllowed(tenantId: string, logoUrl: string): void {
    if (isHttpUrl(logoUrl)) {
      return;
    }
    if (!logoUrl.startsWith(this.tenantLogoPathPrefixForTenant(tenantId))) {
      throw new BadRequestException("invalid_tenant_logo_path");
    }
  }

  private usePublicTenantLogoRead(): boolean {
    const raw = this.config.get<string>("SUPABASE_TENANT_LOGO_PUBLIC_READ");
    if (raw === undefined || raw.trim() === "") {
      return true;
    }
    const value = raw.trim().toLowerCase();
    return !(value === "false" || value === "0" || value === "no");
  }

  private async getTenantLogoSignedReadUrl(objectPath: string): Promise<string | null> {
    const bucket = this.getTenantLogoBucket();
    const rawTtl = this.config.get<string | number>(
      "SUPABASE_TENANT_LOGO_SIGNED_READ_TTL_SEC",
    );
    const ttl = Number(rawTtl ?? 3600);
    const ttlSeconds = Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, ttlSeconds);
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  }

  private async getResolvedTenantLogoUrl(
    tenantId: string,
    logoUrl: string | null,
  ): Promise<string | null> {
    const ref = logoUrl?.trim();
    if (!ref) {
      return null;
    }
    if (isHttpUrl(ref)) {
      return ref;
    }
    if (!ref.startsWith(this.tenantLogoPathPrefixForTenant(tenantId))) {
      return null;
    }
    if (this.usePublicTenantLogoRead()) {
      const baseUrl = this.config.getOrThrow<string>("SUPABASE_URL");
      return buildSupabaseStoragePublicUrl(baseUrl, this.getTenantLogoBucket(), ref);
    }
    return this.getTenantLogoSignedReadUrl(ref);
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

  async patchMember(
    supabaseUser: SupabaseUser,
    tenantId: string,
    membershipId: string,
    dto: {
      role?: "ADMIN" | "MANAGER" | "SHIPPER";
      status?: MembershipStatus;
    },
  ) {
    const hasRole = dto.role !== undefined;
    const hasStatus = dto.status !== undefined;
    if (!hasRole && !hasStatus) {
      throw new BadRequestException("no_updates");
    }
    if (hasRole && hasStatus) {
      throw new BadRequestException("conflicting_updates");
    }
    if (hasStatus) {
      if (dto.status !== MembershipStatus.ACTIVE) {
        throw new BadRequestException("invalid_status");
      }
      return this.reactivateMember(supabaseUser, tenantId, membershipId);
    }
    return this.updateMemberRole(supabaseUser, tenantId, membershipId, dto.role!);
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
    if (target.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException("cannot_change_role_of_deactivated_member");
    }
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
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        user: { id: updated.user.id, email: updated.user.email },
      },
    };
  }

  async reactivateMember(
    supabaseUser: SupabaseUser,
    tenantId: string,
    membershipId: string,
  ) {
    const actor = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    const actorMembership = await this.assertCanManageMembers(actor.id, tenantId);
    const target = await this.getTargetMembership(tenantId, membershipId);
    if (target.status !== MembershipStatus.DEACTIVATED) {
      throw new BadRequestException("membership_not_deactivated");
    }
    if (target.userId === actor.id) {
      throw new BadRequestException("cannot_reactivate_self");
    }
    if (target.role === OrganizationRole.OWNER) {
      throw new ForbiddenException("cannot_reactivate_owner");
    }
    if (
      actorMembership.role === OrganizationRole.ADMIN &&
      target.role === OrganizationRole.ADMIN
    ) {
      throw new ForbiddenException("admin_cannot_reactivate_admin");
    }

    const updated = await this.prisma.membership.update({
      where: { id: target.id },
      data: { status: MembershipStatus.ACTIVE },
      include: { user: true },
    });

    return {
      member: {
        id: updated.id,
        role: updated.role,
        status: updated.status,
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

    const updated = await this.prisma.membership.update({
      where: { id: target.id },
      data: { status: MembershipStatus.DEACTIVATED },
      include: { user: true },
    });

    return {
      member: {
        id: updated.id,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        user: { id: updated.user.id, email: updated.user.email },
      },
    };
  }
}
