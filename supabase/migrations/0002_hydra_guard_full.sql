-- 0002_hydra_guard_full.sql
-- Hydra Guard V4 complete schema.
-- Safe after 0001: all statements use IF NOT EXISTS or DO $$ exception blocks.
-- No existing data is dropped or modified.

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN CREATE TYPE user_role AS ENUM (
  'owner','sanierer','tenant','insurance_agent','insurer_admin','super_admin'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE owner_type AS ENUM (
  'property_manager','private_landlord','owner_occupier'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE agent_type AS ENUM (
  'tied_agent','broker','multi_agent'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE org_type AS ENUM (
  'broker_local','broker_regional','insurer','property_manager_chain'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE claim_status AS ENUM (
  'draft','submitted','validating','calculating','reviewing',
  'approved','dispatched','in_remediation','invoice_submitted',
  'invoice_approved','closed','rejected','out_of_scope'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE claim_tier AS ENUM (
  'auto_track','expert_track','out_of_scope'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE damage_category AS ENUM (
  'pipe_burst','appliance_leak','human_error','roof_leak','unknown'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE habitability_status AS ENUM (
  'fully_habitable','limited','uninhabitable'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE insurance_scope AS ENUM (
  'building','contents','liability','disputed'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE complexity_flag AS ENUM (
  'mould_risk','multi_unit','structural_concern',
  'displacement','liability_involved','large_loss'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- ORGANISATIONS (local/regional brokers and insurers only)
-- ============================================================

CREATE TABLE IF NOT EXISTS organisations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  org_type            org_type NOT NULL,
  agency_name         text,
  insurer_affiliation text,
  vb_number           text,
  contact_email       text,
  contact_phone       text,
  logo_url            text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text,
  phone               text,
  role                user_role NOT NULL DEFAULT 'owner',
  owner_type          owner_type,
  agent_type          agent_type,
  org_id              uuid REFERENCES organisations(id),
  preferred_language  text DEFAULT 'de',
  onboarding_complete boolean DEFAULT false,
  wizard_completed_at timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROPERTIES (Liegenschaften)
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label          text NOT NULL,
  street         text,
  postal_code    text,
  city           text,
  country        text NOT NULL DEFAULT 'DE',
  building_type  text,
  unit_count     int,
  year_built     int,
  insurer_name   text,
  policy_number  text,
  policy_doc_url text,
  org_id         uuid REFERENCES organisations(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DAMAGE REPORTS
-- GDPR: contains personal data (owner identity, property address,
-- damage description, insurance details).
-- Legal basis: Art. 6(1)(b) DSGVO — contract performance.
-- Retention: 8 years (GoBD). Immutable after status = closed.
-- ============================================================

CREATE TABLE IF NOT EXISTS damage_reports (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id              uuid NOT NULL REFERENCES properties(id),
  owner_id                 uuid NOT NULL REFERENCES auth.users(id),
  reporter_id              uuid REFERENCES auth.users(id),

  status                   claim_status NOT NULL DEFAULT 'draft',
  claim_tier               claim_tier NOT NULL DEFAULT 'auto_track',
  category                 damage_category NOT NULL DEFAULT 'unknown',
  habitability_status      habitability_status NOT NULL DEFAULT 'fully_habitable',

  estimated_amount         numeric(12,2) NOT NULL CHECK (estimated_amount >= 0),
  approved_amount          numeric(12,2),
  final_amount             numeric(12,2),

  affected_rooms           text[],
  affected_floor           int,

  building_insurer_name    text,
  building_policy_number   text,

  has_contents_damage      boolean NOT NULL DEFAULT false,
  contents_insurer_name    text,
  contents_policy_number   text,
  contents_insurer_doc_url text,
  contents_data_confirmed  boolean NOT NULL DEFAULT false,

  liability_involved       boolean NOT NULL DEFAULT false,
  liability_insurer_name   text,
  liability_policy_number  text,

  displacement_required    boolean NOT NULL DEFAULT false,
  displacement_start_date  date,
  displacement_end_date    date,
  rent_reduction_percent   numeric(5,2),

  complexity_flags         complexity_flag[] NOT NULL DEFAULT '{}',
  escalation_reason        text,
  description              text CHECK (char_length(description) <= 5000),

  broker_org_id            uuid REFERENCES organisations(id),
  assigned_agent_id        uuid REFERENCES auth.users(id),

  submitted_at             timestamptz,
  closed_at                timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Trigger: auto-set claim_tier from estimated_amount
CREATE OR REPLACE FUNCTION set_claim_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimated_amount > 15000 THEN
    NEW.claim_tier := 'out_of_scope';
    IF NOT ('large_loss'::complexity_flag = ANY(NEW.complexity_flags)) THEN
      NEW.complexity_flags := array_append(NEW.complexity_flags, 'large_loss'::complexity_flag);
    END IF;
  ELSIF NEW.estimated_amount > 5000 THEN
    NEW.claim_tier := 'expert_track';
  ELSE
    NEW.claim_tier := 'auto_track';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_claim_tier ON damage_reports;
CREATE TRIGGER trg_set_claim_tier
  BEFORE INSERT OR UPDATE OF estimated_amount ON damage_reports
  FOR EACH ROW EXECUTE FUNCTION set_claim_tier();

-- Trigger: auto-set displacement_required from habitability_status
CREATE OR REPLACE FUNCTION set_displacement_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.habitability_status IN ('limited','uninhabitable') THEN
    NEW.displacement_required := true;
    IF NOT ('displacement'::complexity_flag = ANY(NEW.complexity_flags)) THEN
      NEW.complexity_flags := array_append(NEW.complexity_flags, 'displacement'::complexity_flag);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_displacement ON damage_reports;
CREATE TRIGGER trg_set_displacement
  BEFORE INSERT OR UPDATE OF habitability_status ON damage_reports
  FOR EACH ROW EXECUTE FUNCTION set_displacement_flag();

-- ============================================================
-- DAMAGE PHOTOS
-- GDPR: may contain personal data (faces, home interiors).
-- Immutable after report submitted. Timestamped for fraud prevention.
-- ============================================================

CREATE TABLE IF NOT EXISTS damage_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       uuid NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  uploaded_by     uuid NOT NULL REFERENCES auth.users(id),
  storage_path    text NOT NULL,
  original_name   text,
  mime_type       text,
  file_size_bytes bigint,
  insurance_scope insurance_scope NOT NULL DEFAULT 'building',
  room_label      text,
  exif_taken_at   timestamptz,
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  locked          boolean NOT NULL DEFAULT false
);

-- ============================================================
-- CONTENTS DAMAGE ITEMS
-- Hausrat: documented for tenant's own insurer, not cleared by Hydra Guard.
-- GDPR: personal property data. Exported on request, not processed internally.
-- ============================================================

CREATE TABLE IF NOT EXISTS contents_damage_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       uuid NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  owner_user_id   uuid NOT NULL REFERENCES auth.users(id),
  room_label      text,
  description     text NOT NULL,
  estimated_value numeric(10,2),
  photo_ids       uuid[],
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ASSIGNMENTS (Sanierer dispatch)
-- ============================================================

CREATE TABLE IF NOT EXISTS assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             uuid NOT NULL REFERENCES damage_reports(id),
  sanierer_id           uuid NOT NULL REFERENCES auth.users(id),
  assigned_by           uuid NOT NULL REFERENCES auth.users(id),
  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','declined','in_progress','completed')),
  scheduled_start       timestamptz,
  scheduled_end         timestamptz,
  available_slots       jsonb,
  tenant_confirmed_slot int,
  notes                 text,
  fast_pay              boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DRYING LOG (Trocknungsprotokoll — append-only, GoBD relevant)
-- ============================================================

CREATE TABLE IF NOT EXISTS drying_log_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id    uuid NOT NULL REFERENCES assignments(id),
  recorded_by      uuid NOT NULL REFERENCES auth.users(id),
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  room_label       text,
  moisture_percent numeric(5,2),
  equipment_notes  text,
  locked           boolean NOT NULL DEFAULT true
);

REVOKE UPDATE, DELETE ON drying_log_entries FROM authenticated;

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS sanierer_invoices (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id             uuid NOT NULL REFERENCES assignments(id),
  sanierer_id               uuid NOT NULL REFERENCES auth.users(id),
  report_id                 uuid NOT NULL REFERENCES damage_reports(id),
  invoice_number            text,
  amount_net                numeric(12,2) NOT NULL,
  vat_rate                  numeric(5,2) NOT NULL DEFAULT 19.00,
  amount_gross              numeric(12,2) GENERATED ALWAYS AS
                            (amount_net * (1 + vat_rate / 100)) STORED,
  status                    text NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted','under_review','approved','rejected','paid')),
  system_estimate           numeric(12,2),
  deviation_percent         numeric(7,4) GENERATED ALWAYS AS (
                              CASE WHEN system_estimate > 0
                                THEN ((amount_net - system_estimate) / system_estimate * 100)
                                ELSE NULL
                              END
                            ) STORED,
  nash_applied              boolean NOT NULL DEFAULT false,
  fast_pay_applied          boolean NOT NULL DEFAULT false,
  fast_pay_discount_percent numeric(5,2),
  storage_path              text,
  submitted_at              timestamptz NOT NULL DEFAULT now(),
  approved_at               timestamptz,
  paid_at                   timestamptz
);

-- ============================================================
-- TENANT INVITATIONS (magic-link, single-use, 7-day expiry)
-- ============================================================

CREATE TABLE IF NOT EXISTS damage_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid NOT NULL REFERENCES damage_reports(id),
  invited_by  uuid NOT NULL REFERENCES auth.users(id),
  email       text,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ACTIVITY FEED (append-only audit trail)
-- GoBD: immutable, 8-year retention.
-- DSGVO Art. 22: every AI/agent decision logged with actor + rationale.
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid NOT NULL REFERENCES damage_reports(id),
  actor_id    uuid REFERENCES auth.users(id),
  actor_role  user_role,
  event_type  text NOT NULL,
  old_value   jsonb,
  new_value   jsonb,
  note        text,
  row_hash    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

REVOKE UPDATE, DELETE ON activity_feed FROM authenticated;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_damage_reports_owner_status
  ON damage_reports (owner_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_damage_reports_owner_created
  ON damage_reports (owner_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_damage_reports_property
  ON damage_reports (property_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_damage_reports_tier
  ON damage_reports (claim_tier, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_assignments_sanierer_status
  ON assignments (sanierer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_invitations_token
  ON damage_invitations (token) WHERE used_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_activity_feed_report
  ON activity_feed (report_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_photos_report
  ON damage_photos (report_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_properties_owner
  ON properties (owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_profiles_role
  ON profiles (role);

-- ============================================================
-- ROW LEVEL SECURITY
-- (SELECT auth.uid()) evaluated once per query, not per row
-- ============================================================

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties            ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents_damage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE drying_log_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanierer_invoices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_invitations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations         ENABLE ROW LEVEL SECURITY;

-- profiles: own row only
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- properties: owner + admin
DROP POLICY IF EXISTS "properties_owner" ON properties;
CREATE POLICY "properties_owner" ON properties FOR ALL TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('insurer_admin','super_admin'))
  )
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- damage_reports SELECT
DROP POLICY IF EXISTS "reports_select" ON damage_reports;
CREATE POLICY "reports_select" ON damage_reports FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    reporter_id = (SELECT auth.uid()) OR
    assigned_agent_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM assignments a WHERE a.report_id = damage_reports.id AND a.sanierer_id = (SELECT auth.uid())) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('insurer_admin','super_admin'))
  );

-- damage_reports INSERT
DROP POLICY IF EXISTS "reports_insert" ON damage_reports;
CREATE POLICY "reports_insert" ON damage_reports FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- damage_reports UPDATE
DROP POLICY IF EXISTS "reports_update" ON damage_reports;
CREATE POLICY "reports_update" ON damage_reports FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('insurer_admin','super_admin'))
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('insurer_admin','super_admin'))
  );

-- damage_photos
DROP POLICY IF EXISTS "photos_access" ON damage_photos;
CREATE POLICY "photos_access" ON damage_photos FOR ALL TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM damage_reports dr WHERE dr.id = damage_photos.report_id AND (
        dr.owner_id = (SELECT auth.uid()) OR
        EXISTS (SELECT 1 FROM assignments a WHERE a.report_id = dr.id AND a.sanierer_id = (SELECT auth.uid())) OR
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role IN ('insurer_admin','super_admin'))
      )
    )
  );

-- activity_feed SELECT
DROP POLICY IF EXISTS "activity_select" ON activity_feed;
CREATE POLICY "activity_select" ON activity_feed FOR SELECT TO authenticated
  USING (
    actor_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM damage_reports dr WHERE dr.id = activity_feed.report_id AND (
        dr.owner_id = (SELECT auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role IN ('insurer_admin','super_admin'))
      )
    )
  );

-- activity_feed INSERT only
DROP POLICY IF EXISTS "activity_insert" ON activity_feed;
CREATE POLICY "activity_insert" ON activity_feed FOR INSERT TO authenticated
  WITH CHECK (actor_id = (SELECT auth.uid()));

-- organisations: all authenticated can read, only super_admin can write
DROP POLICY IF EXISTS "orgs_read" ON organisations;
CREATE POLICY "orgs_read" ON organisations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "orgs_admin_write" ON organisations;
CREATE POLICY "orgs_admin_write" ON organisations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin'));

