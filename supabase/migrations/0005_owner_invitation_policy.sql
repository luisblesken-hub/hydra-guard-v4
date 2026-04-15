-- Migration 0005: Owner kann damage_invitations verwalten
-- Idempotent via DO $$ duplicate_object handling

DO $$
BEGIN
  CREATE POLICY "Owner kann Einladungen für eigene Reports anlegen"
    ON damage_invitations FOR INSERT
    WITH CHECK (
      invited_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM damage_reports
        WHERE id = damage_invitations.report_id
        AND owner_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Owner kann eigene Einladungen lesen"
    ON damage_invitations FOR SELECT
    USING (invited_by = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- Notification: activity_feed Insert-Policy für Owner
DO $$
BEGIN
  CREATE POLICY "Authenticated users can insert activity feed events"
    ON activity_feed FOR INSERT
    WITH CHECK (actor_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
