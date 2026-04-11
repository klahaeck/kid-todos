"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { acceptHouseholdInviteAction } from "@/app/actions/household";
import { Button } from "@/components/ui/button";

function JoinHouseholdContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const accept = async () => {
    if (!token) return;
    setStatus("working");
    setMessage(null);
    const r = await acceptHouseholdInviteAction(token);
    if (!r.ok) {
      setStatus("error");
      setMessage(r.error);
      return;
    }
    setStatus("done");
    router.push("/dashboard");
    router.refresh();
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-foreground">Invalid invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link is missing a token. Open the link from your invite email, or
          ask the sender to invite you again.
        </p>
        <Link
          href="/settings"
          className="mt-6 inline-block font-semibold text-brand-grape underline"
        >
          Go to settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <h1 className="text-xl font-bold text-foreground">Join household</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with the same email the invite was sent to, then accept to share
        routines and the dashboard.
      </p>

      <Show when="signed-out">
        <div className="mt-8 flex flex-col items-center gap-4">
          <SignInButton mode="modal">
            <Button type="button" className="rounded-xl">
              Sign in to continue
            </Button>
          </SignInButton>
          <p className="text-xs text-muted-foreground">
            After signing in, stay on this page and tap Accept below.
          </p>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            type="button"
            className="rounded-xl"
            disabled={status === "working" || status === "done"}
            onClick={() => void accept()}
          >
            {status === "working"
              ? "Joining…"
              : status === "done"
                ? "Redirecting…"
                : "Accept invite"}
          </Button>
          {message ? (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </Show>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-brand-grape underline underline-offset-2">
          Home
        </Link>
      </p>
    </div>
  );
}

export default function JoinHouseholdPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      }
    >
      <JoinHouseholdContent />
    </Suspense>
  );
}
