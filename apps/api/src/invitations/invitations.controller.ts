import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RateLimit } from "../security/rate-limit.decorator";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { InvitationsService } from "./invitations.service";

@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard, CurrentTenantGuard)
  create(
    @AuthUser() supabaseUser: User,
    @CurrentTenant() tenantId: string,
    @Body() body: CreateInvitationDto,
  ) {
    return this.invitationsService.create(supabaseUser, tenantId, body);
  }
}
