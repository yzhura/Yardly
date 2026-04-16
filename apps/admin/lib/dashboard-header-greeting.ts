const GREETING_EMOJIS = [
  "👋",
  "✨",
  "🌟",
  "🙂",
  "💫",
  "🌿",
  "☀️",
  "🎯",
  "🦊",
  "☕",
] as const;

/** Stable “random” emoji per user so the header does not flicker on re-render. */
export function greetingEmojiFromUserId(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return GREETING_EMOJIS[h % GREETING_EMOJIS.length]!;
}

/** First name for greeting; null if empty (then show profile hint). */
export function buildGreetingFirstName(firstName: string | null | undefined): string | null {
  const first = firstName?.trim() ?? "";
  return first.length > 0 ? first : null;
}
