import * as yup from "yup";
import { TEAM_INVITE_VALIDATION } from "@/constants/team-invite";
import { INVITABLE_ROLES } from "@/lib/organization-roles";

export const teamInviteFormSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required(TEAM_INVITE_VALIDATION.emailRequired)
    .email(TEAM_INVITE_VALIDATION.emailInvalid)
    .max(254, TEAM_INVITE_VALIDATION.emailMaxLength),
  role: yup
    .string()
    .oneOf([...INVITABLE_ROLES], TEAM_INVITE_VALIDATION.roleInvalid)
    .required(TEAM_INVITE_VALIDATION.roleRequired),
});

export type TeamInviteFormValues = yup.InferType<typeof teamInviteFormSchema>;
