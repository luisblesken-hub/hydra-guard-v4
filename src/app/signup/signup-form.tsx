"use client";

import { useActionState } from "react";
import { signupAction, type SignupFormState } from "./actions";

const initialState: SignupFormState = {};

type Props = {
  defaultRole?: "owner" | "sanierer" | "versicherung";
};

export function SignupForm({ defaultRole = "owner" }: Props) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <div className="flex min-h-screen flex-col bg-hg-canvas">
      <header className="border-b border-hg-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-hg-accent text-[10px] font-bold text-white">
            HG
          </span>
          <span className="hg-display text-base font-semibold text-hg-ink">
            HydraGuard
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-hg-line bg-white p-8">
          <p className="hg-kicker">Zugang</p>
          <h1 className="mt-2 text-xl font-semibold text-hg-ink">Registrierung</h1>
          <p className="mt-1 text-sm text-slate-600">
            Legen Sie ein Konto an, um HydraGuard zu nutzen.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-medium text-slate-700">
                Vollständiger Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className="hg-input mt-1"
                required
              />
              {state.fieldErrors?.full_name && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.full_name[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700">
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
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="hg-input mt-1"
                required
              />
              {state.fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="role_choice" className="block text-xs font-medium text-slate-700">
                Rolle
              </label>
              <select
                id="role_choice"
                name="role_choice"
                className="hg-input mt-1"
                defaultValue={defaultRole}
                required
              >
                <option value="owner">Hausverwaltung / Vermieter</option>
                <option value="sanierer">Sanierungsbetrieb</option>
                <option value="versicherung">Versicherung</option>
              </select>
              {state.fieldErrors?.role_choice && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors.role_choice[0]}</p>
              )}
            </div>

            {state.message && (
              <p
                className={`text-sm font-medium ${
                  state.success ? "text-hg-steel" : "text-red-600"
                }`}
              >
                {state.message}
              </p>
            )}

            <button type="submit" disabled={pending} className="hg-btn-primary mt-2 w-full py-2.5">
              {pending ? "Wird angelegt…" : "Konto erstellen"}
            </button>
          </form>

          <p className="mt-5 text-xs text-slate-500">
            Bereits ein Konto?{" "}
            <a href="/login" className="font-medium text-hg-steel hover:underline">
              Zur Anmeldung
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
