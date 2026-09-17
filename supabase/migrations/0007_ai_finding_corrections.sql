-- Migration 0007: Owner corrections for AI photo/claim findings
-- Idempotent. RLS: claim owner can CRUD own corrections.

CREATE TABLE IF NOT EXISTS ai_finding_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  photo_id uuid NULL REFERENCES damage_photos(id) ON DELETE CASCADE,
  original_damage_type text NULL,
  original_amount_eur numeric NULL,
  corrected_damage_type text NULL,
  corrected_amount_eur numeric NULL,
  corrected_severity text NULL,
  note text NULL,
  corrected_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_finding_corrections_amount_positive
    CHECK (corrected_amount_eur IS NULL OR corrected_amount_eur > 0),
  CONSTRAINT ai_finding_corrections_has_payload
    CHECK (
      corrected_damage_type IS NOT NULL
      OR corrected_amount_eur IS NOT NULL
      OR corrected_severity IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_finding_corrections_photo_uidx
  ON ai_finding_corrections (photo_id)
  WHERE photo_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ai_finding_corrections_claim_uidx
  ON ai_finding_corrections (report_id)
  WHERE photo_id IS NULL;

CREATE INDEX IF NOT EXISTS ai_finding_corrections_report_idx
  ON ai_finding_corrections (report_id);

ALTER TABLE ai_finding_corrections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "ai_corrections_owner_select"
    ON ai_finding_corrections FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM damage_reports dr
        WHERE dr.id = ai_finding_corrections.report_id
          AND dr.owner_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "ai_corrections_owner_insert"
    ON ai_finding_corrections FOR INSERT TO authenticated
    WITH CHECK (
      corrected_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM damage_reports dr
        WHERE dr.id = ai_finding_corrections.report_id
          AND dr.owner_id = auth.uid()
      )
      AND (
        photo_id IS NULL
        OR EXISTS (
          SELECT 1 FROM damage_photos dp
          WHERE dp.id = ai_finding_corrections.photo_id
            AND dp.report_id = ai_finding_corrections.report_id
        )
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "ai_corrections_owner_update"
    ON ai_finding_corrections FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM damage_reports dr
        WHERE dr.id = ai_finding_corrections.report_id
          AND dr.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      corrected_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM damage_reports dr
        WHERE dr.id = ai_finding_corrections.report_id
          AND dr.owner_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "ai_corrections_owner_delete"
    ON ai_finding_corrections FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM damage_reports dr
        WHERE dr.id = ai_finding_corrections.report_id
          AND dr.owner_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
