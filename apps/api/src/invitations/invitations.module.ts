import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { CurrentTenantGuard } from "../tenancy/current-tenant.guard";
import { InvitationsController } from "./invitations.controller";
import { InvitationsService } from "./invitations.service";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, SupabaseAdminService, CurrentTenantGuard],
  exports: [InvitationsService],
})
export class InvitationsModule {}
