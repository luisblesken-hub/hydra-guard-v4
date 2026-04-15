# HydraGuard V4 — Claude Context

Wasserschaden-Management SaaS. Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui, Supabase, Vercel EU.
User: Luis Blesken (luis.blesken@gmail.com), Aachen.

## Für neue Cowork-Sessions (Onboarding)

1. Ordner `C:\Users\luisb\Desktop\hydra-guard-v4` mounten (via `request_cowork_directory`)
2. Chrome-Extension verbinden — für lokale Iteration auf `http://localhost:3000`
3. User startet `npm run dev` lokal — dann sofort sichtbar ohne Deploy
4. Für Prod-Deploy: `scripts/deploy-remote.sh` nutzt GitHub PAT aus `.env.deploy`

## Stack

- **Framework**: Next.js 16.1.6, App Router, TypeScript strict
- **Styling**: Tailwind 4, shadcn/ui
- **Auth & DB**: Supabase (Postgres + Auth + RLS + Storage)
- **SSR**: `@supabase/ssr` für Cookie Handling
- **Admin**: Service Role Key via `src/lib/supabase/admin.ts`
- **Deploy**: Vercel EU, auto-deploy bei Push auf `main`
- **Repo**: `https://github.com/luisblesken-hub/hydra-guard-v4.git`

## Rollen-Architektur

- `owner` → `/dashboard/owner` — Eigentümer, sieht eigene Claims
- `sanierer` / `contractor` → `/dashboard/sanierer` — Dispatch + Drying Log
- `insurer` / `insurance` → `/dashboard/insurer` oder `/dashboard/insurance` — PDF Export
- `admin` → `/dashboard/admin`
- Öffentlich: `/melden/[token]` — Melde-Wizard ohne Login (QR-Code-Flow)

## Wichtige Dateien

- `src/lib/supabase/server.ts` — SSR Supabase Client (Cookie-basiert)
- `src/lib/supabase/admin.ts` — Service Role Client (kein RLS)
- `src/lib/supabase/client.ts` — Browser Client
- `src/types/database.types.ts` — generierte DB-Typen (nie manuell ändern)
- `src/lib/auth/get-user-redirect.ts` — Auth + Rollen-Check mit Redirect
- `src/app/api/` — Route Handlers
- `src/app/dashboard/` — Rollenspezifische Dashboards

## Harte Constraints

- **Keine neuen npm-Packages** ohne explizite Freigabe
- **Rückwärtskompatibilität** — keine Breaking Changes an DB-Schema / API-Routes
- **Build-Check immer**: `npx tsc --noEmit` zuerst, dann `npm run build`
- **Deutsche UX-Texte**, Code + Variablen Englisch
- **PowerShell**: nie `&&`, immer Einzelbefehle
- **RLS**: bei neuen Tabellen immer Row Level Security definieren

## Bekannte Pain Points

- **Auth-Redirect-Loops**: SSR Cookies + Rollenmapping sind fragil — immer `get-user-redirect.ts` nutzen
- **Schema-Drift**: DB-Spalten können anders heißen als erwartet — immer `database.types.ts` prüfen vor Queries
- **Next.js Route Handler Types**: `{ params }` muss `Promise<{...}>` sein in Next 15+
- **RLS-Debugging**: unter verschiedenen Rollen testen, Admin-Client für Bypasses

## Sprint 4 — Status: ✅ Abgeschlossen (15.04.2026)

1. ✅ **Invoice Flow** — submit/approve/reject/paid via Server Actions + UI-Komponenten
2. ✅ **confirmed_cause** im Sanierer-Dashboard + Bestätigung durch Sanierer via Action
3. ✅ **Tenant Read-Only View** — `/dashboard/mieter` + Token-basierte Einladung
4. ✅ **Insurance Agent Dashboard** — `/dashboard/insurance` + `/dashboard/insurer`

### Zusätzlich implementiert (Sprint 4+)

