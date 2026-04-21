import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

function serverSecret(): string | null {
  return process.env.CONVEX_SERVER_SECRET?.trim() || null;
}

export async function convexGrantHouseholdAccess(
  memberClerkId: string,
  ownerClerkId: string,
): Promise<void> {
  const secret = serverSecret();
  if (!secret) return;
  await fetchMutation(api.householdSync.grantAccessFromServer, {
    secret,
    memberClerkId,
    ownerClerkId,
  });
}

export async function convexRevokeHouseholdAccess(
  memberClerkId: string,
  ownerClerkId: string,
): Promise<void> {
  const secret = serverSecret();
  if (!secret) return;
  await fetchMutation(api.householdSync.revokeAccessFromServer, {
    secret,
    memberClerkId,
    ownerClerkId,
  });
}

export async function convexSyncOwnerMembersFromMongo(
  ownerClerkId: string,
  memberClerkIds: string[],
): Promise<void> {
  const secret = serverSecret();
  if (!secret) return;
  await fetchMutation(api.householdSync.syncOwnerMembersFromServer, {
    secret,
    ownerClerkId,
    memberClerkIds,
  });
}
