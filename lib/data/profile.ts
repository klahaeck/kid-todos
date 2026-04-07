import type { Collection, Document, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import { DEFAULT_COLOR_THEME, normalizeColorTheme } from "@/lib/color-themes";
import {
  DEFAULT_DASHBOARD_FONT,
  normalizeDashboardFont,
} from "@/lib/dashboard-font-options";
import type { ProfileDoc, ProfileDTO } from "@/lib/types";

const DEFAULTS = {
  colorTheme: DEFAULT_COLOR_THEME,
  dashboardFont: DEFAULT_DASHBOARD_FONT,
  /** Empty until the user saves a zone from settings (UI defaults to device TZ). */
  timezone: "",
  morningStart: "06:00",
  morningEnd: "12:00",
  eveningStart: "17:00",
  eveningEnd: "21:00",
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
    timezone: p.timezone,
    morningStart: p.morningStart,
    morningEnd: p.morningEnd,
    eveningStart: p.eveningStart,
    eveningEnd: p.eveningEnd,
  };
}

export async function ensureProfileForClerkUser(
  clerkId: string,
): Promise<WithId<ProfileDoc>> {
  await ensureIndexes();
  const c = await col();
  const existing = await c.findOne({ clerkId });
  if (existing) return existing;
  const now = new Date();
  const doc: Omit<ProfileDoc, "_id"> = {
    clerkId,
    colorTheme: DEFAULTS.colorTheme,
    dashboardFont: DEFAULTS.dashboardFont,
    timezone: DEFAULTS.timezone,
    morningStart: DEFAULTS.morningStart,
    morningEnd: DEFAULTS.morningEnd,
    eveningStart: DEFAULTS.eveningStart,
    eveningEnd: DEFAULTS.eveningEnd,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await c.insertOne(doc as ProfileDoc & Document);
  const created = await c.findOne({ _id: insertedId });
  if (!created) throw new Error("Failed to create profile");
  return created;
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
    morningStart: string;
    morningEnd: string;
    eveningStart: string;
    eveningEnd: string;
  }>,
): Promise<WithId<ProfileDoc>> {
  await ensureIndexes();
  const c = await col();
  const profile = await ensureProfileForClerkUser(clerkId);
  await c.updateOne(
    { _id: profile._id },
    { $set: { ...patch, updatedAt: new Date() } },
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
