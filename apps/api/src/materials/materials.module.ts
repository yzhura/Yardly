import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { MaterialsController } from "./materials.controller";
import { MaterialCategoriesController } from "./material-categories.controller";
import { MaterialsService } from "./materials.service";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [MaterialsController, MaterialCategoriesController],
  providers: [MaterialsService, CurrentTenantGuard, SupabaseAdminService],
})
export class MaterialsModule {}

