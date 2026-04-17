/**
 * Client-side checks for profile / team UI.
 * Keep aligned with `apps/api/src/tenants/membership-handle.constants.ts`.
 */
export const MEMBERSHIP_HANDLE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
export const MEMBERSHIP_HANDLE_MIN = 3;
export const MEMBERSHIP_HANDLE_MAX = 32;

export function membershipHandleValidationMessage(): string {
  return "3–32 символи: латиниця, цифри та _; починатися з літери.";
}
