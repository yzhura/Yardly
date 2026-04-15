import type {
  IntegrationProvider,
  IntegrationSecretKey,
} from "@/api/business-profiles/types";

export type IntegrationField = {
  keyName: IntegrationSecretKey;
  label: string;
  placeholder: string;
};

export const NOVA_FIELDS: IntegrationField[] = [
  {
    keyName: "NOVA_POSHTA_API_KEY",
    label: "NOVA POSHTA API KEY - Нова пошта АПІ ключ",
    placeholder: "Вставте ключ Nova Poshta",
  },
];

export const CHECKBOX_FIELDS: IntegrationField[] = [
  {
    keyName: "CHECKBOX_LICENCE_KEY",
    label: "Ключ ліцензії каси",
    placeholder: "Вставте ключ ліцензії",
  },
  {
    keyName: "CHECKBOX_TEST_LICENCE_KEY",
    label: "Тестовий ключ ліцензії",
    placeholder: "Вставте тестовий ключ ліцензії",
  },
  {
    keyName: "CHECKBOX_PINCODE",
    label: "Пінкод касира",
    placeholder: "Вставте пінкод касира",
  },
  {
    keyName: "CHECKOX_TEST_PINCODE",
    label: "Тестовий пінкод касира",
    placeholder: "Вставте тестовий пінкод",
  },
];

export const INTEGRATION_DEFS: Array<{
  provider: IntegrationProvider;
  title: string;
  subtitle: string;
  iconName: "truck" | "receipt";
  fields: IntegrationField[];
}> = [
  {
    provider: "NOVA_POSHTA",
    title: "Нова Пошта",
    subtitle: "Логістичний сервіс доставки",
    iconName: "truck",
    fields: NOVA_FIELDS,
  },
  {
    provider: "CHECKBOX",
    title: "Checkbox",
    subtitle: "Сервіс програмного РРО",
    iconName: "receipt",
    fields: CHECKBOX_FIELDS,
  },
];

export const emptyDraft: Record<IntegrationSecretKey, string> = {
  NOVA_POSHTA_API_KEY: "",
  CHECKBOX_LICENCE_KEY: "",
  CHECKBOX_TEST_LICENCE_KEY: "",
  CHECKBOX_PINCODE: "",
  CHECKOX_TEST_PINCODE: "",
};

export const hiddenDraft: Record<IntegrationSecretKey, boolean> = {
  NOVA_POSHTA_API_KEY: true,
  CHECKBOX_LICENCE_KEY: true,
  CHECKBOX_TEST_LICENCE_KEY: true,
  CHECKBOX_PINCODE: true,
  CHECKOX_TEST_PINCODE: true,
};
