/** True if the value is an absolute http(s) URL (legacy full avatar URL). Aligned with API `isHttpAvatarReference`. */
export function isHttpAvatarReference(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
