import Link from "next/link";

export function AppFooter() {
  return (
    <footer
      data-app-chrome="footer"
      className="border-t border-border bg-background px-6 py-8 sm:px-8"
    >
      <div className="mx-auto flex max-w-[68rem] flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="font-sans text-sm font-medium text-muted-foreground">
          &copy; {new Date().getFullYear()} StarrySteps
        </p>
        <nav aria-label="Legal" className="flex gap-6">
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground inline-flex min-h-11 items-center underline-offset-4 hover:underline transition hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-muted-foreground inline-flex min-h-11 items-center underline-offset-4 hover:underline transition hover:text-foreground"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
