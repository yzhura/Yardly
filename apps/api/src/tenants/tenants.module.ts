import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [TenantsController],
  providers: [TenantsService, CurrentTenantGuard],
})
export class TenantsModule {}
