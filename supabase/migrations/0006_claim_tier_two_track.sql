-- Two-track routing: auto_track (<= 12.500 €) vs out_of_scope (> 12.500 €).
-- expert_track stays in the enum for legacy rows; new inserts never set it.

CREATE OR REPLACE FUNCTION set_claim_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimated_amount > 12500 THEN
    NEW.claim_tier := 'out_of_scope';
    IF NOT ('large_loss'::complexity_flag = ANY(NEW.complexity_flags)) THEN
      NEW.complexity_flags := array_append(NEW.complexity_flags, 'large_loss'::complexity_flag);
    END IF;
  ELSE
    NEW.claim_tier := 'auto_track';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reclassify existing rows to match the new rule
UPDATE damage_reports
SET
  claim_tier = CASE
    WHEN estimated_amount > 12500 THEN 'out_of_scope'::claim_tier
    ELSE 'auto_track'::claim_tier
  END,
  complexity_flags = CASE
    WHEN estimated_amount > 12500
      AND NOT ('large_loss'::complexity_flag = ANY(complexity_flags))
    THEN array_append(complexity_flags, 'large_loss'::complexity_flag)
    ELSE complexity_flags
  END;
