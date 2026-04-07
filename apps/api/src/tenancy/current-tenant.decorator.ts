import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import type { RequestWithSupabaseUser } from "../auth/supabase-auth.guard";

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithSupabaseUser>();
    if (!request.currentTenantId) {
      throw new BadRequestException("tenant_id_required");
    }
    return request.currentTenantId;
  },
);
