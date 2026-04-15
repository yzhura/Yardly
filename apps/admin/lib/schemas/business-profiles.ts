import * as yup from "yup";
import { BUSINESS_PROFILE_VALIDATION } from "@/constants/business-profiles";

const PROVIDERS = ["NOVA_POSHTA", "CHECKBOX"] as const;

export const createBusinessProfileSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required(BUSINESS_PROFILE_VALIDATION.displayNameRequired)
    .max(120, BUSINESS_PROFILE_VALIDATION.displayNameMax),
  legalName: yup.string().trim().max(160, BUSINESS_PROFILE_VALIDATION.legalNameMax),
  taxId: yup.string().trim().max(32, BUSINESS_PROFILE_VALIDATION.taxIdMax),
  registrationNumber: yup
    .string()
    .trim()
    .max(64, BUSINESS_PROFILE_VALIDATION.registrationNumberMax),
});

export const upsertSecretSchema = yup.object({
  profileId: yup.string().required(BUSINESS_PROFILE_VALIDATION.profileRequired),
  provider: yup
    .string()
    .oneOf([...PROVIDERS], BUSINESS_PROFILE_VALIDATION.providerInvalid)
    .required(BUSINESS_PROFILE_VALIDATION.providerRequired),
  secret: yup
    .string()
    .trim()
    .min(8, BUSINESS_PROFILE_VALIDATION.secretMin)
    .max(512, BUSINESS_PROFILE_VALIDATION.secretMax)
    .required(BUSINESS_PROFILE_VALIDATION.secretMin),
  label: yup.string().trim().max(80),
});

export type CreateBusinessProfileFormInput = {
  displayName: string;
  legalName: string | undefined;
  taxId: string | undefined;
  registrationNumber: string | undefined;
};

export type CreateBusinessProfileFormValues = {
  displayName: string;
  legalName?: string | undefined;
  taxId?: string | undefined;
  registrationNumber?: string | undefined;
};

export type UpsertSecretFormInput = {
  profileId: string;
  provider: (typeof PROVIDERS)[number];
  secret: string;
  label: string | undefined;
};

export type UpsertSecretFormValues = {
  profileId: string;
  provider: (typeof PROVIDERS)[number];
  secret: string;
  label?: string | undefined;
};
