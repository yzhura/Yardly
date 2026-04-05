import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [UsersModule, PrismaModule],
  controllers: [AuthController],
})
export class AuthModule {}
