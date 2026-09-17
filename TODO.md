# HydraGuard — Backlog & Session-Stand

Stand: **17.09.2026** — Rollen-Audit + UX-Sprint

---

## Rollen-Audit: Analog → App → „Beste App“

### 1) Mieter
**Analog:** Schaden entdecken → Fotos → HV anrufen → warten → Termin → Handwerker reinlassen → „wann trocken?“ → zurück zum Normal.
**Jetzt „nette App“:** Melden-Wizard, Read-only Status, Feuchtewerte, Sanierer-Mail/Termin.
**Damit „beste App“:** Sofort-Tracking ohne Chaos, klare Ansprechpartner (Name+Tel), Fortschritt wie DHL, ehrliche Infos, Fotos sehen, Login landet richtig.

| Prio | Todo |
|------|------|
| P0 | Redirect `mieter` → `/dashboard/mieter` |
| P0 | Ehrliche Melden-Success-Copy (kein Fake-„HV informiert“ ohne Mail) |
| P0 | `unit_label` + `reporter_name` persistieren |
| P1 | StatusStepper + Fotos (read-only) im Mieter-Dashboard |
| P1 | Owner/Sanierer Name + Telefon auf Mieter-Karte |
| P1 | Status-Seite nach Melden (Token) ohne Account |
| P1 | Echte Invite-Zustellung (mailto/Email) + FAQ korrigieren |
| P2 | Kategorie/Dringlichkeit im Melden-Wizard |
| P2 | WhatsApp-Deep-Link an Verwaltung |

### 2) Versicherer
**Analog:** FNOL → Prüfung → Reserve → Freigabe → Sanierung → Rechnung → Zahlung → Archiv.
**Jetzt „nette App“:** Späte Claims-Liste, Rechnungs-Queue, Batch-Pay, PDF/CSV, Schätzungs-Vergleich.
**Damit „beste App“:** Frühe Queue ab Eingang, eine klare Home, Mobile-Cards, Reserve/Nachforderung, klare Owner-Freigabe vs. Zahler-Rolle.

| Prio | Todo |
|------|------|
| P0 | Claims ab `submitted` (frühe Queue) |
| P1 | Mobile Card-Layout statt nur Tabellen |
| P1 | Einheitliche Insurer-Home (Tabs Claims/Rechnungen) |
| P1 | Reserve-/Coverage-Felder |
| P1 | „Dokumente nachfordern“-Vorlage |
| P2 | Rechnungs-Suche nach Adresse |
| P2 | Emojis entfernen, Copy Owner vs. Pay klären |

### 3) Sanierer
**Analog:** Auftrag → Vor-Ort → Ursache → Trocknung → Protokoll → Rechnung → Geld.
**Jetzt „nette App“:** Assignments, Quick-Drying, Quick-Invoice, Termin, Pool-Profil, PDF.
**Damit „beste App“:** Heute-Agenda, Kontakte/Zugang, Kamera-first, keine UI-Bugs, Maps, klare Ablehnungsgründe.

| Prio | Todo |
|------|------|
| P0 | Doppeltes `ScheduleAppointmentForm` entfernen |
| P0 | Site-Card: Owner-/Mieter-Kontakt + Zugang |
| P1 | Kamera `capture="environment"` beim Foto-Upload |
| P1 | „Heute“-Agenda (scheduled_start heute) |
| P1 | Reject-Reason Banner bei abgelehnter Rechnung |
| P2 | Google-Maps-Link zur Adresse |
| P2 | Equipment-Checkliste |

### 4) Hausverwalter / Eigentümer
**Analog:** Anruf Mieter → Schaden anlegen → Sanierer → Status → Rechnung freigeben → Archiv.
**Jetzt „nette App“:** Dashboard, Melde-Link, Dispatcher, Invite-Link, Fotos+KI-Schätzung, Freigabe.
**Damit „beste App“:** Echte Alerts bei neuem Melden, immer CTA Objekt anlegen, QR druckbar, Bell mit Deep-Links, klarer Status→Dispatch.

| Prio | Todo |
|------|------|
| P0 | Melden: Activity + ehrliche Copy; optional mailto Owner |
| P0 | „Objekt anlegen“ Empty-State immer sichtbar |
| P1 | Bell-Dropdown → `/claims/{id}` |
| P1 | Klarer Pfad Status → Sanierer beauftragen |
| P1 | QR druckbar / mailto Invite |
| P2 | Sie-Form durchgängig |
| P2 | Mieter-Roster pro Objekt |

---

## Geplant (älter, noch offen)

### Adress-Autocomplete
- PLZ → Ort zuerst; Straße später; keine neuen Packages ohne Freigabe

### Optional / Hygiene
- Collaborator Read-Rolle
- Service-Role rotieren falls exponiert
- Storage-Policies prüfen
- `OPENAI_API_KEY` für echte Vision-Foto-KI

---

## Sprint 17.09.2026 #2 — umgesetzt
- [x] Öffentliche Status-Seite `/status/[token]` (HMAC, ~90 Tage, ohne Login)
- [x] Melden-Success: Status-Link + optionales Owner-mailto
- [x] QR drucken am Objekt-Melde-Link
- [x] Insurer Mobile-Cards + Tabs Fälle/Rechnungen
- [x] Sanierer „Heute geplant“-Agenda
- [x] Owner: „Als beauftragt“ + Anker Sanierer zuweisen
- [x] Sie-Form Claim-Neu + Owner-Dashboard-Text

## Sprint 17.09.2026 — umgesetzt
- [x] Mieter-Redirect → `/dashboard/mieter`
- [x] Ehrliche Melden-Success-Copy
- [x] Melder/Einheit in Beschreibung persistieren
- [x] Owner Empty-State „Objekt anlegen“
- [x] Sanierer: doppeltes Termin-Formular entfernt + Maps-Link + Pool-CTA
- [x] Versicherer: frühe Claim-Queue ab `submitted` + Filter
- [x] Mieter: StatusStepper, Fotos, Owner/Sanierer-Kontakte (Name/Tel/Mail)
- [x] Notification-Bell Dropdown mit Claim-Deep-Links
- [x] Kamera-Capture am Foto-Upload
- [x] Mieter-Invite mailto + FAQ korrigiert

- Claim-Routing 2 Tracks bei 12.500 €
- Foto-Analyse → `ai_analysis` + Schätzung + UI
- Form step=1, Texte 12.500 €
- README / Review-Handoff / Security-Härtung
