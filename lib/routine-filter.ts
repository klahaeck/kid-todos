import { formatTimeHmForLocaleInProfileZone } from "@/lib/format-time-hm";
import type { Routine } from "@/lib/types";

export type RoutineTab = "all" | "morning" | "evening" | "auto";

/** When a child has no saved start, the dashboard uses these. */
export const DEFAULT_CHILD_MORNING_START = "06:00";
export const DEFAULT_CHILD_EVENING_START = "18:00";

function parseHm(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Current clock time in `timezone` as minutes from midnight (for window checks). */
export function currentMinutesInTimezone(
  timezone: string,
  at: Date = new Date(),
): number {
  const tz = (timezone ?? "").trim() || "UTC";
  const date = at;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
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
      timeZone: tz,
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

export type RoutineTimezoneContext = {
  timezone: string;
};

export type ChildRoutineStarts = {
  morningStart: string | null;
  eveningStart: string | null;
};

function effectiveStarts(child?: ChildRoutineStarts | null): {
  morningStart: string;
  eveningStart: string;
} {
  return {
    morningStart: child?.morningStart ?? DEFAULT_CHILD_MORNING_START,
    eveningStart: child?.eveningStart ?? DEFAULT_CHILD_EVENING_START,
  };
}

/**
 * Morning vs evening from start times only (no fixed end times).
 * Morning: [morningStart, eveningStart). Evening: [eveningStart, 24:00) ∪ [0, morningStart).
 * If morningStart >= eveningStart (invalid ordering), falls back to default starts.
 */
export function routinePhaseFromStarts(
  nowMinutes: number,
  child?: ChildRoutineStarts | null,
): Routine[] {
  const { morningStart: mStr, eveningStart: eStr } = effectiveStarts(child);
  let m = parseHm(mStr);
  let e = parseHm(eStr);
  if (m >= e) {
    m = parseHm(DEFAULT_CHILD_MORNING_START);
    e = parseHm(DEFAULT_CHILD_EVENING_START);
  }
  const inMorning = nowMinutes >= m && nowMinutes < e;
  if (inMorning) return ["morning"];
  return ["evening"];
}

export function resolveRoutineFilter(
  tab: RoutineTab,
  profile: RoutineTimezoneContext,
  child?: ChildRoutineStarts | null,
  at: Date = new Date(),
): Routine[] | null {
  if (tab === "all") return null;
  if (tab === "morning") return ["morning"];
  if (tab === "evening") return ["evening"];
  const tz = profile.timezone;
  const now = currentMinutesInTimezone(tz, at);
  return routinePhaseFromStarts(now, child);
}

/** Heading for kid dashboard when using automatic time-of-day windows. */
export function autoRoutineHeading(
  profile: RoutineTimezoneContext,
  child?: ChildRoutineStarts | null,
): string {
  const r = resolveRoutineFilter("auto", profile, child);
  if (r === null) return "Today's tasks";
  return r[0] === "morning" ? "Morning" : "Evening";
}

export type ChildWindowOverrides = ChildRoutineStarts;

/** Effective morning/evening starts (per child); phase boundaries are the other start. */
export function effectiveRoutineWindows(
  _profile: RoutineTimezoneContext,
  child?: ChildWindowOverrides | null,
): {
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
} {
  const s = effectiveStarts(child);
  return {
    morningStart: s.morningStart,
    morningEnd: s.eveningStart,
    eveningStart: s.eveningStart,
    eveningEnd: s.morningStart,
  };
}

/** One-line summary for UI copy (per-child starts; each phase runs until the other start). */
export function routineWindowsSummary(
  profile: RoutineTimezoneContext,
  child?: ChildWindowOverrides | null,
): string {
  const s = effectiveStarts(child);
  const tz = profile.timezone?.trim() || "UTC";
  const fmt = (t: string) => formatTimeHmForLocaleInProfileZone(t, tz);
  return `Morning from ${fmt(s.morningStart)} until ${fmt(s.eveningStart)} · Evening from ${fmt(s.eveningStart)} until ${fmt(s.morningStart)}`;
}

/**
 * Kid dashboard: show morning or evening for that child from profile timezone and
 * that child's morning/evening start times (each phase runs until the other start).
 */
export function routinesVisibleForKidNow(
  profile: RoutineTimezoneContext,
  child?: ChildWindowOverrides | null,
  at: Date = new Date(),
): Routine[] {
  return resolveRoutineFilter("auto", profile, child ?? undefined, at) ?? [];
}

/**
 * When the user lacks Clerk `all_routines`, only evening tasks are shown or editable.
 * `filter` is the result of {@link resolveRoutineFilter} (`null` = show all routines).
 */
export function applyAllRoutinesFeatureGate(
  filter: Routine[] | null,
  hasAllRoutinesFeature: boolean,
): Routine[] | null {
  if (hasAllRoutinesFeature) return filter;
  if (filter === null) return ["evening"];
  const eveningOnly = filter.filter((r) => r === "evening");
  return eveningOnly.length > 0 ? eveningOnly : [];
}

/** Applies the same rule to an already-resolved list (e.g. kid dashboard auto windows). */
export function routineListAllRoutinesGate(
  routines: Routine[],
  hasAllRoutinesFeature: boolean,
): Routine[] {
  if (hasAllRoutinesFeature) return routines;
  return routines.filter((r) => r === "evening");
}

/** Short heading for the kid dashboard (auto mode uses start times only). */
export function kidRoutineHeading(
  profile: RoutineTimezoneContext,
  child?: ChildWindowOverrides | null,
  at: Date = new Date(),
): string {
  const resolved = resolveRoutineFilter("auto", profile, child ?? undefined, at);
  return resolved?.[0] === "morning" ? "Morning routine" : "Evening routine";
}
