# HydraGuard — Backlog & Session-Stand

Stand: **17.09.2026** — Autonomer Test-Sprint (2h, zero-hallucination)

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
| P1 | Kategorie/Dringlichkeit im Melden-Wizard | `melden/[token]/page.tsx` nur unit/reporter/cause/photos |
| P1 | Sanierer Reject-Reason Banner | kein `reject_reason` Feld; Status-Text only |
| P1 | Insurer: Dokumente-nachfordern-Vorlage | keine Matches in `src/` |
| P1 | Insurer: Reserve/Coverage-Felder | nicht in Schema/UI |
| P2 | WhatsApp-Deep-Link Verwaltung | kein `wa.me` in `src/` |
| P2 | Rechnungs-Suche nach Adresse | Insurer-Invoices nur Status-Filter |
| P2 | Equipment-Checkliste | nur Freitext `equipment_notes` |
| P2 | Mieter-Roster pro Objekt | nur Claim-Invites |
| P2 | Emoji-Cleanup Insurer/Admin | noch vorhanden |
| P2 | `database.types.ts` Drift (`full_name`, Rollen) | Types vs Live-DB |
| P2 | Dispatcher „Beauftragen“ disabled bis Radio gewählt | UI-Quirk beobachtet |
| P3 | Echte E-Mail-Zustellung (nicht nur mailto) | bewusst kein Server-Mail |
| P3 | `OPENAI_API_KEY` für Vision-Foto-KI | Heuristik live |

---

## Rollen-Audit (gekürzt, Status nach Sprint #2/#3)

### Mieter
| Prio | Todo | Status |
|------|------|--------|
| P0 | Redirect → `/dashboard/mieter` | ✅ |
| P0 | Ehrliche Melden-Success-Copy | ✅ |
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
| P1 | Dokumente nachfordern | offen |

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
| P2 | Mieter-Roster | offen |

---

## Geplant / Hygiene
- Collaborator Read-Rolle
- Service-Role rotieren falls exponiert
- Storage-Policies prüfen
- Types regenerieren (`supabase gen types`)
