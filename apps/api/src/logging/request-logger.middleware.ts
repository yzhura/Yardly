import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { JsonLoggerService } from "./json-logger.service";

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: JsonLoggerService) {}

  use(req: RequestWithId, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    const requestId = req.header("x-request-id")?.trim() || randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);

    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      this.logger.log({
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
      }, "HttpRequest");
    });

    next();
  }
}
