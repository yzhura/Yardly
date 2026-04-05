import { Injectable } from "@nestjs/common";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async setup(supabaseUser: SupabaseUser, name: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name } });
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "OWNER",
        },
      });

      return {
        tenant: { id: tenant.id, name: tenant.name },
        membership: {
          id: membership.id,
          role: membership.role,
          tenantId: membership.tenantId,
        },
      };
    });
  }
}
