import { Body, Controller, Get, Headers, Patch, Post, UseGuards } from "@nestjs/common";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RateLimit } from "../security/rate-limit.decorator";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { AvatarSignedUploadDto } from "./dto/avatar-signed-upload.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UsersService } from "./users.service";

function tenantIdFromHeader(raw?: string | string[]): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  const v = Array.isArray(raw) ? raw[0] : raw;
  const t = v?.trim() ?? "";
  return t.length > 0 ? t : null;
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me/profile")
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard)
  getProfile(
    @AuthUser() supabaseUser: SupabaseUser,
    @Headers("x-tenant-id") tenantHeader?: string | string[],
  ) {
    return this.usersService.getProfile(supabaseUser, tenantIdFromHeader(tenantHeader));
  }

  @Patch("me/profile")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard)
  patchProfile(
    @AuthUser() supabaseUser: SupabaseUser,
    @Body() body: UpdateUserProfileDto,
    @Headers("x-tenant-id") tenantHeader?: string | string[],
  ) {
    return this.usersService.updateProfile(
      supabaseUser,
      body,
      tenantIdFromHeader(tenantHeader),
    );
  }

  @Post("me/avatar/signed-upload")
  @RateLimit({ limit: 20, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard)
  createAvatarSignedUpload(
    @AuthUser() supabaseUser: SupabaseUser,
    @Body() body: AvatarSignedUploadDto,
  ) {
    return this.usersService.createAvatarSignedUpload(supabaseUser, body.mimeType);
  }
}
