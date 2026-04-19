import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AttributeScope,
  Prisma,
  ProductStatus,
  type AttributeDefinition,
  type AttributeValue,
  type ProductVariant,
} from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { assertActiveTenantMembership, assertOwnerOrAdminTenantMembership } from "../tenancy/membership-policy";
import { UsersService } from "../users/users.service";
import { CreateProductDto } from "./dto/create-product.dto";
import type { CreateProductVariantLineDto } from "./dto/create-product-variant-line.dto";
import { ListProductsQueryDto } from "./dto/list-products-query.dto";
import type { VariantDraftImageSignedUploadDto } from "./dto/variant-draft-image-signed-upload.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";
import { moneyDecimalToString, toMoneyDecimal, toOptionalMoneyDecimal } from "./product-money.util";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";

type Db = PrismaService | Prisma.TransactionClient;

type VariantWithBindings = ProductVariant & {
  attributeBindings: {
    attributeValue: AttributeValue & { attributeDefinition: AttributeDefinition };
  }[];
};

const INSUFFICIENT_ROLE = "insufficient_role_to_manage_products";

const PRODUCT_IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const MAX_VARIANT_GALLERY_IMAGES = 10;

const productVariantDetailInclude = {
  attributeBindings: {
    include: {
      attributeValue: { include: { attributeDefinition: true } },
    },
  },
} as const;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  private signedProductImageUrlCache = new Map<string, { url: string; expiresAt: number }>();

  private getProductsImageBucket(): string {
    return this.config.get<string>("SUPABASE_PRODUCTS_IMAGE_BUCKET") ?? "products";
  }

  private getProductsImagePrefix(): string {
    const raw = this.config.get<string>("SUPABASE_PRODUCTS_IMAGE_PREFIX") ?? "products";
    return raw.replace(/^\/+|\/+$/g, "");
  }

  private getProductsImageSignedReadTtlSeconds(): number {
    const ttlRaw = this.config.get<string | number>("SUPABASE_PRODUCTS_IMAGE_SIGNED_READ_TTL_SEC");
    const ttl = Number(ttlRaw ?? 3600);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
  }

  private tenantImagePathPrefix(tenantId: string): string {
    const prefix = this.getProductsImagePrefix();
    return `${prefix}/${tenantId}/`;
  }

  /** Reject path traversal / odd segments in Storage keys (sessionId, ids in subpaths). */
  private assertSafeStoragePathSegment(segment: string, errorCode: string) {
    const s = segment.trim();
    if (!s || s.length > 80) {
      throw new BadRequestException(errorCode);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(s)) {
      throw new BadRequestException(errorCode);
    }
  }

  private assertProductImagePathsForTenant(tenantId: string, paths: string[]) {
    if (paths.length > MAX_VARIANT_GALLERY_IMAGES) {
      throw new BadRequestException("too_many_product_images");
    }
    if (new Set(paths).size !== paths.length) {
      throw new BadRequestException("duplicate_product_image_paths");
    }
    const expected = this.tenantImagePathPrefix(tenantId);
    for (const p of paths) {
      if (typeof p !== "string" || p.length === 0 || p.length > 512) {
        throw new BadRequestException("invalid_product_image_paths");
      }
      if (p.includes("..") || p.includes("//") || !p.startsWith(expected)) {
        throw new BadRequestException("invalid_product_image_paths");
      }
    }
  }

  private assertVariantGalleryShape(paths: string[]) {
    if (paths.length > MAX_VARIANT_GALLERY_IMAGES) {
      throw new BadRequestException("too_many_variant_images");
    }
    if (new Set(paths).size !== paths.length) {
      throw new BadRequestException("duplicate_variant_image_paths");
    }
    for (const p of paths) {
      if (typeof p !== "string" || p.length === 0 || p.length > 512) {
        throw new BadRequestException("invalid_variant_image_paths");
      }
      if (p.includes("..") || p.includes("//")) {
        throw new BadRequestException("invalid_variant_image_paths");
      }
    }
  }

  private assertVariantPathsNewProductDraft(tenantId: string, sessionId: string, paths: string[]) {
    this.assertVariantGalleryShape(paths);
    const expected = `${this.tenantImagePathPrefix(tenantId)}vd/n/${sessionId}/`;
    for (const p of paths) {
      if (!p.startsWith(expected)) {
        throw new BadRequestException("invalid_variant_image_paths");
      }
    }
  }

  private assertVariantPathsProductDraft(tenantId: string, productId: string, paths: string[]) {
    this.assertVariantGalleryShape(paths);
    const expected = `${this.tenantImagePathPrefix(tenantId)}vd/p/${productId}/`;
    for (const p of paths) {
      if (!p.startsWith(expected)) {
        throw new BadRequestException("invalid_variant_image_paths");
      }
    }
  }

  private assertVariantPathsForSavedVariant(tenantId: string, productId: string, variantId: string, paths: string[]) {
    this.assertVariantGalleryShape(paths);
    const base = this.tenantImagePathPrefix(tenantId);
    const prefixP = `${base}vd/p/${productId}/`;
    const prefixV = `${base}v/${variantId}/`;
    for (const p of paths) {
      if (!p.startsWith(prefixP) && !p.startsWith(prefixV)) {
        throw new BadRequestException("invalid_variant_image_paths");
      }
    }
  }

  private async resolveProductImageUrl(imagePath: string | null): Promise<string | null> {
    if (!imagePath) return null;

    const ttlSeconds = this.getProductsImageSignedReadTtlSeconds();
    const now = Date.now();

    const cached = this.signedProductImageUrlCache.get(imagePath);
    if (cached && cached.expiresAt > now + 5_000) {
      return cached.url;
    }

    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage
      .from(this.getProductsImageBucket())
      .createSignedUrl(imagePath, ttlSeconds);

    if (error || !data?.signedUrl) return null;

    if (this.signedProductImageUrlCache.size > 500) {
      this.signedProductImageUrlCache.clear();
    }

    this.signedProductImageUrlCache.set(imagePath, {
      url: data.signedUrl,
      expiresAt: now + ttlSeconds * 1000,
    });

    return data.signedUrl;
  }

  private async resolveProductImageUrls(paths: string[]): Promise<(string | null)[]> {
    return Promise.all(paths.map((p) => this.resolveProductImageUrl(p)));
  }

  async createVariantDraftImageSignedUpload(
    supabaseUser: SupabaseUser,
    tenantId: string,
    dto: VariantDraftImageSignedUploadDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const ext = PRODUCT_IMAGE_MIME_TO_EXT[dto.mimeType];
    if (!ext) throw new BadRequestException("unsupported_mime");

    if (dto.draftKind === "new") {
      this.assertSafeStoragePathSegment(dto.sessionId ?? "", "invalid_draft_session_id");
    }

    if (dto.draftKind === "product") {
      const pid = dto.productId!.trim();
      this.assertSafeStoragePathSegment(pid, "invalid_draft_product_id");
      const product = await this.prisma.product.findFirst({
        where: { id: pid, tenantId, isArchived: false },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException("product_not_found");
      }
    }

    const bucket = this.getProductsImageBucket();
    const prefix = this.getProductsImagePrefix();
    const sub =
      dto.draftKind === "new"
        ? `vd/n/${dto.sessionId!.trim()}/${randomUUID()}.${ext}`
        : `vd/p/${dto.productId!.trim()}/${randomUUID()}.${ext}`;
    const path = `${prefix}/${tenantId}/${sub}`;

    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      throw new InternalServerErrorException("product_image_upload_unavailable");
    }

    return {
      bucket,
      path,
      token: data.token,
      storagePath: path,
    };
  }

  async createVariantImageSignedUpload(
    supabaseUser: SupabaseUser,
    tenantId: string,
    productId: string,
    variantId: string,
    mimeType: string,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    this.assertSafeStoragePathSegment(variantId, "invalid_variant_id");
    this.assertSafeStoragePathSegment(productId, "invalid_product_id");

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, tenantId, isArchived: false },
      select: { id: true },
    });
    if (!variant) {
      throw new NotFoundException("product_variant_not_found");
    }

    const ext = PRODUCT_IMAGE_MIME_TO_EXT[mimeType];
    if (!ext) throw new BadRequestException("unsupported_mime");

    const bucket = this.getProductsImageBucket();
    const prefix = this.getProductsImagePrefix();
    const path = `${prefix}/${tenantId}/v/${variantId}/${randomUUID()}.${ext}`;

    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      throw new InternalServerErrorException("product_image_upload_unavailable");
    }

    return {
      bucket,
      path,
      token: data.token,
      storagePath: path,
    };
  }

  private async loadProductScopedAttributeValues(db: Db, tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];

    const rows = await db.attributeValue.findMany({
      where: { id: { in: ids }, tenantId, isArchived: false },
      include: { attributeDefinition: true },
    });

    if (rows.length !== ids.length) {
      throw new BadRequestException("attribute_value_not_found");
    }

    for (const row of rows) {
      const def = row.attributeDefinition;
      if (def.isArchived) {
        throw new BadRequestException("attribute_value_not_found");
      }
      if (def.scope === AttributeScope.MATERIAL) {
        throw new BadRequestException("attribute_value_invalid_scope");
      }
    }

    const definitionIds = rows.map((r) => r.attributeDefinitionId);
    if (new Set(definitionIds).size !== definitionIds.length) {
      throw new BadRequestException("duplicate_attribute_definition_on_variant");
    }

    return rows;
  }

  private assertUniqueAttributeValueIds(ids: string[]) {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("duplicate_attribute_value_ids");
    }
  }

  private async assertCatalogIdsForProduct(db: Db, tenantId: string, catalogIds: string[]) {
    if (!catalogIds?.length) {
      throw new BadRequestException("product_requires_at_least_one_catalog");
    }
    const unique = [...new Set(catalogIds)];
    if (unique.length !== catalogIds.length) {
      throw new BadRequestException("duplicate_catalog_ids");
    }

    const rows = await db.catalog.findMany({
      where: { id: { in: unique }, tenantId, isArchived: false },
      select: { id: true },
    });

    if (rows.length !== unique.length) {
      throw new BadRequestException("catalog_not_found");
    }
  }

  private async createVariantForProduct(
    db: Db,
    tenantId: string,
    productId: string,
    line: CreateProductVariantLineDto,
    sortIndex: number,
    pathScope: { type: "newProduct"; sessionId: string } | { type: "productDraft"; productId: string },
  ) {
    const attributeIds = line.attributeValueIds ?? [];
    this.assertUniqueAttributeValueIds(attributeIds);
    await this.loadProductScopedAttributeValues(db, tenantId, attributeIds);

    const imagePaths = line.imagePaths?.length ? [...line.imagePaths] : [];
    if (imagePaths.length) {
      if (pathScope.type === "newProduct") {
        this.assertVariantPathsNewProductDraft(tenantId, pathScope.sessionId, imagePaths);
      } else {
        this.assertVariantPathsProductDraft(tenantId, pathScope.productId, imagePaths);
      }
    }

    const variant = await db.productVariant.create({
      data: {
        tenantId,
        productId,
        sku: line.sku,
        name: line.name ?? null,
        price: toMoneyDecimal(line.price),
        compareAtPrice: toOptionalMoneyDecimal(line.compareAtPrice ?? null),
        cost: toOptionalMoneyDecimal(line.cost ?? null),
        sortIndex,
        imagePaths,
      },
    });

    if (attributeIds.length > 0) {
      await db.productVariantAttributeValue.createMany({
        data: attributeIds.map((attributeValueId) => ({
          variantId: variant.id,
          attributeValueId,
        })),
      });
    }

    return variant;
  }

  private async mapVariantToResponseAsync(variant: VariantWithBindings & { imagePaths?: string[] }) {
    const imagePaths = variant.imagePaths ?? [];
    const imageUrls = await this.resolveProductImageUrls(imagePaths);
    return {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: moneyDecimalToString(variant.price),
      compareAtPrice:
        variant.compareAtPrice !== null ? moneyDecimalToString(variant.compareAtPrice) : null,
      cost: variant.cost !== null ? moneyDecimalToString(variant.cost) : null,
      sortIndex: variant.sortIndex,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
      imagePaths,
      imageUrls,
      attributeValues: variant.attributeBindings.map((b) => ({
        id: b.attributeValue.id,
        name: b.attributeValue.name,
        slug: b.attributeValue.slug,
        definition: {
          id: b.attributeValue.attributeDefinition.id,
          name: b.attributeValue.attributeDefinition.name,
          slug: b.attributeValue.attributeDefinition.slug,
        },
      })),
    };
  }

  async listProducts(supabaseUser: SupabaseUser, tenantId: string, query: ListProductsQueryDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertActiveTenantMembership(this.prisma, user.id, tenantId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder ?? "desc";

    const where: Prisma.ProductWhereInput = {
      tenantId,
      isArchived: false,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.q) {
      const q = query.q;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        {
          variants: {
            some: {
              tenantId,
              isArchived: false,
              sku: { contains: q, mode: "insensitive" },
            },
          },
        },
      ];
    }

    if (query.catalogId) {
      where.catalogProducts = {
        some: {
          catalogId: query.catalogId,
          catalog: { tenantId, isArchived: false },
        },
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === "name"
        ? { name: sortOrder }
        : sortBy === "status"
          ? { status: sortOrder }
          : { createdAt: sortOrder };

    const skip = (page - 1) * pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          catalogProducts: {
            where: { catalog: { isArchived: false } },
            include: {
              catalog: { select: { id: true, name: true, slug: true } },
            },
          },
          variants: {
            where: { isArchived: false },
            orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
            include: {
              attributeBindings: {
                include: {
                  attributeValue: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const products = await Promise.all(
      rows.map(async (p) => {
        let primaryImageUrl: string | null = null;
        let imageUrls: string[] = [];
        for (const v of p.variants) {
          const vpaths = v.imagePaths ?? [];
          if (vpaths.length === 0) continue;
          const urls = (await this.resolveProductImageUrls(vpaths.slice(0, 3))).filter(
            (u): u is string => typeof u === "string" && u.length > 0,
          );
          if (urls.length) {
            imageUrls = urls;
            primaryImageUrl = urls[0] ?? null;
            break;
          }
        }
        if (!primaryImageUrl) {
          const legacyPaths = p.imagePaths ?? [];
          const slice = legacyPaths.slice(0, 3);
          imageUrls = (await this.resolveProductImageUrls(slice)).filter(
            (u): u is string => typeof u === "string" && u.length > 0,
          );
          primaryImageUrl = imageUrls[0] ?? null;
        }

        return {
          id: p.id,
          name: p.name,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          primaryImageUrl,
          imageUrls,
          catalogs: p.catalogProducts.map((cp) => ({
            id: cp.catalog.id,
            name: cp.catalog.name,
            slug: cp.catalog.slug,
          })),
          variants: p.variants.map((v) => {
            const tagNames = v.attributeBindings.map((b) => b.attributeValue.name);
            const uniqueTags = [...new Set(tagNames)].slice(0, 6);
            return {
              id: v.id,
              sku: v.sku,
              price: moneyDecimalToString(v.price),
              sortIndex: v.sortIndex,
              attributeTags: uniqueTags,
            };
          }),
        };
      }),
    );

    return {
      products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getProduct(supabaseUser: SupabaseUser, tenantId: string, productId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertActiveTenantMembership(this.prisma, user.id, tenantId);

    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, isArchived: false },
      include: {
        catalogProducts: {
          where: { catalog: { isArchived: false } },
          include: {
            catalog: { select: { id: true, name: true, slug: true } },
          },
        },
        variants: {
          where: { isArchived: false },
          orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
          include: productVariantDetailInclude,
        },
      },
    });

    if (!product) {
      throw new NotFoundException("product_not_found");
    }

    const imagePaths = product.imagePaths ?? [];
    const imageUrls = await this.resolveProductImageUrls(imagePaths);

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        status: product.status,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        imagePaths,
        imageUrls,
        catalogs: product.catalogProducts.map((cp) => ({
          id: cp.catalog.id,
          name: cp.catalog.name,
          slug: cp.catalog.slug,
        })),
        variants: await Promise.all(
          product.variants.map((v) => this.mapVariantToResponseAsync(v as VariantWithBindings)),
        ),
      },
    };
  }

  async createProduct(supabaseUser: SupabaseUser, tenantId: string, dto: CreateProductDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    try {
      const productId = await this.prisma.$transaction(async (tx) => {
        await this.assertCatalogIdsForProduct(tx, tenantId, dto.catalogIds);

        const anyVariantImages = dto.variants.some((v) => v.imagePaths?.length);
        if (anyVariantImages) {
          const sid = dto.draftUploadSessionId?.trim();
          if (!sid) {
            throw new BadRequestException("variant_images_require_draft_session");
          }
        }

        const product = await tx.product.create({
          data: {
            tenantId,
            name: dto.name,
            description: dto.description ?? null,
            status: dto.status ?? ProductStatus.DRAFT,
            imagePaths: [],
          },
        });

        await tx.catalogProduct.createMany({
          data: dto.catalogIds.map((catalogId, idx) => ({
            catalogId,
            productId: product.id,
            sortIndex: idx,
          })),
        });

        const sessionId = dto.draftUploadSessionId?.trim() ?? "";
        for (let i = 0; i < dto.variants.length; i++) {
          await this.createVariantForProduct(tx, tenantId, product.id, dto.variants[i], i, {
            type: "newProduct",
            sessionId,
          });
        }

        return product.id;
      });

      return this.getProduct(supabaseUser, tenantId, productId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("product_variant_sku_already_exists");
      }
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException("product_create_failed");
    }
  }

  async updateProduct(supabaseUser: SupabaseUser, tenantId: string, productId: string, dto: UpdateProductDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const existing = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("product_not_found");
    }

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.imagePaths !== undefined) {
      this.assertProductImagePathsForTenant(tenantId, dto.imagePaths);
      data.imagePaths = dto.imagePaths;
    }

    const hasProductFields = Object.keys(data).length > 0;
    const hasCatalogs = dto.catalogIds !== undefined;

    if (!hasProductFields && !hasCatalogs) {
      throw new BadRequestException("no_updates");
    }

    try {
      if (hasCatalogs) {
        await this.prisma.$transaction(async (tx) => {
          await this.assertCatalogIdsForProduct(tx, tenantId, dto.catalogIds!);
          await tx.catalogProduct.deleteMany({ where: { productId } });
          await tx.catalogProduct.createMany({
            data: dto.catalogIds!.map((catalogId, idx) => ({
              catalogId,
              productId,
              sortIndex: idx,
            })),
          });
        });
      }

      if (hasProductFields) {
        await this.prisma.product.update({
          where: { id: productId },
          data,
        });
      }
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException("product_update_failed");
    }

    return this.getProduct(supabaseUser, tenantId, productId);
  }

  async archiveProduct(supabaseUser: SupabaseUser, tenantId: string, productId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const existing = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, isArchived: false },
    });
    if (!existing) {
      throw new NotFoundException("product_not_found");
    }

    await this.prisma.$transaction([
      this.prisma.productVariant.updateMany({
        where: { productId, tenantId, isArchived: false },
        data: { isArchived: true },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: { isArchived: true },
      }),
    ]);

    return { product: { id: productId, isArchived: true } };
  }

  async createVariant(
    supabaseUser: SupabaseUser,
    tenantId: string,
    productId: string,
    line: CreateProductVariantLineDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, isArchived: false },
    });
    if (!product) {
      throw new NotFoundException("product_not_found");
    }

    const agg = await this.prisma.productVariant.aggregate({
      where: { productId, tenantId, isArchived: false },
      _max: { sortIndex: true },
    });
    const nextSort = (agg._max.sortIndex ?? -1) + 1;

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.createVariantForProduct(tx, tenantId, productId, line, nextSort, {
          type: "productDraft",
          productId,
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("product_variant_sku_already_exists");
      }
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException("product_variant_create_failed");
    }

    return this.getProduct(supabaseUser, tenantId, productId);
  }

  async updateVariant(
    supabaseUser: SupabaseUser,
    tenantId: string,
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, tenantId, isArchived: false },
    });
    if (!variant) {
      throw new NotFoundException("product_variant_not_found");
    }

    const data: Prisma.ProductVariantUpdateInput = {};
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.price !== undefined) data.price = toMoneyDecimal(dto.price);
    if (dto.compareAtPrice !== undefined) {
      data.compareAtPrice = toOptionalMoneyDecimal(dto.compareAtPrice);
    }
    if (dto.cost !== undefined) {
      data.cost = toOptionalMoneyDecimal(dto.cost);
    }
    if (dto.sortIndex !== undefined) data.sortIndex = dto.sortIndex;
    if (dto.imagePaths !== undefined) {
      this.assertVariantPathsForSavedVariant(tenantId, productId, variantId, dto.imagePaths);
      data.imagePaths = dto.imagePaths;
    }

    const hasScalarUpdates = Object.keys(data).length > 0;
    const hasAttributeReplace = dto.attributeValueIds !== undefined;

    if (!hasScalarUpdates && !hasAttributeReplace) {
      throw new BadRequestException("no_updates");
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (hasAttributeReplace) {
          this.assertUniqueAttributeValueIds(dto.attributeValueIds!);
          await this.loadProductScopedAttributeValues(tx, tenantId, dto.attributeValueIds!);
          await tx.productVariantAttributeValue.deleteMany({ where: { variantId } });
          if (dto.attributeValueIds!.length > 0) {
            await tx.productVariantAttributeValue.createMany({
              data: dto.attributeValueIds!.map((attributeValueId) => ({
                variantId,
                attributeValueId,
              })),
            });
          }
        }

        if (hasScalarUpdates) {
          await tx.productVariant.update({
            where: { id: variantId },
            data,
          });
        }
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("product_variant_sku_already_exists");
      }
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException("product_variant_update_failed");
    }

    return this.getProduct(supabaseUser, tenantId, productId);
  }

  async archiveVariant(supabaseUser: SupabaseUser, tenantId: string, productId: string, variantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await assertOwnerOrAdminTenantMembership(this.prisma, user.id, tenantId, INSUFFICIENT_ROLE);

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, tenantId, isArchived: false },
    });
    if (!variant) {
      throw new NotFoundException("product_variant_not_found");
    }

    const otherActive = await this.prisma.productVariant.count({
      where: {
        productId,
        tenantId,
        isArchived: false,
        id: { not: variantId },
      },
    });

    if (otherActive === 0) {
      throw new BadRequestException("cannot_archive_last_product_variant");
    }

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isArchived: true },
    });

    return this.getProduct(supabaseUser, tenantId, productId);
  }
}
