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
    <header
      data-app-chrome="header"
      className="flex items-center justify-between gap-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80"
    >
      <Link
        href="/"
        className="font-heading text-lg font-extrabold tracking-tight text-brand-twilight"
      >
        <span aria-hidden className="mr-1 text-brand-gold">
          ✦
        </span>
        StarrySteps
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3">
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/routines"
            className="rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Routines
          </Link>
          <Link
            href="/settings"
            className="rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Settings
          </Link>
          {isLoaded && isAdmin ? (
            <Link
              href="/admin"
              className="rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
              className="rounded-[1.25rem] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[0_4px_14px_rgba(36,59,107,0.12)] transition hover:brightness-[1.03]"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-[1.25rem] border border-brand-twilight/15 bg-card px-4 py-2 text-sm font-bold text-brand-twilight transition hover:border-brand-sky/40 hover:bg-brand-moon/60"
            >
              Sign up
            </button>
          </SignUpButton>
        </Show>
      </nav>
    </header>
  );
}
