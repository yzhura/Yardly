import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { OrganizationRole, MembershipStatus } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { CreateColorDto } from "./dto/create-color.dto";
import { UpdateColorDto } from "./dto/update-color.dto";

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildColorSlug(name: string, hex: string): string {
  const base = slugify(name);
  const normalizedHex = hex.toUpperCase().replace(/^#/, "");
  return `${base}-${normalizedHex}`;
}

@Injectable()
export class ColorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    // reserved for future signed reads etc; keep for parity with other modules
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  private async assertTenantMemberActive(appUserId: string, tenantId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: appUserId, tenantId } },
    });

    if (!membership) throw new ForbiddenException("not_a_member_of_tenant");
    if (membership.status !== MembershipStatus.ACTIVE) throw new ForbiddenException("membership_deactivated");
    return membership;
  }

  private async assertCanManageColors(appUserId: string, tenantId: string) {
    const membership = await this.assertTenantMemberActive(appUserId, tenantId);
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenException("insufficient_role_to_manage_colors");
    }
  }

  async listColors(supabaseUser: SupabaseUser, tenantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertTenantMemberActive(user.id, tenantId);

    const colors = await this.prisma.color.findMany({
      where: { tenantId, isArchived: false },
      orderBy: { createdAt: "asc" },
    });

    return {
      colors: colors.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        hex: c.hex,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  async createColor(supabaseUser: SupabaseUser, tenantId: string, dto: CreateColorDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageColors(user.id, tenantId);

    const slug = buildColorSlug(dto.name, dto.hex);

    try {
      const created = await this.prisma.color.create({
        data: {
          tenantId,
          name: dto.name,
          slug,
          hex: dto.hex,
        },
      });

      return {
        color: {
          id: created.id,
          name: created.name,
          slug: created.slug,
          hex: created.hex,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("color_already_exists");
      }
      throw new InternalServerErrorException("color_create_failed");
    }
  }

  async updateColor(supabaseUser: SupabaseUser, tenantId: string, colorId: string, dto: UpdateColorDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageColors(user.id, tenantId);

    const existing = await this.prisma.color.findFirst({
      where: { id: colorId, tenantId, isArchived: false },
    });
    if (!existing) throw new NotFoundException("color_not_found");

    const nextName = dto.name ?? existing.name;
    const nextHex = dto.hex ?? existing.hex;
    const nextSlug = buildColorSlug(nextName, nextHex);

    const data: Prisma.ColorUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.hex !== undefined) data.hex = dto.hex;
    data.slug = nextSlug;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("no_updates");
    }

    try {
      const updated = await this.prisma.color.update({
        where: { id: colorId },
        data,
      });

      return {
        color: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          hex: updated.hex,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("color_already_exists");
      }
      throw new InternalServerErrorException("color_update_failed");
    }
  }

  async archiveColor(supabaseUser: SupabaseUser, tenantId: string, colorId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageColors(user.id, tenantId);

    const existing = await this.prisma.color.findFirst({
      where: { id: colorId, tenantId, isArchived: false },
    });
    if (!existing) throw new NotFoundException("color_not_found");

    await this.prisma.color.update({
      where: { id: colorId },
      data: { isArchived: true },
    });

    return { color: { id: colorId, isArchived: true } };
  }
}

