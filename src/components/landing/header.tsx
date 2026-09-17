import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-hg-ink">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded bg-white text-[11px] font-bold tracking-wide text-hg-ink">
            HG
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">
            HydraGuard
          </span>
        </Link>
        <nav aria-label="Konto" className="flex items-center gap-2">
          <Link href="/login" className="hg-btn-outline-invert px-3 py-1.5 text-[13px] sm:px-3 sm:py-2 sm:text-sm">
            Anmelden
          </Link>
          <Link href="/signup" className="hg-btn-invert px-3 py-1.5 text-[13px] sm:px-3 sm:py-2 sm:text-sm">
            Registrieren
          </Link>
        </nav>
      </div>
    </header>
  );
}
