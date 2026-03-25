import type { Routine } from "@/lib/types";

export type RoutineTab = "all" | "morning" | "evening" | "auto";

function parseHm(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Current clock time in `timezone` as minutes from midnight (for window checks). */
export function currentMinutesInTimezone(timezone: string): number {
  const date = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = parseInt(
      parts.find((p) => p.type === "hour")?.value ?? "",
      10,
    );
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "",
      10,
    );
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      return hour * 60 + minute;
    }
  } catch {
    /* fall through */
  }
  try {
    const s = date.toLocaleTimeString("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const match = s.match(/(\d{1,2})\D+(\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (!Number.isNaN(h) && !Number.isNaN(m)) return h * 60 + m;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function inWindow(
  now: number,
  start: string,
  end: string,
): boolean {
  const a = parseHm(start);
  const b = parseHm(end);
  if (a <= b) return now >= a && now <= b;
  return now >= a || now <= b;
}

export function resolveRoutineFilter(
  tab: RoutineTab,
  profile: {
    timezone: string;
    morningStart: string;
    morningEnd: string;
    eveningStart: string;
    eveningEnd: string;
  },
  child?: {
    morningStart: string | null;
    morningEnd: string | null;
    eveningStart: string | null;
    eveningEnd: string | null;
  } | null,
): Routine[] | null {
  if (tab === "all") return null;
  if (tab === "morning") return ["morning"];
  if (tab === "evening") return ["evening"];
  const tz = profile.timezone;
  const now = currentMinutesInTimezone(tz);
  const mStart = child?.morningStart ?? profile.morningStart;
  const mEnd = child?.morningEnd ?? profile.morningEnd;
  const eStart = child?.eveningStart ?? profile.eveningStart;
  const eEnd = child?.eveningEnd ?? profile.eveningEnd;
  const inM = inWindow(now, mStart, mEnd);
  const inE = inWindow(now, eStart, eEnd);
  if (inM && !inE) return ["morning"];
  if (inE && !inM) return ["evening"];
  if (inM && inE) return ["morning", "evening"];
  return null;
}

/** Heading for kid dashboard when using automatic time-of-day windows. */
export function autoRoutineHeading(
  profile: {
    timezone: string;
    morningStart: string;
    morningEnd: string;
    eveningStart: string;
    eveningEnd: string;
  },
  child?: {
    morningStart: string | null;
    morningEnd: string | null;
    eveningStart: string | null;
    eveningEnd: string | null;
  } | null,
): string {
  const r = resolveRoutineFilter("auto", profile, child);
  if (r === null) return "Today's tasks";
  if (r.length === 2) return "Morning & evening";
  return r[0] === "morning" ? "Morning routine" : "Evening routine";
}

export type ProfileWindows = {
  timezone: string;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
};

export type ChildWindowOverrides = {
  morningStart: string | null;
  morningEnd: string | null;
  eveningStart: string | null;
  eveningEnd: string | null;
};

/** Effective morning/evening windows (child overrides, else profile). */
export function effectiveRoutineWindows(
  profile: ProfileWindows,
  child?: ChildWindowOverrides | null,
): {
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
} {
  return {
    morningStart: child?.morningStart ?? profile.morningStart,
    morningEnd: child?.morningEnd ?? profile.morningEnd,
    eveningStart: child?.eveningStart ?? profile.eveningStart,
    eveningEnd: child?.eveningEnd ?? profile.eveningEnd,
  };
}

/** One-line summary of windows for UI copy (uses routine settings + per-child overrides). */
export function routineWindowsSummary(
  profile: ProfileWindows,
  child?: ChildWindowOverrides | null,
): string {
  const w = effectiveRoutineWindows(profile, child);
  return `Morning ${w.morningStart}–${w.morningEnd} · Evening ${w.eveningStart}–${w.eveningEnd}`;
}

/**
 * Kid dashboard: only show morning and/or evening tasks when local time (profile timezone)
 * falls in the windows from routine settings (or per-child overrides). Outside both windows → none.
 */
export function routinesVisibleForKidNow(
  profile: ProfileWindows,
  child?: ChildWindowOverrides | null,
): Routine[] {
  const resolved = resolveRoutineFilter("auto", profile, child ?? undefined);
  if (resolved === null) return [];
  return resolved;
}

/** Short heading for the kid dashboard (never implies “all tasks” when outside windows). */
export function kidRoutineHeading(
  profile: ProfileWindows,
  child?: ChildWindowOverrides | null,
): string {
  const resolved = resolveRoutineFilter("auto", profile, child ?? undefined);
  if (resolved === null) return "Not routine time";
  if (resolved.length === 2) return "Morning & evening";
  return resolved[0] === "morning" ? "Morning routine" : "Evening routine";
}
