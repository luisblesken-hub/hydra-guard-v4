## Hydra Guard V4 – Security & RLS (MVP-Stand)

- **Rollenmodell**  
  - `owner`: Eigentümer/Initiator eines Schadens (profiles.id = auth.uid()).  
  - `sanierer`: Ausführender Dienstleister, über `assignments` einem Schaden zugeordnet.  
  - `admin`: Interner Operator mit Vollzugriff auf Business-Tabellen.  
  - `tenant`: Eingeladene Dritte (z. B. Mieter) mit Token-basiertem Read-only-Zugriff auf bestimmte Schäden.

- **Kern-Tabellen & RLS** (siehe `supabase/migrations/0001_hydra_guard_init.sql`)  
  - `properties`: RLS erzwingt, dass Owners nur eigene Objekte sehen/bearbeiten; Admins haben Vollzugriff.  
  - `damage_reports`: Owners sehen/bearbeiten nur eigene Schäden; Sanierer sehen nur genehmigte Schäden mit Assignment; Tenants lesen über gültige `damage_invitations.token`; Admins haben Vollzugriff.  
  - `damage_calculations`: Gekoppelt an `damage_reports`; RLS spiegelt Owner-/Sanierer-/Admin-Logik.  
  - `sanierer_invoices`, `strom_clearing`, `activity_feed`, `credit_transactions`: Zugriff jeweils nur für berechtigte Rollen und nur für Schäden/Profiles, auf die bereits Zugriff besteht.

- **Invite-Token-Mechanismus (Tenant)**  
  - Tabelle `damage_invitations` enthält `token` + `expires_at`.  
  - RLS-Policies prüfen ein JWT-Claim `invite_token` gegen `damage_invitations.token`.  
  - Nur gültige, nicht abgelaufene Tokens erlauben Read-Zugriff auf den zugehörigen Schaden und relevante Activity-Feed-Einträge.

- **Owner-Flow im MVP**  
  - Owner wird aktuell über ein Cookie `hg_owner_id` angenähert (MVP-Annahme, bis Supabase-Auth angebunden ist).  
  - Datenbankseitig erzwingen Policies dennoch, dass nur Zeilen mit `owner_id = auth.uid()` sichtbar sind; der MVP-Flow verlässt sich mittelfristig auf Supabase Auth + RLS.

- **Admin & Service-Role**  
  - `SUPABASE_SERVICE_ROLE_KEY` wird ausschließlich im Server-Client (`src/lib/supabase/server.ts`) verwendet.  
  - Kein Service-Role-Schlüssel im Browser/Client-Bundle; alle sicherheitskritischen Operationen laufen serverseitig und respektieren RLS.

- **Clearing & Trennung**  
  - Hydra Guard V4 liegt komplett im Projektordner `hydra-guard`; `core/` (Motherboard) bleibt unberührt.  
  - Cross-Project-Coupling wird vermieden; alle Hydra-Guard-spezifischen RLS-/Security-Entscheidungen stecken in der Migration `0001_hydra_guard_init.sql` und den Supabase-Clients im `src/lib`-Pfad.

