import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { BusinessProfilesController } from "./business-profiles.controller";
import { BusinessProfilesService } from "./business-profiles.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [BusinessProfilesController],
  providers: [BusinessProfilesService, CurrentTenantGuard],
})
export class BusinessProfilesModule {}
