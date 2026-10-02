import type { Collection, Document, WithId } from "mongodb";
import { randomBytes } from "crypto";
import { getDb, ensureIndexes, getMongoClient } from "@/lib/mongodb";
import { withHouseholdTransaction, type HouseholdState } from "@/lib/data/household-transaction";
import type {
  HouseholdInviteDoc,
  HouseholdInvitePendingDTO,
  HouseholdMemberDoc,
  HouseholdMemberDTO,
} from "@/lib/types";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function configuredLimit(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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
  const now = new Date();
  const token = newInviteToken();
  const doc: Omit<HouseholdInviteDoc, "_id"> = {
    token,
    ownerClerkId: params.ownerClerkId,
    emailNormalized: params.emailNormalized,
    createdAt: now,
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
  };
  return withHouseholdTransaction([params.ownerClerkId], async (db, session) => {
    const members = db.collection<HouseholdMemberDoc>("household_members");
    if (await members.findOne({ memberClerkId: params.ownerClerkId }, { session })) {
      throw new Error("Only the primary account can send invites.");
    }
    if (await members.countDocuments({ ownerClerkId: params.ownerClerkId }, { session }) >=
      configuredLimit("HOUSEHOLD_MAX_MEMBERS", 10)) {
      throw new Error("Your household already has the maximum number of members.");
    }
    const invites = db.collection<HouseholdInviteDoc>("household_invites");
    const pendingFilter = {
      ownerClerkId: params.ownerClerkId,
      expiresAt: { $gt: now },
      revokedAt: { $exists: false },
      redeemedAt: { $exists: false },
    };
    if (await invites.countDocuments(pendingFilter, { session }) >=
      configuredLimit("HOUSEHOLD_MAX_PENDING_INVITES", 20)) {
      throw new Error("Too many pending invites. Revoke some before sending more.");
    }
    if (await invites.findOne({ ...pendingFilter, emailNormalized: params.emailNormalized }, { session })) {
      throw new Error("An invite is already pending for that email address.");
    }
    const r = await invites.insertOne(doc as HouseholdInviteDoc, { session });
    return { token, inviteId: r.insertedId.toHexString() };
  });
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
  const invites = await invitesCol();
  const initial = await invites.findOne({ token: params.token.trim() });
  if (!initial) return { ok: false, error: "This invite is invalid or has expired." };

  return withHouseholdTransaction(
    [initial.ownerClerkId, params.memberClerkId],
    async (db, session) => {
      const inviteRows = db.collection<HouseholdInviteDoc>("household_invites");
      const invite = await inviteRows.findOne({ _id: initial._id }, { session });
      if (!invite || invite.emailNormalized !== params.emailNormalized) {
        return { ok: false as const, error: "Sign in with the email address that received the invite." };
      }
      if (invite.ownerClerkId === params.memberClerkId) {
        return { ok: false as const, error: "You cannot join your own household." };
      }
      const members = db.collection<HouseholdMemberDoc>("household_members");
      const existing = await members.findOne({ memberClerkId: params.memberClerkId }, { session });
      // A successful Mongo redemption can be retried after failed Convex synchronization.
      if (invite.redeemedByClerkId === params.memberClerkId &&
          existing?.ownerClerkId === invite.ownerClerkId &&
          existing.revocationRevision === undefined) {
        return { ok: true as const, ownerClerkId: invite.ownerClerkId };
      }
      const now = new Date();
      if (invite.revokedAt || invite.redeemedAt || invite.expiresAt <= now) {
        return { ok: false as const, error: "This invite is invalid or has expired." };
      }
      if (existing) {
        return { ok: false as const, error: "You are already a member of a household. Leave it before accepting another invite." };
      }
      if (await members.findOne({ memberClerkId: invite.ownerClerkId }, { session })) {
        return { ok: false as const, error: "The sender is no longer a household primary. Ask for a new invite." };
      }
      const ownedMember = await members.findOne({ ownerClerkId: params.memberClerkId }, { session });
      const ownedInvite = await inviteRows.findOne({
        ownerClerkId: params.memberClerkId,
        expiresAt: { $gt: now },
        revokedAt: { $exists: false },
        redeemedAt: { $exists: false },
      }, { session });
      const ownedChild = await db.collection("children").findOne({ userId: params.memberClerkId }, { session });
      if (ownedMember || ownedInvite || ownedChild) {
        return { ok: false as const, error: "Remove your own children, household members, and pending invites before joining another household." };
      }
      if (await members.countDocuments({ ownerClerkId: invite.ownerClerkId }, { session }) >=
          configuredLimit("HOUSEHOLD_MAX_MEMBERS", 10)) {
        return { ok: false as const, error: "This household has reached its member limit. Ask the primary to make room first." };
      }
      await inviteRows.updateOne({ _id: invite._id }, {
        $set: { redeemedAt: now, redeemedByClerkId: params.memberClerkId },
      }, { session });
      await members.insertOne({
        ownerClerkId: invite.ownerClerkId,
        memberClerkId: params.memberClerkId,
        joinedAt: now,
      } as HouseholdMemberDoc, { session });
      return { ok: true as const, ownerClerkId: invite.ownerClerkId };
    },
  );
}

/** Keep the row as a durable pending operation until Convex confirms revocation. */
export async function prepareHouseholdRevocation(ownerClerkId: string, memberClerkId: string): Promise<void> {
  await withHouseholdTransaction([ownerClerkId, memberClerkId], async (db, session, revisions) => {
    const members = db.collection<HouseholdMemberDoc>("household_members");
    const row = await members.findOne({ ownerClerkId, memberClerkId }, { session });
    if (row && row.revocationRevision === undefined) {
      await members.updateOne({ _id: row._id }, {
        $set: { revocationRevision: revisions.get(ownerClerkId)! },
      }, { session });
    }
  });
}

export type HouseholdAccessSnapshot = {
  ownerClerkId: string;
  revision: number;
  memberClerkIds: string[];
  revocations: { memberClerkId: string; revision: number }[];
};

/** Read members and their revision from the same Mongo snapshot. */
export async function getHouseholdAccessSnapshot(ownerClerkId: string): Promise<HouseholdAccessSnapshot> {
  await ensureIndexes();
  const db = await getDb();
  const session = (await getMongoClient()).startSession();
  try {
    return await session.withTransaction(async () => {
      const state = await db.collection<HouseholdState>("household_states").findOne({ _id: ownerClerkId }, { session });
      const rows = await db.collection<HouseholdMemberDoc>("household_members").find({ ownerClerkId }, { session }).toArray();
      return {
        ownerClerkId,
        revision: state?.revision ?? 0,
        memberClerkIds: rows.filter((m) => m.revocationRevision === undefined).map((m) => m.memberClerkId),
        revocations: rows.flatMap((m) => m.revocationRevision === undefined ? [] : [{ memberClerkId: m.memberClerkId, revision: m.revocationRevision }]),
      };
    }, { readConcern: { level: "snapshot" } });
  } finally {
    await session.endSession();
  }
}

export async function finalizeHouseholdRevocations(snapshot: HouseholdAccessSnapshot): Promise<void> {
  const members = await membersCol();
  for (const row of snapshot.revocations) {
    await members.deleteOne({
      ownerClerkId: snapshot.ownerClerkId,
      memberClerkId: row.memberClerkId,
      revocationRevision: row.revision,
    });
  }
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
