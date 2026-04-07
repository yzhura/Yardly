import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import type { RequestWithSupabaseUser } from "../auth/supabase-auth.guard";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;

function getTenantIdValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

@Injectable()
export class CurrentTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSupabaseUser>();
    const header = getTenantIdValue(request.headers["x-tenant-id"]);
    const param = getTenantIdValue(request.params?.tenantId);
    const body = getTenantIdValue((request.body as { tenantId?: unknown })?.tenantId);

    const provided = [header, param, body].filter((value): value is string => value !== null);
    if (provided.length === 0) {
      throw new BadRequestException("tenant_id_required");
    }

    const uniqueValues = Array.from(new Set(provided));
    if (uniqueValues.length > 1) {
      throw new BadRequestException("tenant_id_mismatch");
    }

    const tenantId = uniqueValues[0];
    if (!CUID_REGEX.test(tenantId)) {
      throw new BadRequestException("invalid_tenant_id");
    }

    request.currentTenantId = tenantId;
    return true;
  }
}
