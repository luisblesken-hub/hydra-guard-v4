# HydraGuard — Backlog & Session-Stand

Stand: **17.09.2026** — Sprint Owner AI-Finding-Korrekturen

---

## Sprint 17.09.2026 #6 — Owner korrigiert Foto-/Claim-Findings

### Umgesetzt
- [x] Migration `0007_ai_finding_corrections.sql` (idempotent, RLS Owner CRUD)
- [x] Speichern: Tabelle + `activity_feed` mit strukturiertem `new_value` (`ai_finding_correction`)
- [x] Aggregate berücksichtigt Korrekturen (höheres Gewicht) + Claim-Blend
- [x] Lokale Gewichte aus Korrektur-Historie (`amount_mult_by_type`) — kein externes Training
- [x] UI: pro Foto „Finding korrigieren“ + Claim „System-Vorschlag korrigieren“
- [x] Claim-Health / Sync nutzen korrigierte Aggregate
- [x] `tsc` + `build` grün

### Ops
- Migration 0007 in Supabase SQL Editor ausführen (falls noch nicht applied)

---

## Zurückgestellt
- **OpenAI Vision Live** (`OPENAI_API_KEY` lokal+Vercel) — Code fertig, Key fehlt; nachholen wenn Key da

---

## Sprint 17.09.2026 #5 — OpenAI Vision verdrahten

### Env (belegt)
| Ort | `OPENAI_API_KEY` | `OPENAI_VISION_MODEL` |
|-----|------------------|------------------------|
| `.env.local` | ❌ fehlt (übersprungen) | optional (Default `gpt-4o-mini`) |
| Vercel Project Env | ❌ fehlt (nur Supabase-Keys) | optional |

**Aktivierung (wenn Key da):** `.env.local` + Vercel setzen → Redeploy → Upload / „Fotos erneut analysieren“ → `ai_analysis.source=vision`.

### Code
- [x] Vision robust + Heuristik-Fallback
- [x] UI KI vs System
- [x] Re-Analyse-Button, Health-Flag, `.env.example`
- [x] `tsc` + `build` grün
- [ ] Live `source=vision` — zurückgestellt (kein Key)

---

## Sprint 17.09.2026 #4 — Claim Health (Erkennen → Anzeigen → sichere Fixes)

### Live-Verifikation (localhost:3000, `owner@test.hydra.de`)
| Check | Ergebnis | Beleg |
|-------|----------|-------|
| Claim `0fbb3ede…` Systemprüfung | ✅ Warnung Foto-Schätzung 8.500 € vs 12.499 € | Panel „1 Warnung“ |
| Vorschlag übernehmen (Foto-Schätzung) | ✅ Betrag → 8.500 €, Panel „Keine Auffälligkeiten“, Activity-Log | Snapshot nach Klick |
| Claim `c7794a10…` ohne Fotos | ✅ Warnung „eingereicht, keine Fotos“; kein Fix-Button | submitted, 0 Fotos |
| Claim `29cfb0fe…` 15.000 € | ✅ Foto-Divergenz 9.700 € vs 15.000 €; Track bereits `out_of_scope` (kein False-Positive) | Detail |

### Umgesetzt
- [x] `assessClaimHealth(claimId)` unter `src/lib/ai/assess-claim-health.ts`
- [x] Findings: `severity` (`info`|`warn`|`error`), stabiler `code`, `message_de`, optional `suggestedFix`
- [x] Checks (echte Queries gegen `damage_reports` / `damage_photos` / `assignments` / `activity_feed`):
  - `PHOTO_ESTIMATE_DIVERGENCE` (≥100 € oder ≥20 %)
  - `STATUS_WITHOUT_ASSIGNMENT` (`dispatched` / `in_remediation` ohne Assignment)
  - `TIER_AMOUNT_MISMATCH` vs. `resolveClaimTier`
  - `STATUS_SCOPE_MISMATCH` (Status `out_of_scope` bei Betrag unter Schwelle)
  - `MISSING_PHOTOS` (submitted+ ohne Fotos)
  - `MISSING_MELDER_TAGS` (Melde-Claims ohne `[Melder:]`/`[Einheit:]`)
- [x] Claim-Detail Panel „Systemprüfung“
- [x] Sichere 1-Klick-Fixes (Owner/Admin, Activity-Log, kein Blind-Write):
  - Schätzung aus Foto-Aggregate (`apply_photo_estimate` → `syncClaimEstimateFromPhotos`)
  - `claim_tier` an `estimated_amount` (`align_claim_tier`)
- [x] `npx tsc --noEmit` + `npm run build` grün

### Nicht in diesem Sprint
- ~~Vision/OpenAI-Produktion~~ → Sprint #5 (Key fehlt noch)
- Reserve/Coverage, Reject-Reason, WhatsApp, Mieter-Roster
- Globales Redesign

---

## Sprint 17.09.2026 #3 — getestet + umgesetzt

