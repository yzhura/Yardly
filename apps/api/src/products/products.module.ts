import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { ProductsController } from "./products.controller";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { ProductsService } from "./products.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ProductsController],
  providers: [ProductsService, CurrentTenantGuard, SupabaseAdminService],
})
export class ProductsModule {}
