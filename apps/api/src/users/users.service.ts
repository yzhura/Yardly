import { Injectable } from "@nestjs/common";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromSupabaseUser(supabaseUser: SupabaseUser) {
    return this.prisma.user.upsert({
      where: { authUserId: supabaseUser.id },
      create: {
        authUserId: supabaseUser.id,
        email: supabaseUser.email ?? null,
      },
      update: {
        email: supabaseUser.email ?? undefined,
      },
    });
  }
}
