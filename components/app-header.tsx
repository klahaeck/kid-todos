"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
  useUser,
} from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const headerBtnPrimary =
  "rounded-xl border-2 border-black bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-[3px_3px_0_0_#0a0a0a] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

const headerBtnOutline =
  "rounded-xl border-2 border-black bg-card px-4 py-2 text-sm font-extrabold text-foreground shadow-[3px_3px_0_0_#0a0a0a] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:bg-brand-sun/40 hover:shadow-[2px_2px_0_0_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

const navLinkClass =
  "rounded-full border-2 border-transparent px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-black hover:bg-brand-sun/50";

const navLinkClassMobile =
  "block w-full rounded-xl border-2 border-black/10 bg-card px-4 py-3 text-center text-base font-bold text-foreground shadow-[2px_2px_0_0_#0a0a0a] transition hover:border-black hover:bg-brand-sun/40 active:translate-x-px active:translate-y-px active:shadow-none";

export function AppHeader() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      data-app-chrome="header"
      className="flex items-center justify-between gap-4 border-b-4 border-black bg-background px-4 py-3"
    >
      <Link
        href="/"
        className="min-w-0 shrink font-heading text-lg font-extrabold tracking-tighter text-brand-ink"
      >
        <span aria-hidden className="mr-1 text-brand-lime">
          ★
        </span>
        starrysteps
      </Link>

      <nav
        aria-label="Main"
        className="hidden items-center gap-2 md:flex md:gap-3"
      >
        <Show when="signed-in">
          <Link href="/dashboard" className={navLinkClass}>
            Dashboard
          </Link>
          <Link href="/routines" className={navLinkClass}>
            Routines
          </Link>
          <Link href="/settings" className={navLinkClass}>
            Settings
          </Link>
          {isLoaded && isAdmin ? (
            <Link href="/admin" className={navLinkClass}>
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

      <div className="flex items-center md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden />
          ) : (
            <Menu className="size-5" aria-hidden />
          )}
        </Button>

        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-[opacity,backdrop-filter] duration-150 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex justify-end p-0">
              <Dialog.Popup
                id="mobile-navigation"
                className={cn(
                  "flex h-full w-[min(100%,20rem)] flex-col border-l-4 border-black bg-background shadow-[4px_0_24px_rgba(0,0,0,0.12)] outline-none",
                  "data-ending-style:translate-x-4 data-ending-style:opacity-0 data-starting-style:translate-x-4 data-starting-style:opacity-0",
                  "transition-[transform,opacity] duration-200 ease-out",
                )}
              >
                <Dialog.Title className="sr-only">Main menu</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Site navigation and account actions
                </Dialog.Description>

                <div className="flex items-center justify-between border-b-4 border-black px-4 py-3">
                  <span className="font-heading text-base font-extrabold text-brand-ink">
                    Menu
                  </span>
                  <Dialog.Close
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                    )}
                    aria-label="Close menu"
                  >
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  <Show when="signed-in">
                    <div className="flex flex-col gap-2">
                      <Link href="/dashboard" className={navLinkClassMobile}>
                        Dashboard
                      </Link>
                      <Link href="/routines" className={navLinkClassMobile}>
                        Routines
                      </Link>
                      <Link href="/settings" className={navLinkClassMobile}>
                        Settings
                      </Link>
                      {isLoaded && isAdmin ? (
                        <Link href="/admin" className={navLinkClassMobile}>
                          Admin
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex justify-center border-t-2 border-dashed border-border pt-4">
                      <UserButton />
                    </div>
                  </Show>
                  <Show when="signed-out">
                    <div className="flex flex-col gap-3">
                      <SignInButton mode="modal">
                        <button
                          type="button"
                          className={cn(headerBtnPrimary, "w-full")}
                        >
                          sign in
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button
                          type="button"
                          className={cn(headerBtnOutline, "w-full")}
                        >
                          sign up
                        </button>
                      </SignUpButton>
                    </div>
                  </Show>
                </div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
