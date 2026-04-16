import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";
import { InvitationsService } from "../invitations/invitations.service";
import { PrismaService } from "../prisma/prisma.service";
import { RateLimit } from "../security/rate-limit.decorator";
import { UsersService } from "../users/users.service";
import { AuthUser } from "./auth-user.decorator";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get("me")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard)
  async me(@AuthUser() supabaseUser: User) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.invitationsService.acceptPendingInvites(user);
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { tenant: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      user: await this.usersService.toAuthMeUserFields(user),
      memberships: memberships.map((m) => ({
        id: m.id,
        role: m.role,
        tenant: { id: m.tenant.id, name: m.tenant.name },
      })),
    };
  }
}
