import Link from "next/link";

export function AppFooter() {
  return (
    <footer
      data-app-chrome="footer"
      className="border-t border-border bg-background px-4 py-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Starry Steps
        </p>
        <nav className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Terms of Use
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
