import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type RequestWithSupabaseUser = Request & {
  supabaseUser: SupabaseUser;
  currentTenantId?: string;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly tokenCache = new Map<
    string,
    { user: SupabaseUser; expiresAt: number }
  >();

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSupabaseUser>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException();
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException();
    }

    const url = this.config.get<string>("SUPABASE_URL");
    const anonKey = this.config.get<string>("SUPABASE_ANON_KEY");
    if (!url || !anonKey) {
      throw new UnauthorizedException();
    }

    const now = Date.now();
    const cached = this.tokenCache.get(token);
    if (cached && cached.expiresAt > now) {
      request.supabaseUser = cached.user;
      return true;
    }

    const supabase = createClient(url, anonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException();
    }

    this.tokenCache.set(token, {
      user,
      expiresAt: now + 30_000,
    });
    request.supabaseUser = user;
    return true;
  }
}
