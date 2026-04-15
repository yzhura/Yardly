export type IntegrationProvider = "NOVA_POSHTA" | "CHECKBOX";
export type IntegrationSecretKey =
  | "NOVA_POSHTA_API_KEY"
  | "CHECKBOX_LICENCE_KEY"
  | "CHECKBOX_TEST_LICENCE_KEY"
  | "CHECKBOX_PINCODE"
  | "CHECKOX_TEST_PINCODE";

export type IntegrationCredentialDto = {
  provider: IntegrationProvider;
  keyName: IntegrationSecretKey;
  maskedValue: string;
  label: string | null;
  updatedAt: string;
};

export type BusinessProfileDto = {
  id: string;
  displayName: string;
  legalName: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  credentials: IntegrationCredentialDto[];
};

export type BusinessProfilesResponse = {
  activeBusinessProfileId: string | null;
  profiles: BusinessProfileDto[];
};
