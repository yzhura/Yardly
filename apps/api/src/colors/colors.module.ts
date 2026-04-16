import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { ColorsController } from "./colors.controller";
import { ColorsService } from "./colors.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ColorsController],
  providers: [ColorsService, CurrentTenantGuard, SupabaseAdminService],
})
export class ColorsModule {}

