/**
 * Merge class names — lightweight replacement for clsx + tailwind-merge.
 * Filters falsy values; no Tailwind dedup (not needed here since we don't
 * pass conflicting utility pairs at the same call site).
 */
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Format a number as Indian Rupee currency.
 * @param value   - number to format
 * @param compact - if true, abbreviate (₹12.3 Cr)
 */
export function formatCurrency(value: number, compact = false): string {
  if (!compact) {
    return new Intl.NumberFormat("en-IN", {
      style:    "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";

  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  }
  return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/**
 * Format a percentage value with sign.
 */
export function formatPercent(value: number, digits = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/**
 * Return Tailwind text-color class for a trend value.
 */
export function trendColor(value: number): string {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-ink-secondary";
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
