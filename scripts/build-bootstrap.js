const fs = require("fs");

let s2 = fs.readFileSync("supabase/migrations/0002_hydra_guard_full.sql", "utf8");
s2 = s2.replace(/CREATE INDEX CONCURRENTLY/gi, "CREATE INDEX");
s2 = s2.replace(
  "'owner','sanierer','tenant','insurance_agent','insurer_admin','super_admin'",
  "'owner','sanierer','versicherung','mieter','admin','tenant','insurance_agent','insurer_admin','super_admin'"
);

let s3 = fs.readFileSync("supabase/migrations/0003_cause_and_pool.sql");
if (s3[0] === 0xff || s3[1] === 0x00) {
  s3 = s3.toString("utf16le").replace(/^\uFEFF/, "");
} else {
  s3 = s3.toString("utf8").replace(/^\uFEFF/, "");
}

const s4 = fs.readFileSync("supabase/migrations/0004_profile_full_name.sql", "utf8");
const s5 = fs.readFileSync("supabase/migrations/0005_owner_invitation_policy.sql", "utf8");

const reset = `-- Hydra Guard V4 · FRESH BOOTSTRAP
-- Skip obsolete 0001 (conflicts with current app schema).
-- Paste into Supabase SQL Editor and Run once.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
`;

const extras = `
-- ===== APP COMPAT PATCHES =====
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
CREATE UNIQUE INDEX IF NOT EXISTS ix_profiles_email ON profiles (email) WHERE email IS NOT NULL;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS public_token uuid;
UPDATE properties SET public_token = gen_random_uuid() WHERE public_token IS NULL;
ALTER TABLE properties
  ALTER COLUMN public_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN public_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_properties_public_token ON properties (public_token);
`;

const out =
  reset +
  "\n-- ===== 0002 =====\n" +
  s2 +
  "\n-- ===== 0003 =====\n" +
  s3 +
  "\n-- ===== 0004 =====\n" +
  s4 +
  "\n-- ===== 0005 =====\n" +
  s5 +
  extras;

fs.writeFileSync("supabase/_bootstrap_fresh.sql", out, "utf8");
console.log("wrote supabase/_bootstrap_fresh.sql", out.length, "bytes");
console.log("versicherung", out.includes("'versicherung'"));
console.log("public_token", out.includes("public_token"));
