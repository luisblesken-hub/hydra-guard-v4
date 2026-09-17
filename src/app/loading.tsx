export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hg-line border-t-hg-ink" />
        <p className="text-sm text-slate-500">Wird geladen…</p>
      </div>
    </div>
  );
}
