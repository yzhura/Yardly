import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BusinessProfilesModule } from "./business-profiles/business-profiles.module";
import { LoggingModule } from "./logging/logging.module";
import { RequestLoggerMiddleware } from "./logging/request-logger.middleware";
import { PrismaModule } from "./prisma/prisma.module";
import { RateLimitGuard } from "./security/rate-limit.guard";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [
    // @nestjs/config@4 returns Promise<DynamicModule>; duplicate @nestjs/common paths in monorepos can
    // break TS structural compatibility between those promises — runtime is unchanged.
    ConfigModule.forRoot({
      isGlobal: true,
      // Loads `apps/api/.env` when you run Nest from that workspace (npm cwd).
    }) as any,
    LoggingModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    BusinessProfilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
