import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { type Material, type MaterialCategory, type Color } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import {
  assertActiveTenantMembership,
  assertOwnerOrAdminTenantMembership,
} from "../tenancy/membership-policy";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { UsersService } from "../users/users.service";
import { ListMaterialsQueryDto } from "./dto/list-materials-query.dto";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { UpdateMaterialDto } from "./dto/update-material.dto";
import { CreateMaterialCategoryDto } from "./dto/create-material-category.dto";
import { UpdateMaterialCategoryDto } from "./dto/update-material-category.dto";

type MaterialStockStatus = "ENOUGH" | "ENDING" | "LOW";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function toNonNegativeFloat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value <= 0 ? 0 : value;
}

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  private getStockStatus(quantityTotal: number, quantityReserved: number, minStock: number): MaterialStockStatus {
    const available = toNonNegativeFloat(quantityTotal - quantityReserved);
    const min = toNonNegativeFloat(minStock);

    if (available <= 0) return "LOW";
    if (min > 0 && available <= min) return "ENDING";
    return "ENOUGH";
  }

  private getMaterialsImageBucket(): string {
    return this.config.get<string>("SUPABASE_MATERIALS_IMAGE_BUCKET") ?? "materials";
  }

  private getMaterialsImagePrefix(): string {
    const raw = this.config.get<string>("SUPABASE_MATERIALS_IMAGE_PREFIX") ?? "materials";
    return raw.replace(/^\/+|\/+$/g, "");
  }

  private getSignedReadTtlSeconds(): number {
    const ttlRaw = this.config.get<string | number>("SUPABASE_MATERIALS_IMAGE_SIGNED_READ_TTL_SEC");
    const ttl = Number(ttlRaw ?? 3600);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
  }

  private signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

  private async resolveMaterialImageUrl(imagePath: string | null): Promise<string | null> {
    if (!imagePath) return null;

    const ttlSeconds = this.getSignedReadTtlSeconds();
    const now = Date.now();

    const cached = this.signedUrlCache.get(imagePath);
    if (cached && cached.expiresAt > now + 5_000) {
      return cached.url;
    }

    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage
      .from(this.getMaterialsImageBucket())
      .createSignedUrl(imagePath, ttlSeconds);

    if (error || !data?.signedUrl) return null;

    // Best-effort cache to reduce repeated signing during list renders.
    if (this.signedUrlCache.size > 500) {
      this.signedUrlCache.clear();
    }

    this.signedUrlCache.set(imagePath, {
      url: data.signedUrl,
      expiresAt: now + ttlSeconds * 1000,
    });

    return data.signedUrl;
  }

  private async toMaterialResponse(
    material: Material & { category: MaterialCategory; color: Color | null },
  ) {
    const available = toNonNegativeFloat(material.quantityTotal - material.quantityReserved);
    const stockStatus = this.getStockStatus(material.quantityTotal, material.quantityReserved, material.minStock);
    const imageUrl = await this.resolveMaterialImageUrl(material.imagePath);

    return {
      id: material.id,
      name: material.name,
      sku: material.sku,
      category: {
        id: material.category.id,
        name: material.category.name,
      },
      color: material.color
        ? {
            id: material.color.id,
            name: material.color.name,
            slug: material.color.slug,
            hex: material.color.hex,
          }
        : null,
      unit: material.unit,
      imageUrl,
      quantityTotal: material.quantityTotal,
      quantityReserved: material.quantityReserved,
      quantityAvailable: available,
      minStock: material.minStock,
      stockStatus,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    };
  }

  async listMaterials(supabaseUser: SupabaseUser, tenantId: string, query: ListMaterialsQueryDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertActiveTenantMembership(this.prisma, user.id, tenantId);

    const where: Prisma.MaterialWhereInput = {
      tenantId,
      isArchived: false,
      category: { isArchived: false },
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { sku: { contains: query.q, mode: "insensitive" } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.colorId) {
      where.colorId = query.colorId;
    }

    const materials = await this.prisma.material.findMany({
      where,
      include: { category: true, color: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      materials: await Promise.all(materials.map((m) => this.toMaterialResponse(m))),
    };
  }

  async createMaterial(supabaseUser: SupabaseUser, tenantId: string, dto: CreateMaterialDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    const category = await this.prisma.materialCategory.findFirst({
      where: { id: dto.categoryId, tenantId, isArchived: false },
    });
    if (!category) {
      throw new BadRequestException("category_not_found");
    }

    const color = await this.prisma.color.findFirst({
      where: { id: dto.colorId, tenantId, isArchived: false },
    });
    if (!color) {
      throw new BadRequestException("color_not_found");
    }

    try {
      const created = await this.prisma.material.create({
        data: {
          tenantId,
          categoryId: dto.categoryId,
          name: dto.name,
          sku: dto.sku,
          colorId: dto.colorId,
          unit: dto.unit,
          imagePath: dto.imagePath ?? null,
          quantityTotal: dto.quantityTotal ?? 0,
          quantityReserved: dto.quantityReserved ?? 0,
          minStock: dto.minStock ?? 0,
        },
        include: { category: true, color: true },
      });

      return { material: await this.toMaterialResponse(created) };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new BadRequestException("material_sku_already_exists");
      }
      throw new InternalServerErrorException("material_create_failed");
    }
  }

  async updateMaterial(
    supabaseUser: SupabaseUser,
    tenantId: string,
    materialId: string,
    dto: UpdateMaterialDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    const existing = await this.prisma.material.findFirst({
      where: { id: materialId, tenantId, isArchived: false },
      include: { category: true },
    });
    if (!existing) {
      throw new NotFoundException("material_not_found");
    }

    if (dto.categoryId) {
      const category = await this.prisma.materialCategory.findFirst({
        where: { id: dto.categoryId, tenantId, isArchived: false },
      });
      if (!category) throw new BadRequestException("category_not_found");
    }

    const data: Prisma.MaterialUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.colorId !== undefined) {
      const color = await this.prisma.color.findFirst({
        where: { id: dto.colorId, tenantId, isArchived: false },
      });
      if (!color) throw new BadRequestException("color_not_found");
      data.color = { connect: { id: dto.colorId } };
    }
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.imagePath !== undefined) data.imagePath = dto.imagePath;
    if (dto.quantityTotal !== undefined) data.quantityTotal = dto.quantityTotal;
    if (dto.quantityReserved !== undefined) data.quantityReserved = dto.quantityReserved;
    if (dto.minStock !== undefined) data.minStock = dto.minStock;

    try {
      const updated = await this.prisma.material.update({
        where: { id: materialId },
        data,
        include: { category: true, color: true },
      });
      return { material: await this.toMaterialResponse(updated) };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new BadRequestException("material_sku_already_exists");
      }
      throw new InternalServerErrorException("material_update_failed");
    }
  }

  async archiveMaterial(supabaseUser: SupabaseUser, tenantId: string, materialId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    const existing = await this.prisma.material.findFirst({
      where: { id: materialId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("material_not_found");
    }

    await this.prisma.material.update({
      where: { id: materialId },
      data: { isArchived: true },
    });

    return { material: { id: materialId, isArchived: true } };
  }

  async listMaterialCategories(supabaseUser: SupabaseUser, tenantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertActiveTenantMembership(this.prisma, user.id, tenantId);

    const categories = await this.prisma.materialCategory.findMany({
      where: { tenantId, isArchived: false },
      orderBy: { createdAt: "asc" },
    });

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  async createMaterialCategory(
    supabaseUser: SupabaseUser,
    tenantId: string,
    dto: CreateMaterialCategoryDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    try {
      const created = await this.prisma.materialCategory.create({
        data: {
          tenantId,
          name: dto.name,
        },
      });

      return {
        category: {
          id: created.id,
          name: created.name,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new BadRequestException("category_name_already_exists");
      }
      throw new InternalServerErrorException("material_category_create_failed");
    }
  }

  async updateMaterialCategory(
    supabaseUser: SupabaseUser,
    tenantId: string,
    categoryId: string,
    dto: UpdateMaterialCategoryDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    const existing = await this.prisma.materialCategory.findFirst({
      where: { id: categoryId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("material_category_not_found");
    }

    const data: Prisma.MaterialCategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("no_updates");
    }

    try {
      const updated = await this.prisma.materialCategory.update({
        where: { id: categoryId },
        data,
      });

      return {
        category: {
          id: updated.id,
          name: updated.name,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new BadRequestException("category_name_already_exists");
      }
      throw new InternalServerErrorException("material_category_update_failed");
    }
  }

  async archiveMaterialCategory(
    supabaseUser: SupabaseUser,
    tenantId: string,
    categoryId: string,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    const existing = await this.prisma.materialCategory.findFirst({
      where: { id: categoryId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("material_category_not_found");
    }

    await this.prisma.materialCategory.update({
      where: { id: categoryId },
      data: { isArchived: true },
    });

    return { category: { id: categoryId, isArchived: true } };
  }

  async createMaterialImageSignedUpload(
    supabaseUser: SupabaseUser,
    tenantId: string,
    mimeType: string,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(
      this.prisma,
      user.id,
      tenantId,
      "insufficient_role_to_manage_materials",
    );

    const bucket = this.getMaterialsImageBucket();
    const ext = MIME_TO_EXT[mimeType];
    if (!ext) throw new BadRequestException("unsupported_mime");

    const prefix = this.getMaterialsImagePrefix();
    const path = `${prefix}/${tenantId}/${randomUUID()}.${ext}`;

    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new InternalServerErrorException("material_upload_unavailable");
    }

    return {
      bucket,
      path,
      token: data.token,
      storagePath: path,
    };
  }
}

