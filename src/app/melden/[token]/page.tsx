"use client";

import { use, useEffect, useMemo, useState } from "react";

type PropertyResponse = {
  id: string;
  label: string;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  unit_count: number | null;
};

export default function MeldeWizardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [unitLabel, setUnitLabel] = useState("");
  const [reporterName, setReporterName] = useState("");

  const [reportedCause, setReportedCause] = useState("");
  const [category, setCategory] = useState<
    "pipe_burst" | "appliance_leak" | "human_error" | "roof_leak" | "unknown"
  >("unknown");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPropertyLoading(true);
    setError(null);

    fetch(`/api/melden/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Objekt nicht gefunden.");
          }
          throw new Error("Objekt konnte nicht geladen werden.");
        }
        return res.json() as Promise<PropertyResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setProperty(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
      })
      .finally(() => {
        if (cancelled) return;
        setPropertyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const addressLine = useMemo(() => {
    if (!property) return "—";
    const street = property.street ?? "";
    const zip = property.postal_code ?? "";
    const city = property.city ?? "";
    return [street, zip && city ? zip : zip, city]
      .filter(Boolean)
      .join(" ");
  }, [property]);

  const canGoStep2 = unitLabel.trim().length > 0 && reporterName.trim().length > 0;

  async function handleSubmit() {
    if (isSubmitting) return;

    setError(null);

    if (selectedFiles.length === 0) {
      setError("Bitte mindestens ein Foto auswählen.");
      return;
    }
    if (reportedCause.trim().length === 0) {
      setError("Bitte kurz beschreiben, was passiert ist.");
      return;
    }

    try {
      setIsSubmitting(true);

      const submissionUuid = crypto.randomUUID();
      const storagePaths: string[] = [];

      for (let i = 0; i < selectedFiles.length; i += 1) {
        const file = selectedFiles[i];
        const body = new FormData();
        body.append("file", file);
        body.append("uuid", submissionUuid);

        const uploadRes = await fetch("/api/melden/upload", {
          method: "POST",
          body,
        });

        if (!uploadRes.ok) {
          const detail = await uploadRes.json().catch(() => null);
          throw new Error(
            `Foto-Upload fehlgeschlagen: ${detail?.error ?? uploadRes.statusText}`,
          );
        }

        const { storagePath } = (await uploadRes.json()) as { storagePath: string };
        storagePaths.push(storagePath);
      }

      const res = await fetch("/api/melden/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyToken: token,
          unitLabel,
          reporterName,
          description: reportedCause,
          category,
          photoStoragePaths: storagePaths,
        }),
      });

      if (!res.ok) {
        throw new Error("Übermittlung fehlgeschlagen.");
      }

      const json = (await res.json()) as {
        reportId: string;
        trackingToken?: string;
        ownerEmail?: string | null;
      };
      setReportId(json.reportId);
      setTrackingToken(json.trackingToken ?? null);
      setOwnerEmail(json.ownerEmail ?? null);
      setStep(4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (propertyLoading) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Schaden melden
        </h1>
        <p className="mt-2 text-sm text-slate-600">Objekt wird geladen…</p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Schaden melden
        </h1>
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          {error ?? "Objekt nicht gefunden."}
        </p>
      </main>
    );
  }

  const currentStep = step === 4 ? 3 : step;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="space-y-2">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-hg-ink text-[9px] font-bold text-white">
            HG
          </span>
          <span className="text-xs font-semibold tracking-tight text-hg-ink">
            HydraGuard
          </span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Schaden melden
        </h1>
        <p className="text-sm text-slate-600">
          {property.label}
          {addressLine ? ` · ${addressLine}` : ""}
        </p>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold ${
                  currentStep >= s
                    ? "bg-hg-ink text-white"
                    : "border border-slate-300 bg-white text-slate-500"
                }`}
              >
                {currentStep > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-px flex-1 ${
                    currentStep > s ? "bg-hg-ink" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </header>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {step === 1 && (
        <section className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">
            Schritt 1 von 3
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Wohneinheit
            </label>
            <input
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder='z.B. "EG links"'
              className="w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-hg-steel"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Name des Meldenden
            </label>
            <input
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-hg-steel"
            />
          </div>

          <button
            type="button"
            disabled={!canGoStep2}
            onClick={() => setStep(2)}
            className="w-full rounded-md bg-hg-steel px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Weiter
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">
            Schritt 2 von 3
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Was ist passiert?
            </label>
            <textarea
              value={reportedCause}
              onChange={(e) => setReportedCause(e.target.value)}
              placeholder="Kurz beschreiben, wann/wie es passiert ist…"
              rows={5}
              className="w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-hg-steel"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Vermutete Ursache
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as
                    | "pipe_burst"
                    | "appliance_leak"
                    | "human_error"
                    | "roof_leak"
                    | "unknown"
                )
              }
              className="w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-hg-steel"
            >
              <option value="unknown">Unbekannt / noch unklar</option>
              <option value="pipe_burst">Rohrbruch</option>
              <option value="appliance_leak">Haushaltsgerät (Waschmaschine etc.)</option>
              <option value="human_error">Menschliches Versehen</option>
              <option value="roof_leak">Dachleck</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Fotos hinzufügen
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files) {
                  setSelectedFiles([]);
                  return;
                }
                setSelectedFiles(Array.from(files));
              }}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-base file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-hg-steel file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-hg-steel"
            />
            {selectedFiles.length > 0 && (
              <p className="text-sm text-slate-600">
                {selectedFiles.length} Foto(s) ausgewählt
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-md bg-hg-steel px-4 py-3 text-base font-semibold text-white"
            >
              Weiter
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">
            Schritt 3 von 3
          </h2>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Zusammenfassung</p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Wohneinheit:</span>{" "}
                {unitLabel}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Meldender:</span>{" "}
                {reporterName}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Beschreibung:</span>{" "}
                {reportedCause}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Fotos:</span>{" "}
                {selectedFiles.length} Datei(en)
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full rounded-md bg-hg-ink px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sende… " : "Schaden melden"}
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900"
          >
            Bearbeiten
          </button>
        </section>
      )}

      {step === 4 && reportId && (
        <section className="mt-6 space-y-4 rounded-xl border border-hg-line bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-emerald-900">
            Vielen Dank!
          </h2>
          <p className="text-sm text-emerald-900">
            Ihre Meldung wurde übermittelt und in der Akte gespeichert.
            Die Hausverwaltung sieht den Fall im Dashboard.
          </p>
          {trackingToken && (
            <a
              href={`/status/${trackingToken}`}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Status dieser Meldung verfolgen →
            </a>
          )}
          <p className="text-xs text-emerald-900/80">
            Speichern Sie den Status-Link. Vorgangs-ID: {reportId.slice(0, 8)}…
          </p>
          {ownerEmail && (
            <a
              href={`mailto:${encodeURIComponent(ownerEmail)}?subject=${encodeURIComponent(
                "Wasserschaden gemeldet"
              )}&body=${encodeURIComponent(
                `Guten Tag,\n\nich habe soeben einen Wasserschaden gemeldet (${reporterName}, ${unitLabel}).\nBitte prüfen Sie den Fall in HydraGuard.\n\nMit freundlichen Grüßen`
              )}`}
              className="inline-flex w-full items-center justify-center rounded-md border border-hg-line bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 hover:bg-slate-100"
            >
              Optional: Hausverwaltung per E-Mail benachrichtigen
            </a>
          )}
        </section>
      )}
    </main>
  );
}

