import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

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
  sanierer: [{ href: "/dashboard/sanierer", label: "Meine Aufträge" }],
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
}: {
  role: string | null;
  email: string;
}) {
  const navItems = ROLE_NAV[role ?? "owner"] ?? ROLE_NAV["owner"];

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-500"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3C8 8 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-6-8-11z"
              />
            </svg>
            HydraGuard
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-xs font-medium text-slate-700">{email}</span>
            <span className="text-xs text-slate-400">
              {role ? ROLE_LABEL[role] ?? role : ""}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
