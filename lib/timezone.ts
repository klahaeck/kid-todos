/** IANA timezone for the current runtime (browser or Node), when available. */
export function getLocalTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === "string" && tz.trim()) return tz.trim();
  } catch {
    /* ignore */
  }
  return "UTC";
}
