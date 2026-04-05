/** Server / API error codes returned by invite flow (aligned with former query params). */
export const INVITE_ERROR_CODES = {
  EMPTY: "empty",
  BAD_ROLE: "bad_role",
  FORBIDDEN: "forbidden",
  ALREADY_MEMBER: "already_member",
  BAD_REQUEST: "bad_request",
  FAILED: "failed",
  NO_SESSION: "no_session",
  NO_TENANT: "no_tenant",
} as const;

export type InviteErrorCode =
  (typeof INVITE_ERROR_CODES)[keyof typeof INVITE_ERROR_CODES];

export const INVITE_ERROR_MESSAGES: Record<InviteErrorCode, string> = {
  [INVITE_ERROR_CODES.EMPTY]: "Вкажіть email і роль.",
  [INVITE_ERROR_CODES.BAD_ROLE]: "Недопустима роль.",
  [INVITE_ERROR_CODES.FORBIDDEN]:
    "Лише власник або адміністратор може запрошувати.",
  [INVITE_ERROR_CODES.ALREADY_MEMBER]: "Цей користувач уже в організації.",
  [INVITE_ERROR_CODES.BAD_REQUEST]:
    "Некоректні дані (наприклад, не можна запросити себе).",
  [INVITE_ERROR_CODES.FAILED]:
    "Не вдалося надіслати запрошення. Спробуйте пізніше.",
  [INVITE_ERROR_CODES.NO_SESSION]: "Сесію завершено. Увійдіть знову.",
  [INVITE_ERROR_CODES.NO_TENANT]: "Оберіть організацію.",
};

export function getInviteErrorMessage(code: InviteErrorCode): string {
  return INVITE_ERROR_MESSAGES[code];
}

/** Copy for invite page and form (validation messages for Yup). */
export const TEAM_INVITE_UI = {
  cardTitle: "Запросити в команду",
  backLink: "← До панелі",
  helperWhenCanInvite:
    "На вказану адресу буде надіслано лист Supabase (запрошення або magic link, якщо акаунт уже існує). Після переходу за посиланням користувач отримає доступ до цієї організації з обраною роллю.",
  forbiddenHint:
    "Запрошувати користувачів можуть лише власник (OWNER) або адміністратор (ADMIN).",
  emailLabel: "Email",
  emailPlaceholder: "colleague@company.com",
  roleLabel: "Роль",
  submit: "Надіслати запрошення",
  submitPending: "Надсилання…",
  successBanner: "Запрошення надіслано.",
} as const;

export const TEAM_INVITE_VALIDATION = {
  emailRequired: "Вкажіть email.",
  emailInvalid: "Некоректний email.",
  emailMaxLength: "Email занадто довгий.",
  roleRequired: "Оберіть роль.",
  roleInvalid: "Недопустима роль.",
} as const;
