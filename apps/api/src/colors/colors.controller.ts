import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RateLimit } from "../security/rate-limit.decorator";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { ColorsService } from "./colors.service";
import { CreateColorDto } from "./dto/create-color.dto";
import { UpdateColorDto } from "./dto/update-color.dto";
import type { User as SupabaseUser } from "@supabase/supabase-js";

@Controller("tenants/:tenantId/colors")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Get()
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  list(@AuthUser() supabaseUser: SupabaseUser, @CurrentTenant() tenantId: string) {
    return this.colorsService.listColors(supabaseUser, tenantId);
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  create(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateColorDto,
  ) {
    return this.colorsService.createColor(supabaseUser, tenantId, body);
  }

  @Patch(":colorId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  update(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("colorId") colorId: string,
    @Body() body: UpdateColorDto,
  ) {
    return this.colorsService.updateColor(supabaseUser, tenantId, colorId, body);
  }

  @Delete(":colorId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archive(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("colorId") colorId: string,
  ) {
    return this.colorsService.archiveColor(supabaseUser, tenantId, colorId);
  }
}

