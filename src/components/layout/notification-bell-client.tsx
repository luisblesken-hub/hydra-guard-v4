"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export type BellEvent = {
  id: string;
  report_id: string;
  note: string | null;
  event_type: string;
  created_at: string;
};

export function NotificationBellClient({
  events,
  unreadCount,
  dashboardHref,
}: {
  events: BellEvent[];
  unreadCount: number;
  dashboardHref: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        title={`${unreadCount} aktuelle Ereignisse`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            Letzte Ereignisse
          </div>
          {events.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-500">Keine neuen Ereignisse.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {events.map((ev) => (
                <li key={ev.id} className="border-b border-slate-50 last:border-0">
                  <Link
                    href={`/claims/${ev.report_id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 hover:bg-slate-50"
                  >
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">
                      {ev.note || ev.event_type}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(ev.created_at))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-hg-steel hover:underline"
            >
              Zum Dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
