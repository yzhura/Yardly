import { CanActivate, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { RATE_LIMIT_KEY, type RateLimitOptions } from "./rate-limit.decorator";

type RateEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateEntry>();
  private readonly defaultOptions: RateLimitOptions = { limit: 120, ttlMs: 60_000 };

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: import("@nestjs/common").ExecutionContext): boolean {
    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? this.defaultOptions;
    const request = context.switchToHttp().getRequest<Request>();
    const routeKey = request.route?.path ?? request.path;
    const clientKey = request.ip || "unknown";
    const key = `${clientKey}:${routeKey}`;
    const now = Date.now();
    const current = this.store.get(key);

    if (!current || current.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + options.ttlMs });
      return true;
    }

    if (current.count >= options.limit) {
      throw new HttpException("too_many_requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
    this.store.set(key, current);
    return true;
  }
}
