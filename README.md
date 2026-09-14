# HydraGuard V4

**Wasserschaden-Management für Eigentümer, Sanierer und Versicherer.**

Live: [hydra-guard-v4.vercel.app](https://hydra-guard-v4.vercel.app)

## Was es tut

End-to-End-Flow für Leitungswasserschäden:

1. **Melden** — öffentlich per QR/Token (`/melden/[token]`), ohne Login  
2. **Steuern** — Owner-Dashboard: Status, Fotos, Sanierer-Zuweisung, Mieter-Einladung  
3. **Sanieren** — Sanierer: Aufträge, Trocknungsprotokoll, Rechnung  
4. **Prüfen** — Versicherung: Fälle, Rechnungen, Freigabe/Zahlung, PDF-Export  

## Rollen

| Rolle | Dashboard |
|---|---|
| Eigentümer / HV | `/dashboard/owner` |
| Sanierer | `/dashboard/sanierer` |
| Versicherung | `/dashboard/insurance` |
| Admin | `/dashboard/admin` |

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind 4, shadcn/ui  
- **Backend:** Supabase (Postgres, Auth, RLS, Storage) — Region EU (Frankfurt)  
- **Deploy:** Vercel EU  

## Architektur (kurz)

```
Browser  →  Next.js (SSR + Route Handlers)
                ↓
         Supabase Auth (Cookies / @supabase/ssr)
                ↓
         Postgres + RLS   |   Storage (damage-photos, privat, Signed URLs)
```

- Serverseitige Admin-Queries nur über Service-Role (`src/lib/supabase/admin.ts`)  
- Öffentlicher Melde-Wizard nutzt Admin-Client gezielt (Token → Property)  
- Claim-Routing per Betrag: **Standard** (≤ 12.500 €) oder **Gutachter / outsourced** (> 12.500 €) 

## Repo-Struktur

```
src/app/           # App Router (Dashboards, Claims, Melden, API)
src/components/    # UI (Claims, Invoices, PDF, Nav)
src/lib/           # Auth, DB, Supabase-Clients
supabase/          # Migrations + _bootstrap_fresh.sql (frisches Schema)
```

## Status

MVP / Sprint 5+ — produktionsfähig für Demo und Feedback.  
Bekannte nächste Themen: Storage-Policies manuell prüfen, Rate-Limits härten, Feature-Tiefe je Rolle.

## Lokal (nur für Entwickler)

```bash
npm install
# .env.local mit NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Frische DB: `supabase/_bootstrap_fresh.sql` im Supabase SQL Editor.
