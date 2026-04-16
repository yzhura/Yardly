import * as yup from "yup";

export const userProfileFormSchema = yup.object({
  firstName: yup.string().max(80, "Не більше 80 символів").default(""),
  lastName: yup.string().max(80, "Не більше 80 символів").default(""),
});

export type UserProfileFormValues = yup.InferType<typeof userProfileFormSchema>;
