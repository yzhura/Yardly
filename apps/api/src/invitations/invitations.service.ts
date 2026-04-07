import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { AuthError } from "@supabase/supabase-js";
import { InvitationStatus, MembershipStatus, type User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { JsonLoggerService } from "../logging/json-logger.service";
import { SupabaseAdminService } from "../supabase/supabase-admin.service";
import { UsersService } from "../users/users.service";
import type { CreateInvitationDto } from "./dto/create-invitation.dto";
import { normalizeInviteEmail } from "./email-normalize";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly logger: JsonLoggerService,
  ) {}

  private getAuthCallbackUrl(): string {
    const raw =
      this.config.get<string>("ADMIN_ORIGIN") ?? "http://localhost:3000";
    const origin = raw.split(",")[0].trim().replace(/\/$/, "");
    return `${origin}/auth/callback`;
  }

  private isAlreadyRegisteredError(error: AuthError): boolean {
    const msg = error.message?.toLowerCase() ?? "";
    return (
      msg.includes("already") ||
      msg.includes("registered") ||
      error.status === 422
    );
  }

  /**
   * Creates memberships from non-expired pending invitations matching the user's email.
   */
  async acceptPendingInvites(user: User): Promise<void> {
    if (!user.email) {
      return;
    }
    let normalized: string;
    try {
      normalized = normalizeInviteEmail(user.email);
    } catch {
      return;
    }

    const pending = await this.prisma.invitation.findMany({
      where: {
        email: normalized,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    for (const inv of pending) {
      await this.prisma.$transaction(async (tx) => {
        // Race: parallel /auth/me or duplicate pending rows — skipDuplicates avoids P2002.
        await tx.membership.createMany({
          data: [
            {
              userId: user.id,
              tenantId: inv.tenantId,
              role: inv.role,
            },
          ],
          skipDuplicates: true,
        });
        await tx.invitation.update({
          where: { id: inv.id },
          data: { status: InvitationStatus.ACCEPTED },
        });
      });
    }
  }

  private async assertCanInvite(
    appUserId: string,
    tenantId: string,
  ): Promise<void> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: { userId: appUserId, tenantId },
      },
    });
    if (!membership) {
      throw new ForbiddenException("not_a_member_of_tenant");
    }
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException("membership_deactivated");
    }
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      throw new ForbiddenException("insufficient_role_to_invite");
    }
  }

  async create(
    supabaseUser: SupabaseUser,
    tenantId: string,
    dto: CreateInvitationDto,
  ) {
    if (dto.tenantId && dto.tenantId !== tenantId) {
      throw new BadRequestException("tenant_id_mismatch");
    }

    const actor = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanInvite(actor.id, tenantId);

    let normalizedEmail: string;
    try {
      normalizedEmail = normalizeInviteEmail(dto.email);
    } catch {
      throw new BadRequestException("invalid_email");
    }

    const actorEmailNorm = actor.email?.trim().toLowerCase() ?? "";
    if (actorEmailNorm.length > 0 && actorEmailNorm === normalizedEmail) {
      throw new BadRequestException("cannot_invite_self");
    }

    const existingMember = await this.prisma.membership.findFirst({
      where: {
        tenantId,
        user: {
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
      },
    });
    if (existingMember) {
      throw new ConflictException("user_already_member");
    }

    await this.prisma.invitation.updateMany({
      where: {
        tenantId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.CANCELLED },
    });

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: normalizedEmail,
        tenantId,
        role: dto.role,
        invitedById: actor.id,
        expiresAt,
        status: InvitationStatus.PENDING,
      },
    });

    try {
      await this.deliverAuthEmail(normalizedEmail);
    } catch (err) {
      await this.prisma.invitation.delete({ where: { id: invitation.id } });
      this.logger.warn("Invite email delivery failed");
      throw err;
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  private async deliverAuthEmail(email: string): Promise<void> {
    const redirectTo = this.getAuthCallbackUrl();
    const admin = this.supabaseAdmin.getClient();

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo },
    );

    if (!inviteError) {
      return;
    }

    if (!this.isAlreadyRegisteredError(inviteError)) {
      throw new InternalServerErrorException("invite_email_failed");
    }

    const anon = this.supabaseAdmin.getAnonAuthClient();
    const { error: otpError } = await anon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      this.logger.warn("Magic link fallback failed");
      throw new InternalServerErrorException("invite_email_failed");
    }
  }
}
