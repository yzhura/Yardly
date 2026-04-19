import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RateLimit } from "../security/rate-limit.decorator";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateProductVariantLineDto } from "./dto/create-product-variant-line.dto";
import { ListProductsQueryDto } from "./dto/list-products-query.dto";
import { VariantDraftImageSignedUploadDto } from "./dto/variant-draft-image-signed-upload.dto";
import { VariantImageSignedUploadDto } from "./dto/variant-image-signed-upload.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";
import { ProductsService } from "./products.service";

@Controller("tenants/:tenantId/products")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  list(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProducts(supabaseUser, tenantId, query);
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  create(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateProductDto,
  ) {
    return this.productsService.createProduct(supabaseUser, tenantId, body);
  }

  @Post("variant-images/draft/signed-upload")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  createVariantDraftImageSignedUpload(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: VariantDraftImageSignedUploadDto,
  ) {
    return this.productsService.createVariantDraftImageSignedUpload(supabaseUser, tenantId, body);
  }

  @Get(":productId")
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  getById(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
  ) {
    return this.productsService.getProduct(supabaseUser, tenantId, productId);
  }

  @Patch(":productId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  update(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(supabaseUser, tenantId, productId, body);
  }

  @Delete(":productId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archive(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
  ) {
    return this.productsService.archiveProduct(supabaseUser, tenantId, productId);
  }

  @Post(":productId/variants/:variantId/image/signed-upload")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  createVariantImageSignedUpload(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string,
    @Body() body: VariantImageSignedUploadDto,
  ) {
    return this.productsService.createVariantImageSignedUpload(
      supabaseUser,
      tenantId,
      productId,
      variantId,
      body.mimeType,
    );
  }

  @Post(":productId/variants")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  createVariant(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
    @Body() body: CreateProductVariantLineDto,
  ) {
    return this.productsService.createVariant(supabaseUser, tenantId, productId, body);
  }

  @Patch(":productId/variants/:variantId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  updateVariant(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string,
    @Body() body: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(supabaseUser, tenantId, productId, variantId, body);
  }

  @Delete(":productId/variants/:variantId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archiveVariant(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string,
  ) {
    return this.productsService.archiveVariant(supabaseUser, tenantId, productId, variantId);
  }
}
