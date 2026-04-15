import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IntegrationProvider,
  IntegrationSecretKey,
  MembershipStatus,
  OrganizationRole,
} from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createCipheriv, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { CreateBusinessProfileDto } from "./dto/create-business-profile.dto";
import { SetIntegrationSecretDto } from "./dto/set-integration-secret.dto";
import { UpdateBusinessProfileDto } from "./dto/update-business-profile.dto";

const SECRET_KEY_BYTES = 32;
const PROVIDER_SECRET_KEYS: Record<IntegrationProvider, IntegrationSecretKey[]> = {
  NOVA_POSHTA: [IntegrationSecretKey.NOVA_POSHTA_API_KEY],
  CHECKBOX: [
    IntegrationSecretKey.CHECKBOX_LICENCE_KEY,
    IntegrationSecretKey.CHECKBOX_TEST_LICENCE_KEY,
    IntegrationSecretKey.CHECKBOX_PINCODE,
    IntegrationSecretKey.CHECKOX_TEST_PINCODE,
  ],
};

function sanitizeOptional(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function maskSecret(secret: string): string {
  const visibleTail = secret.slice(-4);
  return `******${visibleTail}`;
}

@Injectable()
export class BusinessProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  private getMasterKey(): Buffer {
    const raw = this.config.get<string>("INTEGRATION_SECRETS_MASTER_KEY");
    if (!raw) {
      throw new InternalServerErrorException("integration_secrets_not_configured");
    }

    const trimmed = raw.trim();
    const asBase64 = Buffer.from(trimmed, "base64");
    if (asBase64.length === SECRET_KEY_BYTES) {
      return asBase64;
    }

    const asUtf8 = Buffer.from(trimmed, "utf8");
    if (asUtf8.length === SECRET_KEY_BYTES) {
      return asUtf8;
    }

    throw new InternalServerErrorException("invalid_integration_secrets_key");
  }

  private encryptSecret(secret: string) {
    const key = this.getMasterKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedValue: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    };
  }

  private assertProviderKeyCompatibility(
    provider: IntegrationProvider,
    keyName: IntegrationSecretKey,
  ) {
    const allowedKeys = PROVIDER_SECRET_KEYS[provider];
    if (!allowedKeys.includes(keyName)) {
      throw new BadRequestException("invalid_provider_key_pair");
    }
  }

  private async assertTenantMember(appUserId: string, tenantId: string) {
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
    return membership;
  }

  private async assertCanManageProfiles(appUserId: string, tenantId: string) {
    const membership = await this.assertTenantMember(appUserId, tenantId);
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenException("insufficient_role_to_manage_business_profiles");
    }
  }

  private async assertProfileBelongsToTenant(profileId: string, tenantId: string) {
    const profile = await this.prisma.businessProfile.findFirst({
      where: { id: profileId, tenantId },
    });
    if (!profile) {
      throw new NotFoundException("business_profile_not_found");
    }
    return profile;
  }

  async list(supabaseUser: SupabaseUser, tenantId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertTenantMember(user.id, tenantId);

    const [tenant, profiles] = await this.prisma.$transaction([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { activeBusinessProfileId: true },
      }),
      this.prisma.businessProfile.findMany({
        where: { tenantId },
        include: { credentials: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      activeBusinessProfileId: tenant?.activeBusinessProfileId ?? null,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        legalName: profile.legalName,
        taxId: profile.taxId,
        registrationNumber: profile.registrationNumber,
        isActive: profile.id === tenant?.activeBusinessProfileId,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        credentials: profile.credentials.map((credential) => ({
          provider: credential.provider,
          keyName: credential.keyName,
          maskedValue: credential.maskedValue,
          label: credential.label,
          updatedAt: credential.updatedAt.toISOString(),
        })),
      })),
    };
  }

  async create(supabaseUser: SupabaseUser, tenantId: string, dto: CreateBusinessProfileDto) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageProfiles(user.id, tenantId);

    const created = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.businessProfile.create({
        data: {
          tenantId,
          displayName: dto.displayName,
          legalName: sanitizeOptional(dto.legalName),
          taxId: sanitizeOptional(dto.taxId),
          registrationNumber: sanitizeOptional(dto.registrationNumber),
        },
      });

      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { activeBusinessProfileId: true },
      });
      if (!tenant?.activeBusinessProfileId) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { activeBusinessProfileId: profile.id },
        });
      }

      return profile;
    });

    return {
      profile: {
        id: created.id,
        displayName: created.displayName,
        legalName: created.legalName,
        taxId: created.taxId,
        registrationNumber: created.registrationNumber,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  }

  async update(
    supabaseUser: SupabaseUser,
    tenantId: string,
    profileId: string,
    dto: UpdateBusinessProfileDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageProfiles(user.id, tenantId);
    await this.assertProfileBelongsToTenant(profileId, tenantId);

    if (
      dto.displayName === undefined &&
      dto.legalName === undefined &&
      dto.taxId === undefined &&
      dto.registrationNumber === undefined
    ) {
      throw new BadRequestException("no_updates");
    }

    const updated = await this.prisma.businessProfile.update({
      where: { id: profileId },
      data: {
        displayName: dto.displayName,
        legalName: sanitizeOptional(dto.legalName),
        taxId: sanitizeOptional(dto.taxId),
        registrationNumber: sanitizeOptional(dto.registrationNumber),
      },
    });

    return {
      profile: {
        id: updated.id,
        displayName: updated.displayName,
        legalName: updated.legalName,
        taxId: updated.taxId,
        registrationNumber: updated.registrationNumber,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  async activate(supabaseUser: SupabaseUser, tenantId: string, profileId: string) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageProfiles(user.id, tenantId);
    await this.assertProfileBelongsToTenant(profileId, tenantId);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { activeBusinessProfileId: profileId },
    });

    return { activeBusinessProfileId: profileId };
  }

  async upsertSecret(
    supabaseUser: SupabaseUser,
    tenantId: string,
    profileId: string,
    provider: IntegrationProvider,
    keyName: IntegrationSecretKey,
    dto: SetIntegrationSecretDto,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageProfiles(user.id, tenantId);
    await this.assertProfileBelongsToTenant(profileId, tenantId);
    this.assertProviderKeyCompatibility(provider, keyName);

    const encrypted = this.encryptSecret(dto.secret);
    const credential = await this.prisma.integrationCredential.upsert({
      where: {
        businessProfileId_provider_keyName: {
          businessProfileId: profileId,
          provider,
          keyName,
        },
      },
      update: {
        encryptedValue: encrypted.encryptedValue,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        maskedValue: maskSecret(dto.secret),
        label: sanitizeOptional(dto.label),
      },
      create: {
        businessProfileId: profileId,
        provider,
        keyName,
        encryptedValue: encrypted.encryptedValue,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        maskedValue: maskSecret(dto.secret),
        label: sanitizeOptional(dto.label),
      },
    });

    return {
      credential: {
        provider: credential.provider,
        keyName: credential.keyName,
        maskedValue: credential.maskedValue,
        label: credential.label,
        updatedAt: credential.updatedAt.toISOString(),
      },
    };
  }

  async removeSecret(
    supabaseUser: SupabaseUser,
    tenantId: string,
    profileId: string,
    provider: IntegrationProvider,
    keyName: IntegrationSecretKey,
  ) {
    const user = await this.usersService.upsertFromSupabaseUser(supabaseUser);
    await this.assertCanManageProfiles(user.id, tenantId);
    await this.assertProfileBelongsToTenant(profileId, tenantId);
    this.assertProviderKeyCompatibility(provider, keyName);

    await this.prisma.integrationCredential.deleteMany({
      where: { businessProfileId: profileId, provider, keyName },
    });
    return { removed: true };
  }
}
