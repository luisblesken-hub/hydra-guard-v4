-- Migration 0004: profiles.full_name Feld
-- Signup-Form sammelt bereits full_name, bisher wurde es verworfen.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text;

COMMENT ON COLUMN profiles.full_name IS 'Vollständiger Name aus Signup-Formular. Optional.';
