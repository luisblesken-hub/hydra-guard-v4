"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen flex-col bg-hg-canvas">
      <header className="border-b border-hg-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-hg-ink text-[10px] font-bold text-white">
            HG
          </span>
          <span className="text-sm font-semibold text-hg-ink">HydraGuard</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-hg-line bg-white p-8">
          <p className="hg-kicker">Zugang</p>
          <h1 className="mt-2 text-xl font-semibold text-hg-ink">Anmeldung</h1>
          <p className="mt-1 text-sm text-slate-600">
            Melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem Passwort an.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700"
              >
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="hg-input mt-1"
                required
              />
              {state.fieldErrors?.email && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700"
              >
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="hg-input mt-1"
                required
              />
              {state.fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>

            {state.message && !state.success && (
              <p className="text-sm font-medium text-red-600">{state.message}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="hg-btn-primary mt-2 w-full py-2.5"
            >
              {pending ? "Wird angemeldet…" : "Anmelden"}
            </button>
          </form>

          <p className="mt-5 text-xs text-slate-500">
            Noch kein Konto?{" "}
            <a
              href="/signup"
              className="font-medium text-hg-steel hover:underline"
            >
              Registrieren
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
