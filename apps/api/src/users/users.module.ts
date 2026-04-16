import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, SupabaseAdminService],
  exports: [UsersService],
})
export class UsersModule {}
