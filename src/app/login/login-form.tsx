'use client';

import { useActionState } from 'react';
import { loginAction, type LoginFormState } from './actions';

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-50">Anmeldung</h1>
        <p className="mt-1 text-sm text-slate-400">
          Melde dich mit deiner E-Mail-Adresse und deinem Passwort an.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
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
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
              required
            />
            {state.fieldErrors?.password && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          {state.message && !state.success && (
            <p className="text-sm font-medium text-red-400">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-md bg-emerald-500 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Noch kein Konto?{' '}
          <a href="/signup" className="font-medium text-emerald-400 hover:underline">
            Jetzt registrieren
          </a>
        </p>
      </div>
    </div>
  );
}

