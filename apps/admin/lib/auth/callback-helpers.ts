const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

export type EmailOtpType = (typeof EMAIL_OTP_TYPES)[number];

export function isEmailOtpType(type: string): type is EmailOtpType {
  return (EMAIL_OTP_TYPES as readonly string[]).includes(type);
}

export function sanitizeAuthNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

/** Parse `#access_token=...&refresh_token=...` (implicit / invite email flow). */
export function parseImplicitHashParams(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return {};
  }
  return Object.fromEntries(new URLSearchParams(hash).entries());
}

export function hashLooksLikeAuthSession(hash: string): boolean {
  return (
    hash.includes("access_token=") ||
    hash.includes("refresh_token=") ||
    hash.includes("type=invite")
  );
}
