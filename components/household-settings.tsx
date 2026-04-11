"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import {
  createHouseholdInviteAction,
  getHouseholdOverviewAction,
  getHouseholdPrimaryLabelAction,
  leaveHouseholdAction,
  removeHouseholdMemberAction,
  revokeHouseholdInviteAction,
} from "@/app/actions/household";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function HouseholdSettings({
  hasMultipleUsersFeature,
  isPrimary,
}: {
  hasMultipleUsersFeature: boolean;
  isPrimary: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: queryKeys.household,
    queryFn: async () => {
      const r = await getHouseholdOverviewAction();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });

  const primaryLabelQuery = useQuery({
    queryKey: queryKeys.householdPrimaryLabel,
    queryFn: async () => {
      const r = await getHouseholdPrimaryLabelAction();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: !isPrimary,
  });

  const invalidateHouseholdData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.household });
    queryClient.invalidateQueries({ queryKey: queryKeys.householdPrimaryLabel });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    queryClient.invalidateQueries({ queryKey: queryKeys.profile });
  };

  const inviteMut = useMutation({
    mutationFn: async (email: string) => {
      const r = await createHouseholdInviteAction({ email });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      setInviteEmail("");
      setInviteMessage("Invite sent. They can join from the email link.");
      invalidateHouseholdData();
    },
    onError: (e: Error) => {
      setInviteMessage(e.message);
    },
  });

  const revokeMut = useMutation({
    mutationFn: async (inviteId: string) => {
      const r = await revokeHouseholdInviteAction(inviteId);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => invalidateHouseholdData(),
  });

  const removeMut = useMutation({
    mutationFn: async (memberClerkId: string) => {
      const r = await removeHouseholdMemberAction(memberClerkId);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => invalidateHouseholdData(),
  });

  const leaveMut = useMutation({
    mutationFn: async () => {
      const r = await leaveHouseholdAction();
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => {
      invalidateHouseholdData();
      router.refresh();
    },
  });

  if (overviewQuery.isLoading) {
    return (
      <section className="border-t border-border px-6 pt-10 pb-6">
        <p className="text-sm text-muted-foreground">Loading household…</p>
      </section>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <section className="border-t border-border px-6 pt-10 pb-6">
        <p className="text-sm text-red-600">
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : "Could not load household"}
        </p>
      </section>
    );
  }

  const overview = overviewQuery.data;

  return (
    <section className="border-t border-border px-6 pt-10 pb-6">
      <h2 className="text-xl font-bold text-foreground">Household</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Share one dashboard and the same routines with another signed-in parent.
        Billing stays with the primary account.
      </p>

      {!isPrimary ? (
        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-foreground">
            You&apos;re viewing and editing{" "}
            <span className="font-semibold">
              {primaryLabelQuery.data?.label ?? "your household primary"}
            </span>
            &apos;s routines. Subscription and upgrades are managed by them.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            disabled={leaveMut.isPending}
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                !window.confirm(
                  "Leave this household? You’ll use your own account only until you join again.",
                )
              ) {
                return;
              }
              leaveMut.mutate();
            }}
          >
            {leaveMut.isPending ? "Leaving…" : "Leave household"}
          </Button>
          {leaveMut.isError ? (
            <p className="mt-2 text-sm text-red-600">
              {leaveMut.error instanceof Error
                ? leaveMut.error.message
                : "Something went wrong"}
            </p>
          ) : null}
        </div>
      ) : null}

      {isPrimary ? (
        <>
          {!hasMultipleUsersFeature ? (
            <p className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Inviting another parent requires the{" "}
              <span className="font-medium text-foreground">multiple_users</span>{" "}
              feature on your subscription.{" "}
              <Link
                href="/upgrade"
                className="font-semibold text-brand-grape underline underline-offset-2"
              >
                View plans
              </Link>
            </p>
          ) : (
            <form
              className="mt-6 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setInviteMessage(null);
                const email = inviteEmail.trim();
                if (!email) return;
                inviteMut.mutate(email);
              }}
            >
              <Label htmlFor="household-invite-email" className="text-muted-foreground">
                Invite by email
              </Label>
              <p className="text-xs text-muted-foreground">
                They must sign in with this exact email to accept. We&apos;ll send
                one message with a secure link.
              </p>
              <input
                id="household-invite-email"
                type="email"
                autoComplete="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="parent@example.com"
                className="h-auto w-full min-w-0 rounded-xl border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={inviteMut.isPending || !inviteEmail.trim()}
                >
                  {inviteMut.isPending ? "Sending…" : "Send invite"}
                </Button>
              </div>
              {inviteMessage ? (
                <p
                  className={`text-sm ${inviteMessage.startsWith("Upgrade") || inviteMessage.includes("not configured") ? "text-amber-700" : "text-muted-foreground"}`}
                >
                  {inviteMessage}
                </p>
              ) : null}
              {inviteMut.isError ? (
                <p className="text-sm text-red-600">
                  {inviteMut.error instanceof Error
                    ? inviteMut.error.message
                    : "Invite failed"}
                </p>
              ) : null}
            </form>
          )}

          {overview.pendingInvites.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground">
                Pending invites
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {overview.pendingInvites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {inv.emailNormalized}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      disabled={revokeMut.isPending}
                      onClick={() => revokeMut.mutate(inv.id)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {overview.members.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground">Members</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {overview.members.map((m) => (
                  <li
                    key={m.memberClerkId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      Co-parent{" "}
                      <span className="font-mono text-xs">
                        …{m.memberClerkId.slice(-8)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      disabled={removeMut.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Remove this person from your household? They will lose access to shared routines.",
                          )
                        ) {
                          return;
                        }
                        removeMut.mutate(m.memberClerkId);
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      {!isPrimary ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Wrong account?{" "}
          <SignInButton mode="modal">
            <button
              type="button"
              className="font-medium text-brand-grape underline underline-offset-2"
            >
              Switch account
            </button>
          </SignInButton>
        </p>
      ) : null}
    </section>
  );
}
