"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
  useUser,
} from "@clerk/nextjs";

export function AppHeader() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
      <Link
        href="/dashboard"
        className="text-lg font-semibold tracking-tight text-foreground"
      >
        Kid routines
      </Link>
      <nav className="flex items-center gap-3">
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/routines"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Routines
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
          {isLoaded && isAdmin ? (
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          ) : null}
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
            >
              Sign up
            </button>
          </SignUpButton>
        </Show>
      </nav>
    </header>
  );
}
