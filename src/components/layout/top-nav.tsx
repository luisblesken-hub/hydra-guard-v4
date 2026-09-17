import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "./notification-bell";
import { MobileMenu } from "./mobile-menu";

const ROLE_LABEL: Record<string, string> = {
  owner: "Eigentümer",
  sanierer: "Sanierer",
  versicherung: "Versicherung",
  mieter: "Mieter",
  admin: "Admin",
};

const ROLE_NAV: Record<string, { href: string; label: string }[]> = {
  owner: [
    { href: "/dashboard/owner", label: "Schadensfälle" },
    { href: "/claims/new", label: "Neuen Schaden melden" },
  ],
  sanierer: [
    { href: "/dashboard/sanierer", label: "Meine Aufträge" },
    { href: "/dashboard/sanierer/einstellungen", label: "Profil" },
  ],
  versicherung: [
    { href: "/dashboard/insurance", label: "Schadensfälle" },
    { href: "/dashboard/insurer", label: "Rechnungen" },
  ],
  mieter: [{ href: "/dashboard/mieter", label: "Mein Schaden" }],
  admin: [
    { href: "/dashboard/admin", label: "Admin" },
    { href: "/dashboard/owner", label: "Alle Fälle" },
  ],
};

export function TopNav({
  role,
  email,
  userId,
}: {
  role: string | null;
  email: string;
  userId?: string;
}) {
  const navItems = ROLE_NAV[role ?? "owner"] ?? ROLE_NAV["owner"];

  return (
    <nav className="sticky top-0 z-30 border-b border-hg-line bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-hg-ink hover:text-hg-steel"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-hg-ink text-[10px] font-bold tracking-wide text-white">
              HG
            </span>
            HydraGuard
          </Link>
          <div className="hidden items-center gap-0.5 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-hg-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/hilfe"
            className="hidden rounded px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-hg-ink sm:inline-flex"
          >
            Hilfe
          </Link>
          {userId && <NotificationBell role={role} userId={userId} />}
          <Link
            href="/profile"
            className="hidden flex-col items-end leading-tight sm:flex"
            title="Profil anzeigen"
          >
            <span className="text-xs font-medium text-slate-800">{email}</span>
            <span className="text-[11px] text-slate-500">
              {role ? ROLE_LABEL[role] ?? role : ""}
            </span>
          </Link>
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
          <MobileMenu
            navItems={navItems}
            email={email}
            roleLabel={role ? ROLE_LABEL[role] ?? role : ""}
          />
        </div>
      </div>
    </nav>
  );
}
