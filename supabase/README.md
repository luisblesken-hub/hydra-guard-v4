## Hydra Guard V4 – Supabase / Postgres Schema

Diese Ordnerstruktur enthält SQL-Migrationen für das Hydra-Guard-V4-Datenmodell.

- `migrations/0001_hydra_guard_init.sql`  
  Erstes Schema inkl. Tabellen, ENUM-Typen, Indexen und RLS-Policies gemäß:
  - `_SATELLITE_LAB/hydra-guard-core/master_migration_blueprint.md`
  - `AGENT_CHAT_EXTRACTIONS.md` Abschnitt 7.1

### Migration in einem Supabase-Projekt ausführen

**Variante A – Supabase-Web-Konsole**

1. Im Supabase-Dashboard dein Projekt öffnen.
2. Links `SQL` → `New query`.
3. Inhalt von `migrations/0001_hydra_guard_init.sql` aus diesem Repo kopieren.
4. Query ausführen (`RUN`).

> Hinweis: Führe die Migration nur einmal pro Projekt aus (idempotente Neuanlage ist nicht garantiert).

**Variante B – Supabase CLI (optional)**

Falls du die Supabase-CLI verwendest, kannst du die Datei in deine lokale
`supabase/migrations/`-Struktur kopieren und dann z. B. ausführen mit:

```bash
supabase migration up
```

Stelle sicher, dass du vorher ein neues Supabase-Projekt ohne bestehende Schema-Kollisionen verwendest.