- **Landing Page** `/` für nicht-eingeloggte Nutzer
- **Shared TopNav** + **Mobile Hamburger-Menu** + **Profile + Help** Pages
- **Activity Feed** mit Auto-Logging in allen Server Actions
- **Notification-Bell** (Events der letzten 7 Tage, rollenbasiert)
- **Foto-Lightbox** mit Keyboard-Navigation
- **Drying-Log-Chart** (inline SVG Trend-Visualisierung)
- **CSV-Export** für Versicherer (alle Rechnungen)
- **PDF-Export rollenbasiert** (Admin-Bypass für Sanierer/Versicherung/Admin)
- **EXIF/GPS-Strip** für JPEG-Uploads (DSGVO)
- **Stats-Widgets** in allen Dashboards (Owner/Sanierer/Insurance/Insurer/Admin)
- **Sanierer-Dispatcher** (Owner weist Sanierer zu)
- **Assignment-Actions** (accept/in_progress/completed durch Sanierer)
- **Admin User-Management** + **Testnutzer-Button** + **Beispiel-Schaden-Button**
- **404/Error/Loading** Pages

## User-Arbeitsstil & Erwartungen

- **Build-getrieben**: Fix → `tsc --noEmit` → `npm run build` → erst dann "done"
- **Autonom**: Keine Rückfragen, klare Success Criteria, Verifikation am Ende
- **Minimal**: Keine neuen npm-Packages ohne explizite Freigabe; minimale File-Edits
- **Sprache**: Deutsche UX-Texte, Code + Variablen Englisch
- **Non-negotiables**: Keine Breaking Changes, RLS immer beachten, idempotente Migrations

## Bekannte Pain Points (priorisiert beachten)

- **Auth-Redirect-Loops**: SSR Cookies + Rollenmapping fragil → immer `get-user-redirect.ts` + Admin-Client nutzen
- **DB/Type-Drift**: Spalten können anders heißen als erwartet → immer `database.types.ts` prüfen vor Queries
- **Next.js Konventionen**: `{ params }` muss `Promise<{...}>` sein (Next 15+); `proxy.ts` statt `middleware.ts`
- **Schema-Begriffe**: `estimated_amount` = Schadenschätzung, `insurance_split` = abgeleitet (kein DB-Feld)

## Offene Risiken

- Supabase Access Token im Chat exponiert → **rotieren**
- EXIF/GPS-Strip: implementiert (JPEG APP0/APP1 entfernen), echter Test nötig
- RLS: `damage_reports`, `profiles`, `assignments`, `sanierer_invoices`, `activity_feed`, `damage_invitations`, `sanierer_pool_profiles` — alle mit Policies. Noch testen unter allen Rollen.
- **Storage Bucket `damage-photos`**: Policies müssen manuell im Supabase-Dashboard gesetzt werden (SQL-Migrations können Storage nicht konfigurieren). Empfehlung: nur authenticated uploads, kein public read.
- Public Wizard (`/melden/[token]`): Rate Limiting fehlt → vor Go-Live absichern.

## Autonomes Deployment

### Lokale Iteration (schnell, kein Deploy)
User startet `npm run dev` → Chrome auf `localhost:3000` → sofortiges Feedback.

### Prod-Deploy via GitHub
```bash
# .env.deploy anlegen (einmalig, wird nicht committed):
# GITHUB_TOKEN=ghp_xxxxxxxxxxxx

bash scripts/deploy-remote.sh "feat: beschreibung"
```

Das Script committed alle Änderungen + pusht auf main → Vercel deployt automatisch.

### Build-Check (aus Claude's Bash-Sandbox)
```bash
cd /sessions/trusting-optimistic-hamilton/mnt/hydra-guard-v4
npx tsc --noEmit
```

## Antwort-Pattern für Claude

- **Autonom ausführen** — kein Bestätigung abwarten
- **Build passes = done**: `tsc --noEmit` zuerst, dann `npm run build`
- **Klickbare Antwortmöglichkeiten** bei echten Entscheidungsfragen (AskUserQuestion)
- **Deutsch** für UX-Text-Vorschläge, Englisch für alles andere
- **Scope**: diese Session fasst nur Dateien an die nicht in einer anderen aktiven Session bearbeitet werden
