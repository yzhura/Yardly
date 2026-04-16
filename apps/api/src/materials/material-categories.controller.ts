import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { RateLimit } from "../security/rate-limit.decorator";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { MaterialsService } from "./materials.service";
import { CreateMaterialCategoryDto } from "./dto/create-material-category.dto";
import { UpdateMaterialCategoryDto } from "./dto/update-material-category.dto";
import type { User as SupabaseUser } from "@supabase/supabase-js";

@Controller("tenants/:tenantId/material-categories")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class MaterialCategoriesController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  list(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
  ) {
    return this.materialsService.listMaterialCategories(supabaseUser, tenantId);
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  create(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateMaterialCategoryDto,
  ) {
    return this.materialsService.createMaterialCategory(supabaseUser, tenantId, body);
  }

  @Patch(":categoryId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  update(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("categoryId") categoryId: string,
    @Body() body: UpdateMaterialCategoryDto,
  ) {
    return this.materialsService.updateMaterialCategory(
      supabaseUser,
      tenantId,
      categoryId,
      body,
    );
  }

  @Delete(":categoryId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archive(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("categoryId") categoryId: string,
  ) {
    return this.materialsService.archiveMaterialCategory(supabaseUser, tenantId, categoryId);
  }
}

