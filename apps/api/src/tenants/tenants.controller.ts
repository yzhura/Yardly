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
import { SetupTenantDto } from "./dto/setup-tenant.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(":tenantId/members")
  @UseGuards(SupabaseAuthGuard)
  listMembers(
    @AuthUser() supabaseUser: User,
    @Param("tenantId") tenantId: string,
  ) {
    return this.tenantsService.listMembers(supabaseUser, tenantId);
  }

  @Patch(":tenantId/members/:membershipId")
  @UseGuards(SupabaseAuthGuard)
  updateMemberRole(
    @AuthUser() supabaseUser: User,
    @Param("tenantId") tenantId: string,
    @Param("membershipId") membershipId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.tenantsService.updateMemberRole(
      supabaseUser,
      tenantId,
      membershipId,
      body.role,
    );
  }

  @Delete(":tenantId/members/:membershipId")
  @UseGuards(SupabaseAuthGuard)
  removeMember(
    @AuthUser() supabaseUser: User,
    @Param("tenantId") tenantId: string,
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
