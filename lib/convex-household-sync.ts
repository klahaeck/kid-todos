import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getConvexServerSecret } from "@/lib/convex-server-secret";
import {
  finalizeHouseholdRevocations,
  getHouseholdAccessSnapshot,
} from "@/lib/data/household";

/** Pending removals remain in Mongo until this versioned snapshot is acknowledged. */
export async function convexSyncOwnerMembersFromMongo(ownerClerkId: string): Promise<void> {
  const secret = getConvexServerSecret();
  const snapshot = await getHouseholdAccessSnapshot(ownerClerkId);
  await fetchMutation(api.householdSync.syncOwnerMembersFromServer, {
    secret,
    ownerClerkId,
    revision: snapshot.revision,
    memberClerkIds: snapshot.memberClerkIds,
  });
  await finalizeHouseholdRevocations(snapshot);
}
