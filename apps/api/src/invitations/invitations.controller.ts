import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { InvitationsService } from "./invitations.service";

@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @AuthUser() supabaseUser: User,
    @Body() body: CreateInvitationDto,
  ) {
    return this.invitationsService.create(supabaseUser, body);
  }
}
