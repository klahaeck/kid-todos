import type { Collection, Document, WithId } from "mongodb";
import { randomBytes } from "crypto";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import type {
  HouseholdInviteDoc,
  HouseholdInvitePendingDTO,
  HouseholdMemberDoc,
  HouseholdMemberDTO,
} from "@/lib/types";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function membersCol(): Promise<Collection<HouseholdMemberDoc & Document>> {
  return getDb().then((db) => db.collection("household_members"));
}

function invitesCol(): Promise<Collection<HouseholdInviteDoc & Document>> {
  return getDb().then((db) => db.collection("household_invites"));
}

export function normalizeHouseholdEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function getHouseholdOwnerForMember(
  memberClerkId: string,
): Promise<string | null> {
  await ensureIndexes();
  const c = await membersCol();
  const row = await c.findOne({ memberClerkId });
  return row?.ownerClerkId ?? null;
}

export async function countMembersForOwner(ownerClerkId: string): Promise<number> {
  await ensureIndexes();
  const c = await membersCol();
  return c.countDocuments({ ownerClerkId });
}

export async function listMemberRowsForOwner(
  ownerClerkId: string,
): Promise<WithId<HouseholdMemberDoc>[]> {
  await ensureIndexes();
  const c = await membersCol();
  return c.find({ ownerClerkId }).sort({ joinedAt: 1 }).toArray();
}

export async function findActivePendingInviteForOwnerEmail(
  ownerClerkId: string,
  emailNormalized: string,
): Promise<WithId<HouseholdInviteDoc> | null> {
  await ensureIndexes();
  const c = await invitesCol();
  const now = new Date();
  return c.findOne({
    ownerClerkId,
    emailNormalized,
    expiresAt: { $gt: now },
    revokedAt: { $exists: false },
    redeemedAt: { $exists: false },
  });
}

export async function listPendingInvitesForOwner(
  ownerClerkId: string,
): Promise<WithId<HouseholdInviteDoc>[]> {
  await ensureIndexes();
  const c = await invitesCol();
  const now = new Date();
  return c
    .find({
      ownerClerkId,
      revokedAt: { $exists: false },
      redeemedAt: { $exists: false },
      expiresAt: { $gt: now },
    })
    .sort({ createdAt: -1 })
    .toArray();
}

function inviteToPendingDTO(doc: WithId<HouseholdInviteDoc>): HouseholdInvitePendingDTO {
  return {
    id: doc._id.toHexString(),
    emailNormalized: doc.emailNormalized,
    createdAt: doc.createdAt.toISOString(),
    expiresAt: doc.expiresAt.toISOString(),
  };
}

function memberToDTO(doc: WithId<HouseholdMemberDoc>): HouseholdMemberDTO {
  return {
    memberClerkId: doc.memberClerkId,
    joinedAt: doc.joinedAt.toISOString(),
  };
}

export async function insertHouseholdInvite(params: {
  ownerClerkId: string;
  emailNormalized: string;
}): Promise<{ token: string; inviteId: string }> {
  await ensureIndexes();
  const c = await invitesCol();
  const now = new Date();
  const token = newInviteToken();
  const doc: Omit<HouseholdInviteDoc, "_id"> = {
    token,
    ownerClerkId: params.ownerClerkId,
    emailNormalized: params.emailNormalized,
    createdAt: now,
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
  };
  const r = await c.insertOne(doc as HouseholdInviteDoc & Document);
  return { token, inviteId: r.insertedId.toHexString() };
}

export async function markInviteEmailFailed(token: string): Promise<void> {
  const c = await invitesCol();
  await c.updateOne({ token }, { $set: { emailFailedAt: new Date() } });
}

export async function deleteInviteByToken(token: string): Promise<void> {
  const c = await invitesCol();
  await c.deleteOne({ token });
}

