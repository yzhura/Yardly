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

export function memberAvatarInitials(input: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}): string {
  const display = input.displayName?.trim();
  if (display) {
    const parts = display.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return display.slice(0, 2).toUpperCase();
  }

  const first = input.firstName?.trim();
  const last = input.lastName?.trim();
  if (first && last) {
    return (first[0] + last[0]).toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  if (last) {
    return last.slice(0, 2).toUpperCase();
  }

  return memberInitials(input.email);
}
