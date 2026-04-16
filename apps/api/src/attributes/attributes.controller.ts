import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RateLimit } from "../security/rate-limit.decorator";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { AttributesService } from "./attributes.service";
import { ListAttributesQueryDto } from "./dto/list-attributes-query.dto";
import { CreateAttributeDefinitionDto } from "./dto/create-attribute-definition.dto";
import { UpdateAttributeDefinitionDto } from "./dto/update-attribute-definition.dto";
import { CreateAttributeValueDto } from "./dto/create-attribute-value.dto";
import { UpdateAttributeValueDto } from "./dto/update-attribute-value.dto";
import type { User as SupabaseUser } from "@supabase/supabase-js";

@Controller("tenants/:tenantId/attributes")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  list(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Query() query: ListAttributesQueryDto,
  ) {
    return this.attributesService.listDefinitions(supabaseUser, tenantId, query);
  }

  @Post()
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  createDefinition(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateAttributeDefinitionDto,
  ) {
    return this.attributesService.createDefinition(supabaseUser, tenantId, body);
  }

  @Patch(":definitionId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  updateDefinition(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("definitionId") definitionId: string,
    @Body() body: UpdateAttributeDefinitionDto,
  ) {
    return this.attributesService.updateDefinition(supabaseUser, tenantId, definitionId, body);
  }

  @Delete(":definitionId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archiveDefinition(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("definitionId") definitionId: string,
  ) {
    return this.attributesService.archiveDefinition(supabaseUser, tenantId, definitionId);
  }

  @Post(":definitionId/values")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  createValue(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("definitionId") definitionId: string,
    @Body() body: CreateAttributeValueDto,
  ) {
    return this.attributesService.createValue(supabaseUser, tenantId, definitionId, body);
  }

  @Patch(":definitionId/values/:valueId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  updateValue(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("definitionId") definitionId: string,
    @Param("valueId") valueId: string,
    @Body() body: UpdateAttributeValueDto,
  ) {
    return this.attributesService.updateValue(supabaseUser, tenantId, definitionId, valueId, body);
  }

  @Delete(":definitionId/values/:valueId")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  archiveValue(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("definitionId") definitionId: string,
    @Param("valueId") valueId: string,
  ) {
    return this.attributesService.archiveValue(supabaseUser, tenantId, definitionId, valueId);
  }
}

