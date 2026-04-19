import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RateLimit } from "../security/rate-limit.decorator";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { CatalogsService } from "./catalogs.service";
import { CreateCatalogDto } from "./dto/create-catalog.dto";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";

@Controller("tenants/:tenantId/catalogs")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get()
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  list(@AuthUser() supabaseUser: SupabaseUser, @CurrentTenant() tenantId: string) {
    return this.catalogsService.listCatalogs(supabaseUser, tenantId);
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  create(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateCatalogDto,
  ) {
    return this.catalogsService.createCatalog(supabaseUser, tenantId, body);
  }

  @Patch(":catalogId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  update(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("catalogId") catalogId: string,
    @Body() body: UpdateCatalogDto,
  ) {
    return this.catalogsService.updateCatalog(supabaseUser, tenantId, catalogId, body);
  }

  @Delete(":catalogId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archive(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("catalogId") catalogId: string,
  ) {
    return this.catalogsService.archiveCatalog(supabaseUser, tenantId, catalogId);
  }
}
