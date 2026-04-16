import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { UsersModule } from "../users/users.module";
import { AttributesService } from "./attributes.service";
import { AttributesController } from "./attributes.controller";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AttributesController],
  providers: [AttributesService, CurrentTenantGuard],
})
export class AttributesModule {}

