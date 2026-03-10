'use client';

import { useActionState } from 'react';
import { signupAction, type SignupFormState } from './actions';

const initialState: SignupFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-50">Registrierung</h1>
        <p className="mt-1 text-sm text-slate-400">
          Erstelle ein Konto, um Hydra Guard zu nutzen.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block text-xs font-medium uppercase tracking-wide text-slate-300"
            >
              Vollständiger Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
              required
            />
            {state.fieldErrors?.full_name && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.full_name[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wide text-slate-300"
            >
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
              required
            />
            {state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide text-slate-300"
            >
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
              required
            />
            {state.fieldErrors?.password && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="role_choice"
              className="block text-xs font-medium uppercase tracking-wide text-slate-300"
            >
              Rolle
            </label>
            <select
              id="role_choice"
              name="role_choice"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
              defaultValue="owner"
              required
            >
              <option value="owner">Hausverwaltung / Vermieter</option>
              <option value="sanierer">Sanierungsbetrieb</option>
              <option value="insurance_agent">Versicherung</option>
            </select>
            {state.fieldErrors?.role_choice && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.role_choice[0]}</p>
            )}
          </div>

          {state.message && (
            <p
              className={`text-sm font-medium ${
                state.success ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-md bg-emerald-500 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? 'Wird angelegt…' : 'Konto erstellen'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Bereits ein Konto?{' '}
          <a href="/login" className="font-medium text-emerald-400 hover:underline">
            Zur Anmeldung
          </a>
        </p>
      </div>
    </div>
  );
}