### Live-Verifikation (Prod)
| Check | Ergebnis | Beleg |
|-------|----------|-------|
| Owner-Login → Dashboard | ✅ 6 Fälle, Stats, Melde-Links | Browser `owner@test.hydra.de` |
| Claim `0fbb3ede…` Detail | ✅ Foto + KI-Schätzung 8.500 € vs 12.499 € | Screenshot/Snapshot |
| Gutachten Versicherer PDF | ✅ `application/pdf`, ~55 KB, JPEG-Marker im Binary | `fetch` Status 200 |
| Gutachten Sanierer PDF (Owner) | ✅ ~55 KB mit JPEG | `fetch` |
| Gutachten Sanierer (als Sanierer) | ⚠️ 200 aber ~9 KB (ohne Bild) → Fix: alle Fotos + WebP-Fallback | gemessen |
| Owner „CSV Export“ (vor Fix) | ❌ lieferte JSON | `Content-Type: application/json` |
| Sanierer-Dashboard | ✅ 1 Auftrag, Maps-Link, Annehmen | Login `sanierer@test.hydra.de` |
| Melde-Wizard öffentlich | ✅ Objekt lädt, Schritt 1 | `/melden/f774…` |
| OpenPLZ PLZ→Ort | ✅ `52062` → Aachen | API-Call |

### Behoben in diesem Sprint (Code)
- [x] Owner CSV Export = echtes CSV (nicht Summary-JSON)
- [x] Melden `activity_feed`: `actor_role: "tenant"` + non-blocking (kein 500 nach Claim-Create)
- [x] PDF Track-Labels: `auto_track` / `out_of_scope` (nicht expert/standard)
- [x] PDF Status/Split/Scope auf Deutsch
- [x] `/claims`-Liste klickbar → Detail
- [x] Foto-Schätzung: Fehler sichtbar bei Übernahme
- [x] Status-Stepper: `approved` zeigt „Freigegeben“ statt „Eingereicht“
- [x] Sanierer Site-Card: Eigentümer-Mail + Melder/Einheit aus Beschreibung
- [x] PLZ→Ort Autocomplete (OpenPLZ, kein neues npm-Package) bei Objekt neu/edit
- [x] Melden-API Fehlertexte Deutsch + Sie-Form
- [x] Login/Empty-States Sie-Form
- [x] Sanierer-PDF: alle Fotos + Signed-URL-Fallback wenn Konvertierung scheitert

### Noch offen (belegt, nicht spekuliert)
| Prio | Item | Evidenz |
|------|------|---------|
| P1 | Kategorie/Dringlichkeit im Melden-Wizard | ✅ Kategorie (Ursache) | `melden/[token]` + submit API |
| P1 | Sanierer Reject-Reason Banner | offen | kein `reject_reason` Feld; Status-Text only |
| P1 | Insurer: Dokumente-nachfordern-Vorlage | ✅ mailto-Entwurf | `RequestDocumentsButton` |
| P1 | Insurer: Reserve/Coverage-Felder | offen | nicht in Schema/UI |
| P2 | WhatsApp-Deep-Link Verwaltung | kein `wa.me` in `src/` |
| P2 | Rechnungs-Suche nach Adresse | Insurer-Invoices nur Status-Filter |
| P2 | Equipment-Checkliste | nur Freitext `equipment_notes` |
| P2 | Mieter-Roster pro Objekt | nur Claim-Invites |
| P2 | Emoji-Cleanup Insurer/Admin | noch vorhanden |
| P2 | `database.types.ts` Drift (`full_name`, Rollen) | Types vs Live-DB |
| P2 | Dispatcher „Beauftragen“ disabled bis Radio gewählt | UI-Quirk beobachtet |
| P3 | Echte E-Mail-Zustellung (nicht nur mailto) | bewusst kein Server-Mail |
| P3 | `OPENAI_API_KEY` für Vision-Foto-KI | ⏸ zurückgestellt — Code fertig, Key fehlt (Sprint #5) |

---

## Rollen-Audit (gekürzt, Status nach Sprint #2/#3)

### Mieter
| Prio | Todo | Status |
|------|------|--------|
| P0 | Redirect → `/dashboard/mieter` | ✅ |
| P0 | Ehrliche Melde-Success-Copy | ✅ |
| P1 | Status-Seite Token | ✅ |
| P1 | Invite mailto + FAQ | ✅ |
| P2 | Kategorie/Dringlichkeit Melden | offen |
| P2 | WhatsApp-Deep-Link | offen |

### Versicherer
| Prio | Todo | Status |
|------|------|--------|
| P0 | Frühe Queue ab submitted | ✅ |
| P1 | Mobile Cards + Tabs | ✅ |
| P1 | Reserve/Coverage | offen |
| P1 | Dokumente nachfordern | ✅ mailto |

### Sanierer
| Prio | Todo | Status |
|------|------|--------|
| P0 | Doppeltes Termin-Formular | ✅ |
| P0 | Site-Card Kontakt/Zugang | ✅ (Mail + Melder/Einheit) |
| P1 | Heute-Agenda | ✅ |
| P1 | Reject-Reason Banner | offen |
| P1 | Maps-Link | ✅ |

### Eigentümer
| Prio | Todo | Status |
|------|------|--------|
| P0 | Objekt-anlegen Empty-State | ✅ |
| P1 | CSV Export echt | ✅ |
| P1 | Gutachten mit Fotos | ✅ (Prod verifiziert) |
| P1 | PLZ→Ort | ✅ |
| P1 | Claim-Health Systemprüfung | ✅ (Detail-Panel + sichere Fixes) |
| P1 | Foto-KI Vision verdrahtet | ⏸ Code fertig; Key zurückgestellt |
| P1 | Owner Finding-Korrekturen | ✅ Tabelle + Aggregate + UI (Migration 0007) |
| P2 | Mieter-Roster | offen |

---

## Geplant / Hygiene
- Collaborator Read-Rolle
- Service-Role rotieren falls exponiert
- Storage-Policies prüfen
- Types regenerieren (`supabase gen types`)
- Claim-Health: echte Vision + Feedback-Loop (User korrigiert → Heuristik)
