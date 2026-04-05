import { Module } from "@nestjs/common";
import { InvitationsModule } from "../invitations/invitations.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [UsersModule, PrismaModule, InvitationsModule],
  controllers: [AuthController],
})
export class AuthModule {}
