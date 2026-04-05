const MAX_EMAIL_LENGTH = 254;

export function normalizeInviteEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    throw new Error("email_too_long");
  }
  return trimmed;
}