export async function revokeInvite(ownerClerkId: string, inviteIdHex: string): Promise<boolean> {
  const { ObjectId } = await import("mongodb");
  await ensureIndexes();
  let id: InstanceType<typeof ObjectId>;
  try {
    id = new ObjectId(inviteIdHex);
  } catch {
    return false;
  }
  const c = await invitesCol();
  const r = await c.updateOne(
    {
      _id: id,
      ownerClerkId,
      redeemedAt: { $exists: false },
    },
    { $set: { revokedAt: new Date() } },
  );
  return r.modifiedCount > 0;
}

export async function getValidInviteByToken(
  token: string,
): Promise<WithId<HouseholdInviteDoc> | null> {
  if (!token?.trim()) return null;
  await ensureIndexes();
  const c = await invitesCol();
  const now = new Date();
  const doc = await c.findOne({
    token: token.trim(),
    expiresAt: { $gt: now },
    revokedAt: { $exists: false },
    redeemedAt: { $exists: false },
  });
  return doc;
}

export async function redeemInviteAndAddMember(params: {
  token: string;
  memberClerkId: string;
  emailNormalized: string;
}): Promise<
  | { ok: true; ownerClerkId: string }
  | { ok: false; error: string }
> {
  await ensureIndexes();
  const invite = await getValidInviteByToken(params.token);
  if (!invite) {
    return { ok: false, error: "This invite is invalid or has expired." };
  }
  if (invite.emailNormalized !== params.emailNormalized) {
    return {
      ok: false,
      error: "Sign in with the email address that received the invite.",
    };
  }
  if (invite.ownerClerkId === params.memberClerkId) {
    return { ok: false, error: "You cannot join your own household." };
  }

  const members = await membersCol();
  const existingMember = await members.findOne({ memberClerkId: params.memberClerkId });
  if (existingMember) {
    return {
      ok: false,
      error: "You are already a member of a household. Leave it before accepting another invite.",
    };
  }

  const invites = await invitesCol();
  const now = new Date();

  const markRedeemed = await invites.findOneAndUpdate(
    {
      _id: invite._id,
      redeemedAt: { $exists: false },
      revokedAt: { $exists: false },
      expiresAt: { $gt: now },
    },
    { $set: { redeemedAt: now } },
    { returnDocument: "after" },
  );
  if (!markRedeemed) {
    return { ok: false, error: "This invite has already been used." };
  }

  try {
    await members.insertOne({
      ownerClerkId: invite.ownerClerkId,
      memberClerkId: params.memberClerkId,
      joinedAt: now,
    } as HouseholdMemberDoc & Document);
  } catch {
    await invites.updateOne({ _id: invite._id }, { $unset: { redeemedAt: "" } });
    return {
      ok: false,
      error: "Could not add you to the household. Try again or ask for a new invite.",
    };
  }

  return { ok: true, ownerClerkId: invite.ownerClerkId };
}

export async function removeMemberAsOwner(
  ownerClerkId: string,
  memberClerkId: string,
): Promise<boolean> {
  await ensureIndexes();
  const c = await membersCol();
  const r = await c.deleteOne({ ownerClerkId, memberClerkId });
  return r.deletedCount > 0;
}

export async function leaveHouseholdAsMember(memberClerkId: string): Promise<boolean> {
  await ensureIndexes();
  const c = await membersCol();
  const r = await c.deleteOne({ memberClerkId });
  return r.deletedCount > 0;
}

export function buildHouseholdOverviewForPrimary(
  ownerClerkId: string,
  memberRows: WithId<HouseholdMemberDoc>[],
  pending: WithId<HouseholdInviteDoc>[],
): import("@/lib/types").HouseholdOverviewDTO {
  return {
    role: "primary",
    members: memberRows.map(memberToDTO),
    pendingInvites: pending.map(inviteToPendingDTO),
  };
}

export function buildHouseholdOverviewForMember(
  ownerClerkId: string,
  memberRows: WithId<HouseholdMemberDoc>[],
): import("@/lib/types").HouseholdOverviewDTO {
  return {
    role: "member",
    ownerClerkId,
    members: memberRows.map(memberToDTO),
    pendingInvites: [],
  };
}
