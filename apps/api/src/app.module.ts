import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [
    // @nestjs/config@4 returns Promise<DynamicModule>; duplicate @nestjs/common paths in monorepos can
    // break TS structural compatibility between those promises — runtime is unchanged.
    ConfigModule.forRoot({
      isGlobal: true,
      // Loads `apps/api/.env` when you run Nest from that workspace (npm cwd).
    }) as any,
    PrismaModule,
    AuthModule,
    TenantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
