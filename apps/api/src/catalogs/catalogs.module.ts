import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { CatalogsController } from "./catalogs.controller";
import { CatalogsService } from "./catalogs.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CatalogsController],
  providers: [CatalogsService, CurrentTenantGuard],
})
export class CatalogsModule {}
