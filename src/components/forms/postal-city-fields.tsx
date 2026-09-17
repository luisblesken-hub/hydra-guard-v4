"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  postalName?: string;
  cityName?: string;
  defaultPostal?: string;
  defaultCity?: string;
  required?: boolean;
  postalError?: string;
  cityError?: string;
};

/**
 * PLZ → Ort via OpenPLZ (kein npm-Package). Füllt Stadt nur wenn leer oder
 * wenn die PLZ gerade geändert wurde.
 */
export function PostalCityFields({
  postalName = "postal_code",
  cityName = "city",
  defaultPostal = "",
  defaultCity = "",
  required = true,
  postalError,
  cityError,
}: Props) {
  const [postal, setPostal] = useState(defaultPostal);
  const [city, setCity] = useState(defaultCity);
  const [hint, setHint] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const cityTouched = useRef(Boolean(defaultCity));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!/^\d{5}$/.test(postal)) {
      setHint(null);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLooking(true);
    setHint(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(postal)}`,
          { signal: ac.signal, headers: { Accept: "application/json" } }
        );
        if (!res.ok) {
          setHint("PLZ konnte nicht geprüft werden.");
          return;
        }
        const data = (await res.json()) as Array<{ name?: string }>;
        const names = [
          ...new Set(
            (data ?? [])
              .map((d) => d.name?.trim())
              .filter((n): n is string => Boolean(n))
          ),
        ];
        if (names.length === 0) {
          setHint("Keine Orte zu dieser PLZ gefunden.");
          return;
        }
        if (!cityTouched.current || !city.trim()) {
          setCity(names[0]);
        }
        setHint(
          names.length === 1
            ? `Ort: ${names[0]}`
            : `Mögliche Orte: ${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}`
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setHint("PLZ-Lookup vorübergehend nicht erreichbar.");
        }
      } finally {
        setLooking(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [postal]);

  return (
    <>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Postleitzahl {required ? "*" : ""}
        <input
          type="text"
          name={postalName}
          required={required}
          pattern="\d{5}"
          maxLength={5}
          inputMode="numeric"
          placeholder="52062"
          value={postal}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 5);
            setPostal(v);
            cityTouched.current = false;
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {postalError && <p className="text-red-600">{postalError}</p>}
        {(looking || hint) && (
          <p className="text-[11px] text-slate-500">
            {looking ? "Ort wird ermittelt…" : hint}
          </p>
        )}
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Stadt {required ? "*" : ""}
        <input
          type="text"
          name={cityName}
          required={required}
          maxLength={100}
          placeholder="Aachen"
          value={city}
          onChange={(e) => {
            cityTouched.current = true;
            setCity(e.target.value);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {cityError && <p className="text-red-600">{cityError}</p>}
      </label>
    </>
  );
}
