export type TenantSettingsDto = {
  id: string;
  name: string;
  logoUrl: string | null;
  resolvedLogoUrl: string | null;
};

export type TenantSettingsResponse = {
  tenant: TenantSettingsDto;
};

export type TenantLogoSignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
  storagePath?: string;
};
