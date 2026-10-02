"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, Star, X } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
  useUser,
} from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const headerBtnPrimary = buttonVariants();
const headerBtnOutline = buttonVariants({ variant: "ghost" });
const navLinkClass =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-secondary aria-[current=page]:text-foreground";
const navLinkClassMobile =
  "block w-full rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted aria-[current=page]:bg-secondary";

export function AppHeader() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} pathname={pathname} />;
}

function HeaderContent({ pathname }: { pathname: string }) {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      data-app-chrome="header"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="StarrySteps home"
          className="flex shrink-0 items-center gap-2.5 font-heading text-xl font-bold tracking-tight text-brand-twilight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-twilight text-brand-gold">
            <Star className="size-5 fill-current" aria-hidden />
          </span>
          StarrySteps
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-2 md:flex md:gap-3"
        >
          <Show when="signed-in">
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={navLinkClass}
            >
              Dashboard
            </Link>
            <Link
              href="/routines"
              aria-current={pathname === "/routines" ? "page" : undefined}
              className={navLinkClass}
            >
              Routines
            </Link>
            <Link
              href="/settings"
              aria-current={pathname === "/settings" ? "page" : undefined}
              className={navLinkClass}
            >
              Settings
            </Link>
            {isLoaded && isAdmin ? (
              <Link
                href="/admin"
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={navLinkClass}
              >
                Admin
              </Link>
            ) : null}
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link href="/#how-it-works" className={navLinkClass}>
              How it works
            </Link>
            <Link href="/#our-approach" className={navLinkClass}>
              Our approach
            </Link>
            <SignInButton mode="modal">
              <button type="button" className={headerBtnOutline}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className={headerBtnPrimary}>
                Get started
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
                    "flex h-full w-[min(100%,20rem)] flex-col border-l border-border bg-background shadow-[4px_0_24px_rgba(0,0,0,0.12)] outline-none",
                    "data-ending-style:translate-x-4 data-ending-style:opacity-0 data-starting-style:translate-x-4 data-starting-style:opacity-0",
                    "transition-[transform,opacity] duration-200 ease-out",
                  )}
                >
                  <Dialog.Title className="sr-only">Main menu</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Site navigation and account actions
                  </Dialog.Description>

                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
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
                        <Link
                          href="/dashboard"
                          aria-current={
                            pathname === "/dashboard" ? "page" : undefined
                          }
                          className={navLinkClassMobile}
                          onClick={() => setMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/routines"
                          aria-current={
                            pathname === "/routines" ? "page" : undefined
                          }
                          className={navLinkClassMobile}
                          onClick={() => setMenuOpen(false)}
                        >
                          Routines
                        </Link>
                        <Link
                          href="/settings"
                          aria-current={
                            pathname === "/settings" ? "page" : undefined
                          }
                          className={navLinkClassMobile}
                          onClick={() => setMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        {isLoaded && isAdmin ? (
                          <Link
                            href="/admin"
                            aria-current={
                              pathname === "/admin" ? "page" : undefined
                            }
                            className={navLinkClassMobile}
                            onClick={() => setMenuOpen(false)}
                          >
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
                        <Link
                          href="/#how-it-works"
                          className={navLinkClassMobile}
                          onClick={() => setMenuOpen(false)}
                        >
                          How it works
                        </Link>
                        <Link
                          href="/#our-approach"
                          className={navLinkClassMobile}
                          onClick={() => setMenuOpen(false)}
                        >
                          Our approach
                        </Link>
                        <SignInButton mode="modal">
                          <button
                            type="button"
                            className={cn(headerBtnOutline, "w-full")}
                          >
                            Sign in
                          </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <button
                            type="button"
                            className={cn(headerBtnPrimary, "w-full")}
                          >
                            Get started
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
      </div>
    </header>
  );
}
