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
import type { User } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { SetupTenantDto } from "./dto/setup-tenant.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(":tenantId/members")
  @UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
  listMembers(
    @AuthUser() supabaseUser: User,
    @Param("tenantId") _tenantId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.tenantsService.listMembers(supabaseUser, tenantId);
  }

  @Patch(":tenantId/members/:membershipId")
  @UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
  updateMember(
    @AuthUser() supabaseUser: User,
    @Param("tenantId") _tenantId: string,
    @CurrentTenant() tenantId: string,
    @Param("membershipId") membershipId: string,
    @Body() body: UpdateMemberDto,
  ) {
    return this.tenantsService.patchMember(
      supabaseUser,
      tenantId,
      membershipId,
      body,
    );
  }

  @Delete(":tenantId/members/:membershipId")
  @UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
  removeMember(
    @AuthUser() supabaseUser: User,
    @Param("tenantId") _tenantId: string,
    @CurrentTenant() tenantId: string,
    @Param("membershipId") membershipId: string,
  ) {
    return this.tenantsService.removeMember(supabaseUser, tenantId, membershipId);
  }

  @Post("setup")
  @UseGuards(SupabaseAuthGuard)
  setup(
    @AuthUser() supabaseUser: User,
    @Body() body: SetupTenantDto,
  ) {
    return this.tenantsService.setup(supabaseUser, body.name);
  }
}
