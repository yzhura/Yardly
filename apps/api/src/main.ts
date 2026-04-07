import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { JsonLoggerService } from "./logging/json-logger.service";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(JsonLoggerService));

  const adminOrigin = process.env.ADMIN_ORIGIN ?? "http://localhost:3000";
  const allowedOrigins = adminOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  app.get(JsonLoggerService).log(`API started on port ${port}`, "Bootstrap");
}

bootstrap();
