import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MembershipStatus, Prisma, type User as PrismaUser } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { buildSupabaseStoragePublicUrl } from "../lib/supabase-storage-public-url";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import type { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { isHttpAvatarReference } from "../lib/avatar-url";
import { buildPresetAvatarPublicUrl, resolveUserDisplayName } from "./user-profile.utils";
import { isTenantCuid } from "../tenancy/tenant-cuid";
import { normalizeAndValidateMembershipHandle } from "../tenants/membership-handle.utils";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async upsertFromSupabaseUser(supabaseUser: SupabaseUser) {
    return this.prisma.user.upsert({
      where: { authUserId: supabaseUser.id },
      create: {
        authUserId: supabaseUser.id,
        email: supabaseUser.email ?? null,
      },
      update: {
        email: supabaseUser.email ?? undefined,
      },
    });
  }

  async getProfile(supabaseUser: SupabaseUser, tenantId: string | null) {
    const user = await this.upsertFromSupabaseUser(supabaseUser);
    const base = await this.buildPublicProfileFields(user);
    if (tenantId === null || tenantId === undefined || !isTenantCuid(tenantId)) {
      return { ...base, tenantPersona: null };
    }
    const activeTenantId = tenantId.trim();
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: activeTenantId } },
      include: { tenant: { select: { id: true, name: true } } },
    });
    if (!membership) {
      return { ...base, tenantPersona: null };
    }
    return {
      ...base,
      tenantPersona: {
        tenantId: membership.tenantId,
        membershipId: membership.id,
        tenantName: membership.tenant.name,
        handle: membership.handle,
      },
    };
  }

  async updateProfile(
    supabaseUser: SupabaseUser,
    dto: UpdateUserProfileDto,
    tenantId: string | null,
  ) {
    const user = await this.upsertFromSupabaseUser(supabaseUser);
    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName;
    }
    this.applyAvatarFieldsToUpdate(user.id, dto, data);

    const updated =
      Object.keys(data).length > 0
        ? await this.prisma.user.update({
            where: { id: user.id },
            data,
          })
        : user;

    if (dto.tenantHandle !== undefined) {
      if (tenantId === null || tenantId === undefined || !isTenantCuid(tenantId)) {
        throw new BadRequestException("tenant_id_required_for_handle");
      }
      const activeTenantId = tenantId.trim();
      const normalized = normalizeAndValidateMembershipHandle(dto.tenantHandle);
      const membership = await this.prisma.membership.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId: activeTenantId } },
      });
      if (!membership) {
        throw new ForbiddenException("not_a_member_of_tenant");
      }
      if (membership.status !== MembershipStatus.ACTIVE) {
        throw new BadRequestException("cannot_update_handle_of_deactivated_member");
      }
      if (normalized !== membership.handle) {
        try {
          await this.prisma.membership.update({
            where: { id: membership.id },
            data: { handle: normalized },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw new ConflictException("membership_handle_taken");
          }
          throw err;
        }
      }
    }

    return this.getProfile(supabaseUser, tenantId);
  }

  async createAvatarSignedUpload(supabaseUser: SupabaseUser, mimeType: string) {
    const user = await this.upsertFromSupabaseUser(supabaseUser);
    const bucket = this.getUserAvatarBucket();
    const ext = MIME_TO_EXT[mimeType];
    if (!ext) {
      throw new BadRequestException("unsupported_mime");
    }
    const path = this.buildUserAvatarObjectPath(user.id, `${randomUUID()}.${ext}`);
    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      throw new InternalServerErrorException("avatar_upload_unavailable");
    }
    return {
      bucket,
      path,
      token: data.token,
      storagePath: path,
    };
  }

  async toAuthMeUserFields(user: PrismaUser) {
    const base = await this.buildPublicProfileFields(user);
    return {
      ...base,
      authUserId: user.authUserId,
    };
  }

  private async buildPublicProfileFields(user: PrismaUser) {
    const resolvedAvatarUrl = await this.getResolvedAvatarUrl(user);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      avatarPresetId: user.avatarPresetId,
      displayName: resolveUserDisplayName(user),
      resolvedAvatarUrl,
    };
  }

  async getResolvedAvatarUrl(user: PrismaUser): Promise<string | null> {
    if (user.avatarPresetId) {
      return buildPresetAvatarPublicUrl(user.avatarPresetId, this.getResolvedAvatarUrlOptions());
    }
    const ref = user.avatarUrl?.trim();
    if (!ref) {
      return null;
    }
    if (isHttpAvatarReference(ref)) {
      return ref;
    }
    if (!ref.startsWith(this.userAvatarPathPrefixForUser(user.id))) {
      return null;
    }
    if (this.usePublicUserAvatarRead()) {
      const baseUrl = this.config.getOrThrow<string>("SUPABASE_URL");
      return buildSupabaseStoragePublicUrl(baseUrl, this.getUserAvatarBucket(), ref);
    }
    return this.getUserAvatarSignedReadUrl(ref);
  }

  /**
   * When true (default), `resolvedAvatarUrl` uses stable `.../object/public/...` URLs so any
   * authenticated client can render avatars (e.g. team lists). Requires public read on the
   * Storage path in Supabase. Set to false to use time-limited signed URLs instead (private bucket).
   */
  private usePublicUserAvatarRead(): boolean {
    const raw = this.config.get<string>("SUPABASE_USER_AVATAR_PUBLIC_READ");
    if (raw === undefined || raw.trim() === "") {
      return true;
    }
    const v = raw.trim().toLowerCase();
    return !(v === "false" || v === "0" || v === "no");
  }

  private async getUserAvatarSignedReadUrl(objectPath: string): Promise<string | null> {
    const bucket = this.getUserAvatarBucket();
    const ttlRaw = this.config.get<string | number>("SUPABASE_USER_AVATAR_SIGNED_READ_TTL_SEC");
    const ttl = Number(ttlRaw ?? 3600);
    const ttlSeconds = Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, ttlSeconds);
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  }

  private applyAvatarFieldsToUpdate(
    userId: string,
    dto: UpdateUserProfileDto,
    data: Prisma.UserUpdateInput,
  ): void {
    const presetProvided = dto.avatarPresetId !== undefined;
    const urlProvided = dto.avatarUrl !== undefined;
    if (!presetProvided && !urlProvided) {
      return;
    }
    if (presetProvided && dto.avatarPresetId !== null) {
      data.avatarPresetId = dto.avatarPresetId;
      data.avatarUrl = null;
      return;
    }
    if (urlProvided && typeof dto.avatarUrl === "string") {
      this.assertAvatarUrlAllowedForUser(userId, dto.avatarUrl);
      data.avatarUrl = dto.avatarUrl;
      data.avatarPresetId = null;
      return;
    }
    data.avatarPresetId = null;
    data.avatarUrl = null;
  }

  private assertAvatarUrlAllowedForUser(userId: string, avatarUrl: string): void {
    if (isHttpAvatarReference(avatarUrl)) {
      return;
    }
    if (!avatarUrl.startsWith(this.userAvatarPathPrefixForUser(userId))) {
      throw new BadRequestException("invalid_avatar_path");
    }
  }

  private getUserAvatarBucket(): string {
    return this.config.get<string>("SUPABASE_USER_AVATAR_BUCKET") ?? "users";
  }

  /** Folder segment(s) before `{userId}/{filename}` (no leading/trailing slashes). */
  private getUserAvatarPrefix(): string {
    const raw = this.config.get<string>("SUPABASE_USER_AVATAR_PREFIX") ?? "avatars";
    return raw.replace(/^\/+|\/+$/g, "");
  }

  private buildUserAvatarObjectPath(userId: string, fileName: string): string {
    return `${this.getUserAvatarPrefix()}/${userId}/${fileName}`;
  }

  private userAvatarPathPrefixForUser(userId: string): string {
    return `${this.getUserAvatarPrefix()}/${userId}/`;
  }

  private getResolvedAvatarUrlOptions() {
    return {
      supabaseUrl: this.config.getOrThrow<string>("SUPABASE_URL"),
      presetBucket: this.config.get<string>("SUPABASE_PRESET_AVATAR_BUCKET") ?? "presets",
      presetPrefix: this.config.get<string>("SUPABASE_PRESET_AVATAR_PREFIX") ?? "avatars",
    };
  }
}
