import type { Collection, Document, WithId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import type { HouseholdEntitlementsDoc } from "@/lib/types";

/** Same booleans as `ResolvedEntitlements` in subscription (avoid import cycle). */
export type HouseholdEntitlementSnapshot = {
  isMonthlySubscriber: boolean;
  hasMultipleChildrenFeature: boolean;
  hasAllRoutinesFeature: boolean;
  hasAllThemesFeature: boolean;
  hasMultipleUsersFeature: boolean;
};

function col(): Promise<Collection<HouseholdEntitlementsDoc & Document>> {
  return getDb().then((db) => db.collection("household_entitlements"));
}

export async function getHouseholdEntitlementsForOwner(
  ownerClerkId: string,
): Promise<WithId<HouseholdEntitlementsDoc> | null> {
  await ensureIndexes();
  const c = await col();
  return c.findOne({ ownerClerkId });
}

export function entitlementsDocToSnapshot(
  doc: HouseholdEntitlementsDoc,
): HouseholdEntitlementSnapshot {
  return {
    isMonthlySubscriber: doc.isMonthlySubscriber,
    hasMultipleChildrenFeature: doc.hasMultipleChildrenFeature,
    hasAllRoutinesFeature: doc.hasAllRoutinesFeature,
    hasAllThemesFeature: doc.hasAllThemesFeature,
    hasMultipleUsersFeature: doc.hasMultipleUsersFeature,
  };
}

export async function upsertHouseholdEntitlementsFromPrimary(
  ownerClerkId: string,
  ent: HouseholdEntitlementSnapshot,
): Promise<void> {
  await ensureIndexes();
  const c = await col();
  const now = new Date();
  await c.updateOne(
    { ownerClerkId },
    {
      $set: {
        ownerClerkId,
        isMonthlySubscriber: ent.isMonthlySubscriber,
        hasMultipleChildrenFeature: ent.hasMultipleChildrenFeature,
        hasAllRoutinesFeature: ent.hasAllRoutinesFeature,
        hasAllThemesFeature: ent.hasAllThemesFeature,
        hasMultipleUsersFeature: ent.hasMultipleUsersFeature,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}
