export function memberDisplayName(email: string | null): string {
  if (!email?.trim()) {
    return "Користувач";
  }
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function memberInitials(email: string | null): string {
  if (!email?.trim()) {
    return "?";
  }
  const local = email.split("@")[0] ?? email;
  const parts = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
