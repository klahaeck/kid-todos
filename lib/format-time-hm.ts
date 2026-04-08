import { todayInTimezone } from "@/lib/date";

function parseYmd(s: string): { y: number; m: number; d: number } | null {
  const parts = s.split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return { y, m, d };
}

/**
 * UTC instant for wall-clock `hm` (HH:mm) on `calendarDate` (YYYY-MM-DD) in `timeZone`.
 * Linear scan (~96h) is fine for occasional UI formatting; batch via memo in components.
 */
export function utcInstantForProfileWallClock(
  calendarDate: string,
  hm: string,
  timeZone: string,
): Date {
  const ymd = parseYmd(calendarDate);
  const hmParts = hm.split(":").map((x) => parseInt(x, 10));
  if (!ymd || hmParts.length !== 2 || hmParts.some((n) => Number.isNaN(n))) {
    return new Date();
  }
  const { y, m, d } = ymd;
  const [h, mi] = hmParts;
  const tz = timeZone.trim() || "UTC";
  const probe = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const start = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 48 * 60 * 60 * 1000;
  const end = Date.UTC(y, m - 1, d, 0, 0, 0, 0) + 48 * 60 * 60 * 1000;
  for (let t = start; t <= end; t += 60 * 1000) {
    const parts = Object.fromEntries(
      probe.formatToParts(new Date(t)).map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const py = parseInt(parts.year, 10);
    const pm = parseInt(parts.month, 10);
    const pd = parseInt(parts.day, 10);
    const ph = parseInt(parts.hour, 10);
    const pmi = parseInt(parts.minute, 10);
    if (py === y && pm === m && pd === d && ph === h && pmi === mi) {
      return new Date(t);
    }
  }
  return new Date(Date.UTC(y, m - 1, d, h, mi, 0));
}

/**
 * Formats stored `HH:mm` for display: same wall time in the profile timezone, with the
 * runtime locale’s preferred hour cycle (12h vs 24h from system/language settings).
 */
export function formatTimeHmForLocaleInProfileZone(
  hm: string,
  profileTimezone: string,
): string {
  const tz = profileTimezone.trim() || "UTC";
  const today = todayInTimezone(tz);
  const instant = utcInstantForProfileWallClock(today, hm, tz);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(instant);
}
