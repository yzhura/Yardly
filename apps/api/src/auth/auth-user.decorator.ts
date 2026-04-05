import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ supabaseUser: User }>();
    return request.supabaseUser;
  },
);
