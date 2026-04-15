import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { IntegrationProvider, IntegrationSecretKey } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { BusinessProfilesService } from "./business-profiles.service";
import { CreateBusinessProfileDto } from "./dto/create-business-profile.dto";
import { SetIntegrationSecretDto } from "./dto/set-integration-secret.dto";
import { UpdateBusinessProfileDto } from "./dto/update-business-profile.dto";

@Controller("tenants/:tenantId/business-profiles")
@UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
export class BusinessProfilesController {
  constructor(private readonly businessProfilesService: BusinessProfilesService) {}

  @Get()
  list(@AuthUser() supabaseUser: SupabaseUser, @CurrentTenant() tenantId: string) {
    return this.businessProfilesService.list(supabaseUser, tenantId);
  }

  @Post()
  create(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateBusinessProfileDto,
  ) {
    return this.businessProfilesService.create(supabaseUser, tenantId, body);
  }

  @Patch(":profileId")
  update(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("profileId") profileId: string,
    @Body() body: UpdateBusinessProfileDto,
  ) {
    return this.businessProfilesService.update(supabaseUser, tenantId, profileId, body);
  }

  @Post(":profileId/activate")
  activate(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("profileId") profileId: string,
  ) {
    return this.businessProfilesService.activate(supabaseUser, tenantId, profileId);
  }

  @Put(":profileId/credentials/:provider/:keyName")
  upsertSecret(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("profileId") profileId: string,
    @Param("provider", new ParseEnumPipe(IntegrationProvider))
    provider: IntegrationProvider,
    @Param("keyName", new ParseEnumPipe(IntegrationSecretKey))
    keyName: IntegrationSecretKey,
    @Body() body: SetIntegrationSecretDto,
  ) {
    return this.businessProfilesService.upsertSecret(
      supabaseUser,
      tenantId,
      profileId,
      provider,
      keyName,
      body,
    );
  }

  @Delete(":profileId/credentials/:provider/:keyName")
  removeSecret(
    @AuthUser() supabaseUser: SupabaseUser,
    @CurrentTenant() tenantId: string,
    @Param("profileId") profileId: string,
    @Param("provider", new ParseEnumPipe(IntegrationProvider))
    provider: IntegrationProvider,
    @Param("keyName", new ParseEnumPipe(IntegrationSecretKey))
    keyName: IntegrationSecretKey,
  ) {
    return this.businessProfilesService.removeSecret(
      supabaseUser,
      tenantId,
      profileId,
      provider,
      keyName,
    );
  }
}
