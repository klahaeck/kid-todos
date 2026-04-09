import type { Collection, Document, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import { DEFAULT_COLOR_THEME, normalizeColorTheme } from "@/lib/color-themes";
import {
  DEFAULT_DASHBOARD_FONT,
  normalizeDashboardFont,
} from "@/lib/dashboard-font-options";
import {
  DEFAULT_COMPLETED_TASK_ICON,
  normalizeCompletedTaskIcon,
} from "@/lib/completed-task-icon-options";
import type { ProfileDoc, ProfileDTO } from "@/lib/types";
import { normalizeStoredTimeZone } from "@/lib/time-validation";

const DEFAULTS = {
  colorTheme: DEFAULT_COLOR_THEME,
  dashboardFont: DEFAULT_DASHBOARD_FONT,
  completedTaskIcon: DEFAULT_COMPLETED_TASK_ICON,
  /** Empty until the user saves a zone from settings (UI defaults to device TZ). */
  timezone: "",
};

function col(): Promise<Collection<ProfileDoc & Document>> {
  return getDb().then((db) => db.collection("profiles"));
}

export function profileToDTO(p: WithId<ProfileDoc>): ProfileDTO {
  return {
    id: p._id.toHexString(),
    clerkId: p.clerkId,
    colorTheme: normalizeColorTheme(p.colorTheme),
    dashboardFont: normalizeDashboardFont(p.dashboardFont),
    completedTaskIcon: normalizeCompletedTaskIcon(p.completedTaskIcon),
    timezone: normalizeStoredTimeZone(p.timezone),
  };
}

export async function ensureProfileForClerkUser(
  clerkId: string,
): Promise<WithId<ProfileDoc>> {
  await ensureIndexes();
  const c = await col();
  const now = new Date();
  /** Upsert avoids E11000 when getProfile and updateProfile run concurrently (e.g. Strict Mode + AutoDefaultTimezone). */
  const doc = await c.findOneAndUpdate(
    { clerkId },
    {
      $setOnInsert: {
        clerkId,
        colorTheme: DEFAULTS.colorTheme,
        dashboardFont: DEFAULTS.dashboardFont,
        completedTaskIcon: DEFAULTS.completedTaskIcon,
        timezone: DEFAULTS.timezone,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) {
    const fallback = await c.findOne({ clerkId });
    if (!fallback) throw new Error("Failed to ensure profile");
    return fallback;
  }
  return doc;
}

export async function getProfileByClerkId(
  clerkId: string,
): Promise<WithId<ProfileDoc> | null> {
  await ensureIndexes();
  const c = await col();
  return c.findOne({ clerkId });
}

export async function updateProfileForUser(
  clerkId: string,
  patch: Partial<{
    colorTheme: string;
    dashboardFont: string;
    timezone: string;
  }>,
): Promise<WithId<ProfileDoc>> {
  await ensureIndexes();
  const c = await col();
  const profile = await ensureProfileForClerkUser(clerkId);
  const nextPatch = { ...patch };
  if ("timezone" in nextPatch) {
    nextPatch.timezone = normalizeStoredTimeZone(nextPatch.timezone);
  }
  await c.updateOne(
    { _id: profile._id },
    { $set: { ...nextPatch, updatedAt: new Date() } },
  );
  const next = await c.findOne({ _id: profile._id });
  if (!next) throw new Error("Profile not found");
  return next;
}

export async function listAllProfiles(): Promise<WithId<ProfileDoc>[]> {
  await ensureIndexes();
  const c = await col();
  return c.find({}).sort({ clerkId: 1 }).toArray();
}
