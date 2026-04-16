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
import { RateLimit } from "../security/rate-limit.decorator";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { MaterialsService } from "./materials.service";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { ListMaterialsQueryDto } from "./dto/list-materials-query.dto";
import { MaterialImageSignedUploadDto } from "./dto/material-image-signed-upload.dto";
import { UpdateMaterialDto } from "./dto/update-material.dto";
import type { User as SupabaseUser } from "@supabase/supabase-js";

@Controller("tenants/:tenantId/materials")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  list(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Query() query: ListMaterialsQueryDto,
  ) {
    return this.materialsService.listMaterials(supabaseUser, tenantId, query);
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  create(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateMaterialDto,
  ) {
    return this.materialsService.createMaterial(supabaseUser, tenantId, body);
  }

  @Patch(":materialId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  update(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("materialId") materialId: string,
    @Body() body: UpdateMaterialDto,
  ) {
    return this.materialsService.updateMaterial(supabaseUser, tenantId, materialId, body);
  }

  @Delete(":materialId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archive(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("materialId") materialId: string,
  ) {
    return this.materialsService.archiveMaterial(supabaseUser, tenantId, materialId);
  }

  @Post("image/signed-upload")
  @RateLimit({ limit: 20, ttlMs: 60_000 })
  createImageSignedUpload(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: MaterialImageSignedUploadDto,
  ) {
    return this.materialsService.createMaterialImageSignedUpload(
      supabaseUser,
      tenantId,
      body.mimeType,
    );
  }
}

