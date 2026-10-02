import { parseTimeHm } from "@/lib/time-validation";

/** Stored HH:mm is a wall-clock label, independent of any date or DST transition. */
export function formatTimeHmForLocaleInProfileZone(
  hm: string,
  _profileTimezone: string,
  locale?: string,
): string {
  const parsed = parseTimeHm(hm);
  if (!parsed) return hm;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, parsed.hour, parsed.minute)));
}
