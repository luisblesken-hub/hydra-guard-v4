import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-emerald-500">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Seite nicht gefunden
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Die gesuchte Seite existiert nicht oder du hast keinen Zugriff darauf.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          Zum Dashboard →
        </Link>
      </div>
    </div>
  );
}
