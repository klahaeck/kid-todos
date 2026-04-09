import Link from "next/link";

export function AppFooter() {
  return (
    <footer
      data-app-chrome="footer"
      className="border-t-4 border-black bg-background px-4 py-8"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="font-sans text-sm font-bold text-muted-foreground">
          &copy; {new Date().getFullYear()} starrysteps
        </p>
        <nav className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm font-bold text-muted-foreground underline decoration-2 underline-offset-4 transition hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-bold text-muted-foreground underline decoration-2 underline-offset-4 transition hover:text-foreground"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
