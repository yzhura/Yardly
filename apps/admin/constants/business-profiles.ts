export const BUSINESS_PROFILE_UI = {
  title: "Профілі бізнесу",
  description:
    "Створюйте кілька профілів ФОП/бізнесу, обирайте активний і керуйте ключами інтеграцій.",
  empty: "Ще немає жодного профілю. Додайте перший профіль бізнесу.",
  createTitle: "Новий профіль",
  createSubmit: "Додати профіль",
  createSubmitPending: "Додаємо...",
  activate: "Зробити активним",
  activatePending: "Активуємо...",
  activeBadge: "Активний",
  credentialsTitle: "Секрети інтеграцій",
  secretSubmit: "Зберегти ключ",
  secretSubmitPending: "Зберігаємо...",
  secretRemove: "Видалити ключ",
} as const;

export const BUSINESS_PROFILE_VALIDATION = {
  displayNameRequired: "Вкажіть назву профілю.",
  displayNameMax: "Назва профілю занадто довга.",
  legalNameMax: "Юридична назва занадто довга.",
  taxIdMax: "ІПН/ЄДРПОУ занадто довгий.",
  registrationNumberMax: "Реєстраційний номер занадто довгий.",
  secretMin: "Ключ має містити щонайменше 8 символів.",
  secretMax: "Ключ занадто довгий.",
  providerRequired: "Оберіть сервіс.",
  providerInvalid: "Некоректний сервіс.",
  profileRequired: "Оберіть профіль.",
} as const;
