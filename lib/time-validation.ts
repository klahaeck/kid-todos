export const DEFAULT_TIMEZONE = "UTC";

export function isValidIanaTimeZone(timezone: string): boolean {
  const tz = timezone.trim();
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function normalizeStoredTimeZone(
  timezone: string | null | undefined,
): string {
  if (typeof timezone !== "string") return "";
  const tz = timezone.trim();
  return isValidIanaTimeZone(tz) ? tz : "";
}

export function resolveTimeZone(
  timezone: string | null | undefined,
  fallback = DEFAULT_TIMEZONE,
): string {
  return normalizeStoredTimeZone(timezone) || fallback;
}

export function parseTimeHm(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

export function isValidTimeHm(value: string): boolean {
  return parseTimeHm(value) !== null;
}

export function timeHmToMinutes(value: string): number | null {
  const parsed = parseTimeHm(value);
  if (!parsed) return null;
  return parsed.hour * 60 + parsed.minute;
}
