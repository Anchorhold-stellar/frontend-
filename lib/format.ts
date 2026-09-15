/**
 * Adds thousands separators to a numeric-string amount. Amounts come from
 * the backend as plain numeric strings with no currency/decimal
 * conventions attached, so this only handles grouping — not units.
 */
export function formatAmount(amount: string | number): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  return num.toLocaleString();
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(isoString: string): string {
  const deltaSeconds = (new Date(isoString).getTime() - Date.now()) / 1000;
  const absSeconds = Math.abs(deltaSeconds);

  if (absSeconds < 60) return "just now";

  for (const [unit, secondsInUnit] of UNITS) {
    if (absSeconds >= secondsInUnit) {
      return rtf.format(Math.round(deltaSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(Math.round(deltaSeconds / 60), "minute");
}
