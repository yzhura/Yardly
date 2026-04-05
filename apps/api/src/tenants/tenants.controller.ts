import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { SetupTenantDto } from "./dto/setup-tenant.dto";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post("setup")
  @UseGuards(SupabaseAuthGuard)
  setup(
    @AuthUser() supabaseUser: User,
    @Body() body: SetupTenantDto,
  ) {
    return this.tenantsService.setup(supabaseUser, body.name);
  }
}
