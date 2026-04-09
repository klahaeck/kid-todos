"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
  useUser,
} from "@clerk/nextjs";

const headerBtnPrimary =
  "rounded-xl border-2 border-black bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-[3px_3px_0_0_#0a0a0a] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

const headerBtnOutline =
  "rounded-xl border-2 border-black bg-card px-4 py-2 text-sm font-extrabold text-foreground shadow-[3px_3px_0_0_#0a0a0a] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:bg-brand-sun/40 hover:shadow-[2px_2px_0_0_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

export function AppHeader() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <header
      data-app-chrome="header"
      className="flex items-center justify-between gap-4 border-b-4 border-black bg-background px-4 py-3"
    >
      <Link
        href="/"
        className="font-heading text-lg font-extrabold tracking-tighter text-brand-ink"
      >
        <span aria-hidden className="mr-1 text-brand-lime">
          ★
        </span>
        starrysteps
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3">
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="rounded-full border-2 border-transparent px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-black hover:bg-brand-sun/50"
          >
            Dashboard
          </Link>
          <Link
            href="/routines"
            className="rounded-full border-2 border-transparent px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-black hover:bg-brand-sun/50"
          >
            Routines
          </Link>
          <Link
            href="/settings"
            className="rounded-full border-2 border-transparent px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-black hover:bg-brand-sun/50"
          >
            Settings
          </Link>
          {isLoaded && isAdmin ? (
            <Link
              href="/admin"
              className="rounded-full border-2 border-transparent px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-black hover:bg-brand-sun/50"
            >
              Admin
            </Link>
          ) : null}
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button type="button" className={headerBtnPrimary}>
              sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className={headerBtnOutline}>
              sign up
            </button>
          </SignUpButton>
        </Show>
      </nav>
    </header>
  );
}
