/** Format decimal string from API (e.g. "12.50") as UAH for display. */
export function formatUahFromDecimalString(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatVariantPriceRange(priceStrings: string[]): string {
  const nums = priceStrings.map((s) => Number(s)).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return "—";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    return formatUahFromDecimalString(String(min));
  }
  return `${formatUahFromDecimalString(String(min))} – ${formatUahFromDecimalString(String(max))}`;
}
