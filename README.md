## Hydra Guard V4 – InsurTech B2B SaaS / KI-Clearing-Plattform (Leitungswasserschäden)

Dieses Projekt ist der eigenständige Produkt-Satellit **Hydra Guard V4**.  
Ziel: Eine KI-gestützte B2B-Clearing-Plattform für Leitungswasserschäden, die Versicherer, Hausverwaltungen und Sanierungsbetriebe verbindet und einen End‑to‑End‑Flow von Schadenmeldung über Triage & Pricing bis zur revisionssicheren Abrechnung abbildet.

- **Stack**: Next.js 15 (App Router, TypeScript strict) + Tailwind + shadcn/ui + Supabase (Postgres, Auth, RLS).
- **Rolle**: Satellit – strikt getrennt von der Ops-/Control-Plane „Motherboard“ (`core/` im Workspace, wird von diesem Projekt nicht berührt).
- **Quellen der Wahrheit** (im Workspace `c:\Users\julia\Desktop\MOTHERBOARD`):
  - `AGENT_CHAT_EXTRACTIONS.md` → Abschnitt 7.1 „Hydra-Guard V4“ (Produkt‑Spec, Markt, Architektur, UI‑Tokens).
  - `_SATELLITE_LAB/hydra-guard-core/master_migration_blueprint.md` → Supabase/Postgres‑Schema & RLS.
  - `_SATELLITE_LAB/hydra-guard-core/business_logic_vault.md` → zentrale Formeln & Pricing-/Triage‑Regeln.

## Lokale Entwicklung

Voraussetzungen:
- Node.js und npm installiert.
- Ein Supabase‑Projekt (EU-Region) mit eingespielter Hydra-Guard-Schema-Migration.

Entwicklung starten:

```bash
npm install
npm run dev
```

Danach ist das Hydra‑Guard‑MVP unter [http://localhost:3000](http://localhost:3000) erreichbar.

> Hinweis: Die eigentlichen Domain‑Modelle, Supabase‑Migrationen und Quad‑Agent‑Routen werden schrittweise entlang der oben genannten Specs implementiert.

### Erforderliche Umgebungsvariablen (Supabase)

Lege im Projekt eine `.env.local` an und setze mindestens:

```bash
NEXT_PUBLIC_SUPABASE_URL=deine_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key # nur serverseitig verwendet
```

Diese Variablen werden in `src/lib/env.ts` validiert und von den Supabase-Clients (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`) verwendet.
