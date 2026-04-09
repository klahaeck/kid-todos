import { resolveTimeZone } from "@/lib/time-validation";

/** Calendar date YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string): string {
  const tz = resolveTimeZone(timezone);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
