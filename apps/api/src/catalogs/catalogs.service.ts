import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";
import { assertActiveTenantMembership, assertOwnerOrAdminTenantMembership } from "../tenancy/membership-policy";
import { UsersService } from "../users/users.service";
import { CreateCatalogDto } from "./dto/create-catalog.dto";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";
import { slugify } from "./slugify";

const INSUFFICIENT_ROLE = "insufficient_role_to_manage_products";

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async listCatalogs(supabaseUser: SupabaseUser, tenantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertActiveTenantMembership(this.prisma, user.id, tenantId);

    const rows = await this.prisma.catalog.findMany({
      where: { tenantId, isArchived: false },
      orderBy: [{ sortIndex: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            catalogProducts: {
              where: { product: { isArchived: false } },
            },
          },
        },
      },
    });

    return {
      catalogs: rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortIndex: c.sortIndex,
        productCount: c._count.catalogProducts,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  async createCatalog(supabaseUser: SupabaseUser, tenantId: string, dto: CreateCatalogDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    let baseSlug = slugify(dto.name);
    if (!baseSlug) {
      throw new BadRequestException("invalid_catalog_name");
    }

    const maxSort = await this.prisma.catalog.aggregate({
      where: { tenantId, isArchived: false },
      _max: { sortIndex: true },
    });
    const nextSort = (maxSort._max.sortIndex ?? -1) + 1;

    for (let attempt = 0; attempt < 12; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
      try {
        const created = await this.prisma.catalog.create({
          data: {
            tenantId,
            name: dto.name,
            slug,
            description: dto.description ?? null,
            sortIndex: nextSort,
          },
        });
        return {
          catalog: {
            id: created.id,
            name: created.name,
            slug: created.slug,
            description: created.description,
            sortIndex: created.sortIndex,
            productCount: 0,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          },
        };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          continue;
        }
        throw new InternalServerErrorException("catalog_create_failed");
      }
    }

    throw new BadRequestException("catalog_slug_already_exists");
  }

  async updateCatalog(supabaseUser: SupabaseUser, tenantId: string, catalogId: string, dto: UpdateCatalogDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const existing = await this.prisma.catalog.findFirst({
      where: { id: catalogId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("catalog_not_found");
    }

    const data: Prisma.CatalogUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("no_updates");
    }

    try {
      const updated = await this.prisma.catalog.update({
        where: { id: catalogId },
        data,
      });
      const count = await this.prisma.catalogProduct.count({
        where: { catalogId: updated.id, product: { isArchived: false } },
      });
      return {
        catalog: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          description: updated.description,
          sortIndex: updated.sortIndex,
          productCount: count,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } catch {
      throw new InternalServerErrorException("catalog_update_failed");
    }
  }

  async archiveCatalog(supabaseUser: SupabaseUser, tenantId: string, catalogId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const existing = await this.prisma.catalog.findFirst({
      where: { id: catalogId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("catalog_not_found");
    }

    const memberships = await this.prisma.catalogProduct.findMany({
      where: { catalogId },
      select: { productId: true },
    });

    for (const { productId } of memberships) {
      const total = await this.prisma.catalogProduct.count({ where: { productId } });
      if (total === 1) {
        throw new BadRequestException("cannot_archive_catalog_would_orphan_products");
      }
    }

    await this.prisma.$transaction([
      this.prisma.catalogProduct.deleteMany({ where: { catalogId } }),
      this.prisma.catalog.update({
        where: { id: catalogId },
        data: { isArchived: true },
      }),
    ]);

    return { catalog: { id: catalogId, isArchived: true } };
  }
}
