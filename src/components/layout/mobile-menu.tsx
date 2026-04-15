"use client";

import Link from "next/link";
import { useState } from "react";

type NavItem = { href: string; label: string };

export function MobileMenu({
  navItems,
  email,
  roleLabel,
}: {
  navItems: NavItem[];
  email: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 sm:hidden"
        aria-label="Menü öffnen"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{email}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Schließen"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-slate-200" />
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Profil
              </Link>
              <Link
                href="/hilfe"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Hilfe & FAQ
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
