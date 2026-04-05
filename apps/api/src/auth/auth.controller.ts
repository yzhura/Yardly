import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";
import { AuthUser } from "./auth-user.decorator";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async me(@AuthUser() supabaseUser: User) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { tenant: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      user: {
        id: user.id,
        authUserId: user.authUserId,
        email: user.email,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        role: m.role,
        tenant: { id: m.tenant.id, name: m.tenant.name },
      })),
    };
  }
}
