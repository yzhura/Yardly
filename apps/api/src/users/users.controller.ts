import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RateLimit } from "../security/rate-limit.decorator";
import { AuthUser } from "../auth/auth-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { AvatarSignedUploadDto } from "./dto/avatar-signed-upload.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me/profile")
  @RateLimit({ limit: 60, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard)
  getProfile(@AuthUser() supabaseUser: SupabaseUser) {
    return this.usersService.getProfile(supabaseUser);
  }

  @Patch("me/profile")
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  @UseGuards(SupabaseAuthGuard)
  patchProfile(@AuthUser() supabaseUser: SupabaseUser, @Body() body: UpdateUserProfileDto) {
    return this.usersService.updateProfile(supabaseUser, body);
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
