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
  "🌸",
  "🌊",
  "🍀",
  "🎨",
  "🧵",
  "🪡",
  "🧶",
  "🪢",
  "🧰",
  "🛠️",
  "📦",
  "🧭",
  "🧠",
  "💡",
  "🔭",
  "🪄",
  "🎈",
  "🎀",
  "🪴",
  "🌙",
  "🌈",
  "🍵",
  "🧊",
  "🐾",
  "🦋",
  "🐝",
  "🦉",
  "🐧",
  "🦦",
  "🐙",
] as const;

export function randomGreetingEmoji(): string {
  const idx = Math.floor(Math.random() * GREETING_EMOJIS.length);
  return GREETING_EMOJIS[idx]!;
}

/** First name for greeting; null if empty (then show profile hint). */
export function buildGreetingFirstName(firstName: string | null | undefined): string | null {
  const first = firstName?.trim() ?? "";
  return first.length > 0 ? first : null;
}
