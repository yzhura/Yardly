import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttributeScope, MembershipStatus, OrganizationRole, Prisma } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { CreateAttributeDefinitionDto } from "./dto/create-attribute-definition.dto";
import { ListAttributesQueryDto } from "./dto/list-attributes-query.dto";
import { UpdateAttributeDefinitionDto } from "./dto/update-attribute-definition.dto";
import { CreateAttributeValueDto } from "./dto/create-attribute-value.dto";
import { UpdateAttributeValueDto } from "./dto/update-attribute-value.dto";

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

@Injectable()
export class AttributesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private async assertTenantMemberActive(appUserId: string, tenantId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: appUserId, tenantId } },
    });
    if (!membership) throw new ForbiddenException("not_a_member_of_tenant");
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException("membership_deactivated");
    }
    return membership;
  }

  private async assertCanManageAttributes(appUserId: string, tenantId: string) {
    const membership = await this.assertTenantMemberActive(appUserId, tenantId);
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenException("insufficient_role_to_manage_attributes");
    }
  }

  async listDefinitions(supabaseUser: SupabaseUser, tenantId: string, query: ListAttributesQueryDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertTenantMemberActive(user.id, tenantId);

    const where: Prisma.AttributeDefinitionWhereInput = { tenantId, isArchived: false };
    if (query.scope) {
      where.OR = [{ scope: query.scope }, { scope: AttributeScope.BOTH }];
    }

    const rows = await this.prisma.attributeDefinition.findMany({
      where,
      include: {
        values: {
          where: { isArchived: false },
          orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });

    return {
      definitions: rows.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        scope: d.scope,
        isSystem: d.isSystem,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        values: d.values.map((v) => ({
          id: v.id,
          name: v.name,
          slug: v.slug,
          sortIndex: v.sortIndex,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        })),
      })),
    };
  }

  async createDefinition(supabaseUser: SupabaseUser, tenantId: string, dto: CreateAttributeDefinitionDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageAttributes(user.id, tenantId);

    const slug = slugify(dto.name);
    if (!slug) throw new BadRequestException("invalid_attribute_name");

    try {
      const created = await this.prisma.attributeDefinition.create({
        data: {
          tenantId,
          name: dto.name,
          slug,
          scope: dto.scope ?? AttributeScope.BOTH,
        },
      });
      return {
        definition: {
          id: created.id,
          name: created.name,
          slug: created.slug,
          scope: created.scope,
          isSystem: created.isSystem,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
          values: [],
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("attribute_definition_already_exists");
      }
      throw err;
    }
  }

  async updateDefinition(
    supabaseUser: SupabaseUser,
    tenantId: string,
    definitionId: string,
    dto: UpdateAttributeDefinitionDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageAttributes(user.id, tenantId);

    const existing = await this.prisma.attributeDefinition.findFirst({
      where: { id: definitionId, tenantId, isArchived: false },
    });
    if (!existing) throw new NotFoundException("attribute_definition_not_found");

    const data: Prisma.AttributeDefinitionUpdateInput = {};
    if (dto.name !== undefined) {
      const nextSlug = slugify(dto.name);
      if (!nextSlug) throw new BadRequestException("invalid_attribute_name");
      data.name = dto.name;
      data.slug = nextSlug;
    }
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (!Object.keys(data).length) throw new BadRequestException("no_updates");

    try {
      const updated = await this.prisma.attributeDefinition.update({
        where: { id: definitionId },
        data,
      });
      return {
        definition: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          scope: updated.scope,
          isSystem: updated.isSystem,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("attribute_definition_already_exists");
      }
      throw err;
    }
  }

  async archiveDefinition(supabaseUser: SupabaseUser, tenantId: string, definitionId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageAttributes(user.id, tenantId);

    const existing = await this.prisma.attributeDefinition.findFirst({
      where: { id: definitionId, tenantId, isArchived: false },
    });
    if (!existing) throw new NotFoundException("attribute_definition_not_found");

    await this.prisma.$transaction([
      this.prisma.attributeDefinition.update({
        where: { id: definitionId },
        data: { isArchived: true },
      }),
      this.prisma.attributeValue.updateMany({
        where: { attributeDefinitionId: definitionId, isArchived: false },
        data: { isArchived: true },
      }),
    ]);

    return { definition: { id: definitionId, isArchived: true } };
  }

  async createValue(
    supabaseUser: SupabaseUser,
    tenantId: string,
    definitionId: string,
    dto: CreateAttributeValueDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageAttributes(user.id, tenantId);

    const definition = await this.prisma.attributeDefinition.findFirst({
      where: { id: definitionId, tenantId, isArchived: false },
    });
    if (!definition) throw new NotFoundException("attribute_definition_not_found");

    const slug = slugify(dto.name);
    if (!slug) throw new BadRequestException("invalid_attribute_value_name");

    try {
      const created = await this.prisma.attributeValue.create({
        data: {
          tenantId,
          attributeDefinitionId: definition.id,
          name: dto.name,
          slug,
          sortIndex: dto.sortIndex ?? 0,
        },
      });
      return {
        value: {
          id: created.id,
          attributeDefinitionId: created.attributeDefinitionId,
          name: created.name,
          slug: created.slug,
          sortIndex: created.sortIndex,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("attribute_value_already_exists");
      }
      throw err;
    }
  }

  async updateValue(
    supabaseUser: SupabaseUser,
    tenantId: string,
    definitionId: string,
    valueId: string,
    dto: UpdateAttributeValueDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageAttributes(user.id, tenantId);

    const value = await this.prisma.attributeValue.findFirst({
      where: {
        id: valueId,
        tenantId,
        attributeDefinitionId: definitionId,
        isArchived: false,
      },
    });
    if (!value) throw new NotFoundException("attribute_value_not_found");

    const data: Prisma.AttributeValueUpdateInput = {};
    if (dto.name !== undefined) {
      const nextSlug = slugify(dto.name);
      if (!nextSlug) throw new BadRequestException("invalid_attribute_value_name");
      data.name = dto.name;
      data.slug = nextSlug;
    }
    if (dto.sortIndex !== undefined) data.sortIndex = dto.sortIndex;
    if (!Object.keys(data).length) throw new BadRequestException("no_updates");

    try {
      const updated = await this.prisma.attributeValue.update({
        where: { id: valueId },
        data,
      });
      return {
        value: {
          id: updated.id,
          attributeDefinitionId: updated.attributeDefinitionId,
          name: updated.name,
          slug: updated.slug,
          sortIndex: updated.sortIndex,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("attribute_value_already_exists");
      }
      throw err;
    }
  }

  async archiveValue(
    supabaseUser: SupabaseUser,
    tenantId: string,
    definitionId: string,
    valueId: string,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageAttributes(user.id, tenantId);

    const existing = await this.prisma.attributeValue.findFirst({
      where: {
        id: valueId,
        tenantId,
        attributeDefinitionId: definitionId,
        isArchived: false,
      },
    });
    if (!existing) throw new NotFoundException("attribute_value_not_found");

    await this.prisma.attributeValue.update({
      where: { id: valueId },
      data: { isArchived: true },
    });

    return { value: { id: valueId, isArchived: true } };
  }
}

