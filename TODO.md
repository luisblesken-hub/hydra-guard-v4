# HydraGuard — Backlog & Session-Stand

Stand: **14.09.2026** (Feierabend)

## Stand heute (für nächste Session)

### Live & Deploy
- Live: https://hydra-guard-v4.vercel.app
- Repo: `main` aktuell (Vercel auto-deploy)
- Lokal: `npm run dev` → http://localhost:3000
- Supabase-Projekt: `psicmrjjwsxtwruncnar` (Frankfurt)
- Migration `0006_claim_tier_two_track.sql` **wurde im SQL Editor ausgeführt** ✅

### Claim-Routing (neu)
| Betrag | Track |
|--------|--------|
| ≤ 12.500 € | Standard (`auto_track`) |
| > 12.500 € | Gutachter / outsourced (`out_of_scope`) |

- Experten-Mittelstufe entfällt für neue Claims (Enum bleibt für Legacy)
- Logik: `src/lib/claims/tier.ts` + DB-Trigger `set_claim_tier()`
- Getestet: Trigger, UI-Preview, Create 8.500 → Standard, Create 15.000 → Gutachter

### Review / Feedback
- IT-Freund (`degeable`): Einladung + WhatsApp mit Live-Link + Test-Login geschickt
- Feedback noch ausstehend — parallel warten ok

### Test-Logins (Demo)
- Passwort: `HydraTest2026!`
- `owner@test.hydra.de`, `admin@test.hydra.de`, `sanierer@test.hydra.de`, `insurer@test.hydra.de`

---

## Geplant (noch nicht umsetzen)

### Adress-Autocomplete bei Eingabe
- **Status:** geplant  
- **Warum:** PLZ/Ort/Straße heute manuell → Tippfehler, inkonsistente Objekte  
- **Sinnvoll:** ja — zuerst **PLZ → Ort**, später optional Straße  
- **Constraints:** keine neuen npm-Packages ohne Freigabe; EU/DSGVO  
- **Nicht jetzt:** erst nach Feedback / klarer Prio

### Optional / Hygiene (wenn Zeit)
- Collaborator-Rolle auf **Read** stellen (falls Write)
- Service-Role-Key rotieren, falls je im Chat exponiert
- Storage-Policies `damage-photos` im Dashboard nochmal prüfen

---

## Erledigt (Referenz)
- Claim-Routing 2 Tracks bei 12.500 €
- Form-Fix: Betragsfeld `step=1` (8500 war vorher HTML5-invalid)
- Texte Claims/Hilfe auf 12.500 €
- README + Review-Handoff
- Security-Härtung (.gitignore, alter Client weg, Vercel Secret)
