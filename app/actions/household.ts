"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { requireUserId, resolveHouseholdContext } from "@/lib/authz";
import { sendHouseholdInviteEmail } from "@/lib/email/household-invite";
import {
  buildHouseholdOverviewForMember,
  buildHouseholdOverviewForPrimary,
  countMembersForOwner,
  deleteInviteByToken,
  findActivePendingInviteForOwnerEmail,
  insertHouseholdInvite,
  leaveHouseholdAsMember,
  listMemberRowsForOwner,
  listPendingInvitesForOwner,
  markInviteEmailFailed,
  normalizeHouseholdEmail,
  redeemInviteAndAddMember,
  removeMemberAsOwner,
  revokeInvite,
} from "@/lib/data/household";
import { listChildrenForUser } from "@/lib/data/children";
import type { ActionResult, HouseholdOverviewDTO } from "@/lib/types";
import { hasMultipleUsersFeature } from "@/lib/subscription";
import {
  convexGrantHouseholdAccess,
  convexRevokeHouseholdAccess,
  convexSyncOwnerMembersFromMongo,
} from "@/lib/convex-household-sync";

const inviteBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

function householdMaxMembers(): number {
  const n = Number.parseInt(process.env.HOUSEHOLD_MAX_MEMBERS ?? "10", 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

function householdMaxPendingInvites(): number {
  const n = Number.parseInt(process.env.HOUSEHOLD_MAX_PENDING_INVITES ?? "20", 10);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

export async function getHouseholdOverviewAction(): Promise<
  ActionResult<HouseholdOverviewDTO>
> {
  try {
    const ctx = await resolveHouseholdContext();
    if (ctx.isPrimary) {
      const [memberRows, pending] = await Promise.all([
        listMemberRowsForOwner(ctx.dataOwnerId),
        listPendingInvitesForOwner(ctx.dataOwnerId),
      ]);
      await convexSyncOwnerMembersFromMongo(
        ctx.dataOwnerId,
        memberRows.map((m) => m.memberClerkId),
      );
      return {
        ok: true,
        data: buildHouseholdOverviewForPrimary(ctx.dataOwnerId, memberRows, pending),
      };
    }
    const memberRows = await listMemberRowsForOwner(ctx.dataOwnerId);
    return {
      ok: true,
      data: buildHouseholdOverviewForMember(ctx.dataOwnerId, memberRows),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function getHouseholdPrimaryLabelAction(): Promise<
  ActionResult<{ label: string }>
> {
  try {
    const ctx = await resolveHouseholdContext();
    if (ctx.isPrimary) {
      return { ok: true, data: { label: "" } };
    }
    const client = await clerkClient();
    const u = await client.users.getUser(ctx.dataOwnerId);
    const label =
      u.primaryEmailAddress?.emailAddress ??
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ??
      "Your household";
    return { ok: true, data: { label } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function createHouseholdInviteAction(
  raw: unknown,
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const ctx = await resolveHouseholdContext();
    if (!ctx.isPrimary) {
      return { ok: false, error: "Only the primary account can send invites." };
    }
    const parsed = inviteBodySchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
    }
    const emailNormalized = normalizeHouseholdEmail(parsed.data.email);
    const canInvite = await hasMultipleUsersFeature();
    if (!canInvite) {
      return {
        ok: false,
        error:
          "Upgrade required: adding household members needs the multiple_users feature on your subscription.",
      };
    }
    const memberCount = await countMembersForOwner(ctx.dataOwnerId);
    if (memberCount >= householdMaxMembers()) {
      return {
        ok: false,
        error: `Your household already has the maximum number of members (${householdMaxMembers()}).`,
      };
    }
    const pending = await listPendingInvitesForOwner(ctx.dataOwnerId);
    if (pending.length >= householdMaxPendingInvites()) {
      return {
        ok: false,
        error: "Too many pending invites. Revoke some before sending more.",
      };
    }
    const existingPending = await findActivePendingInviteForOwnerEmail(
      ctx.dataOwnerId,
      emailNormalized,
    );
    if (existingPending) {
      return {
        ok: false,
        error: "An invite is already pending for that email address.",
      };
    }

    const { token } = await insertHouseholdInvite({
      ownerClerkId: ctx.dataOwnerId,
      emailNormalized,
    });
    const send = await sendHouseholdInviteEmail({
      toEmail: parsed.data.email,
      token,
    });
    if (!send.ok) {
      await markInviteEmailFailed(token);
      await deleteInviteByToken(token);
      return { ok: false, error: send.error };
    }
    return { ok: true, data: { sent: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function revokeHouseholdInviteAction(
  inviteId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await resolveHouseholdContext();
    if (!ctx.isPrimary) {
      return { ok: false, error: "Only the primary account can revoke invites." };
    }
    const ok = await revokeInvite(ctx.dataOwnerId, inviteId);
    if (!ok) return { ok: false, error: "Invite not found or already used." };
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function removeHouseholdMemberAction(
  memberClerkId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await resolveHouseholdContext();
    if (!ctx.isPrimary) {
      return { ok: false, error: "Only the primary account can remove members." };
    }
    if (memberClerkId === ctx.dataOwnerId) {
      return { ok: false, error: "You cannot remove yourself this way." };
    }
    const ok = await removeMemberAsOwner(ctx.dataOwnerId, memberClerkId);
    if (!ok) return { ok: false, error: "Member not found." };
    await convexRevokeHouseholdAccess(memberClerkId, ctx.dataOwnerId);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function leaveHouseholdAction(): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await resolveHouseholdContext();
    if (ctx.isPrimary) {
      return { ok: false, error: "You are not a household member." };
    }
    const ownerClerkId = ctx.dataOwnerId;
    const ok = await leaveHouseholdAsMember(ctx.viewerId);
    if (!ok) return { ok: false, error: "Could not leave the household." };
    await convexRevokeHouseholdAccess(ctx.viewerId, ownerClerkId);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export async function acceptHouseholdInviteAction(
  token: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const viewerId = await requireUserId();
    const user = await currentUser();
    const primaryEmail = user?.primaryEmailAddress?.emailAddress;
    if (!primaryEmail?.trim()) {
      return {
        ok: false,
        error: "Your account needs a primary email address to accept an invite.",
      };
    }
    const emailNormalized = normalizeHouseholdEmail(primaryEmail);
    const ownedChildren = await listChildrenForUser(viewerId);
    if (ownedChildren.length > 0) {
      return {
        ok: false,
        error:
          "This account already has its own children and routines. Use a different account or remove existing data before joining a household.",
      };
    }
    const result = await redeemInviteAndAddMember({
      token: token.trim(),
      memberClerkId: viewerId,
      emailNormalized,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    await convexGrantHouseholdAccess(viewerId, result.ownerClerkId);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
