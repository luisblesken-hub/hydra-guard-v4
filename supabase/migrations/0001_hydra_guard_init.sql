-- HYDRA GUARD V4 · INITIAL SCHEMA & RLS
-- Quelle: _SATELLITE_LAB/hydra-guard-core/master_migration_blueprint.md + AGENT_CHAT_EXTRACTIONS.md 7.1

---------------------------
-- 1. ENUM-TYPEN
---------------------------

create type app_role as enum ('owner', 'tenant', 'sanierer', 'admin');

create type category_tag as enum ('water', 'fire', 'storm', 'other');

create type claim_tier as enum ('small', 'medium', 'large');

create type comm_thread_type as enum ('system', 'owner', 'sanitizer', 'insurer', 'admin');

create type habitability_status as enum ('ok', 'limited', 'uninhabitable');


---------------------------
-- 2. TABELLEN
---------------------------

-- 2.1 profiles (1:1 zu auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  default_role app_role not null,
  created_at timestamptz not null default now()
);


-- 2.2 partners (Versicherer, Contractor, Adjuster etc.)
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null, -- z. B. insurer | contractor | adjuster
  created_at timestamptz not null default now()
);


-- 2.3 user_roles (RBAC-Zuordnung, viele-zu-viele)
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  role app_role not null,
  partner_id uuid references partners (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role, partner_id)
);


-- 2.4 properties (Objekte)
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  partner_id uuid references partners (id) on delete set null,
  address_line text not null,
  postal_code text not null,
  city text not null,
  country text not null,
  habitability habitability_status not null,
  created_at timestamptz not null default now()
);


-- 2.5 damage_reports (Schadenmeldungen)
create table if not exists damage_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  owner_id uuid not null references profiles (id) on delete cascade,
  category category_tag not null,
  claim_tier claim_tier not null,
  status text not null default 'draft', -- z. B. draft | submitted | approved | rejected
  risk_score numeric,                  -- 0–10
  estimated_amount numeric,            -- Euro
  forensic_flags jsonb,                -- optionale Forensik-Hinweise
  created_at timestamptz not null default now()
);


-- 2.6 damage_calculations (Berechnungen pro Schaden)
create table if not exists damage_calculations (
  id uuid primary key default gen_random_uuid(),
  damage_report_id uuid not null references damage_reports (id) on delete cascade,
  system_suggestion_amount numeric not null,  -- Euro
  sanitizer_offer_amount numeric,            -- Euro
  nash_split_compliance numeric,
  nash_split_sanitizer numeric,
  track text,                                -- 'AUTO' | 'EXPERT'
  status text not null default 'pending',    -- z. B. pending | approved | reconciled
  created_at timestamptz not null default now()
);


-- 2.7 calculation_line_items (Positionsliste je Berechnung)
create table if not exists calculation_line_items (
  id uuid primary key default gen_random_uuid(),
  calculation_id uuid not null references damage_calculations (id) on delete cascade,
  code text not null,         -- VGB/DIN 276 Position
  description text not null,
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null
);


-- 2.8 assignments (Zuweisungen, z. B. Sanierer)
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  damage_report_id uuid not null references damage_reports (id) on delete cascade,
  assignee_id uuid not null references profiles (id) on delete cascade, -- z. B. Sanierer
  role app_role not null,                                              -- Rolle in dieser Zuweisung
  created_at timestamptz not null default now()
);


-- 2.9 sanierer_invoices (Rechnungen der Sanierer)
create table if not exists sanierer_invoices (
  id uuid primary key default gen_random_uuid(),
  damage_report_id uuid not null references damage_reports (id) on delete cascade,
  sanitizer_id uuid not null references profiles (id) on delete cascade,
  gross_amount numeric not null,
  regie_share_percent numeric not null,
  status text not null, -- z. B. draft | submitted | approved | paid
  created_at timestamptz not null default now()
);


-- 2.10 strom_clearing (Stromkosten Trocknungsgeräte)
create table if not exists strom_clearing (
  id uuid primary key default gen_random_uuid(),
  damage_report_id uuid not null references damage_reports (id) on delete cascade,
  device_type text not null,  -- z. B. dryer
  power_kw numeric not null,
  days integer not null,
  price_per_kwh numeric not null,
  total_energy_cost numeric not null,
  created_at timestamptz not null default now()
);


-- 2.11 damage_invitations (Einladungen z. B. für Tenants)
create table if not exists damage_invitations (
  id uuid primary key default gen_random_uuid(),
  damage_report_id uuid not null references damage_reports (id) on delete cascade,
  invitee_email text not null,
  token text not null unique,
  role app_role not null,  -- typischerweise 'tenant'
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);


-- 2.12 activity_feed (Ereignis-Log, z. B. für Threads)
create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  damage_report_id uuid references damage_reports (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  event_type comm_thread_type not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);


-- 2.13 credit_transactions (z. B. Guthaben-/Abrechnungsbewegungen)
create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  amount numeric not null,
  type text not null,    -- z. B. charge | refund
  metadata jsonb,
  created_at timestamptz not null default now()
);


---------------------------
-- 3. INDEXE
---------------------------

create index if not exists idx_user_roles_user_role_partner
  on user_roles (user_id, role, partner_id);

create index if not exists idx_properties_owner
  on properties (owner_id);

create index if not exists idx_damage_reports_property
  on damage_reports (property_id);

create index if not exists idx_damage_reports_owner
  on damage_reports (owner_id);

create index if not exists idx_damage_reports_status
  on damage_reports (status);

create index if not exists idx_damage_calculations_report
  on damage_calculations (damage_report_id);

create index if not exists idx_assignments_report
  on assignments (damage_report_id);

create index if not exists idx_assignments_assignee
  on assignments (assignee_id);

create index if not exists idx_damage_invitations_token
  on damage_invitations (token);

create index if not exists idx_activity_feed_report_created
  on activity_feed (damage_report_id, created_at);

create index if not exists idx_credit_transactions_profile
  on credit_transactions (profile_id);


---------------------------
-- 4. RLS-AKTIVIERUNG
---------------------------

-- Hinweis: auth.users ist Supabase-intern; RLS wird auf den Business-Tabellen aktiviert.

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table partners enable row level security;
alter table properties enable row level security;
alter table damage_reports enable row level security;
alter table damage_calculations enable row level security;
alter table calculation_line_items enable row level security;
alter table assignments enable row level security;
alter table sanierer_invoices enable row level security;
alter table strom_clearing enable row level security;
alter table damage_invitations enable row level security;
alter table activity_feed enable row level security;
alter table credit_transactions enable row level security;

alter table profiles force row level security;
alter table user_roles force row level security;
alter table partners force row level security;
alter table properties force row level security;
alter table damage_reports force row level security;
alter table damage_calculations force row level security;
alter table calculation_line_items force row level security;
alter table assignments force row level security;
alter table sanierer_invoices force row level security;
alter table strom_clearing force row level security;
alter table damage_invitations force row level security;
alter table activity_feed force row level security;
alter table credit_transactions force row level security;


---------------------------
-- 5. RLS-POLICIES
---------------------------
-- Annahme: Rollen werden über user_roles.role bestimmt.
-- auth.uid() entspricht profiles.id.
-- Für Tenants wird ein JWT-Claim "invite_token" verwendet, der das Einladungstoken enthält.


-- 5.1 PROFILES

-- Nutzer sieht/bearbeitet nur sein eigenes Profil.
create policy profiles_self_access
  on profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());


-- 5.2 PARTNERS

-- Admins haben Vollzugriff auf partners.
create policy partners_admin_full
  on partners
  for all
  using (
    exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );


-- 5.3 USER_ROLES

-- Admins sehen und pflegen Rollen, andere nur ihre eigenen Zuordnungen lesend.
create policy user_roles_admin_full
  on user_roles
  for all
  using (
    exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

create policy user_roles_self_read
  on user_roles
  for select
  using (user_id = auth.uid());


-- 5.4 PROPERTIES

-- Owners: sehen/bearbeiten nur eigene Properties.
create policy properties_owner_rw
  on properties
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Admins: Vollzugriff.
create policy properties_admin_full
  on properties
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );


-- 5.5 DAMAGE_REPORTS

-- Owners: Zugriff nur auf eigene Schäden.
create policy damage_reports_owner_rw
  on damage_reports
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Sanierer: Lesezugriff auf genehmigte Schäden, wenn Assignment existiert.
create policy damage_reports_sanierer_read
  on damage_reports
  for select
  using (
    status = 'approved'
    and exists (
      select 1
      from assignments a
      where a.damage_report_id = damage_reports.id
        and a.assignee_id = auth.uid()
    )
  );

-- Admins: Vollzugriff.
create policy damage_reports_admin_full
  on damage_reports
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Tenants: Lesezugriff über gültiges Einladungstoken.
-- Annahme: JWT enthält Claim "invite_token", der mit damage_invitations.token übereinstimmt.
create policy damage_reports_tenant_read_via_token
  on damage_reports
  for select
  using (
    exists (
      select 1
      from damage_invitations di
      where di.damage_report_id = damage_reports.id
        and di.token = (current_setting('request.jwt.claims', true)::json->>'invite_token')
        and di.expires_at > now()
    )
  );


-- 5.6 DAMAGE_CALCULATIONS

-- Admins: Vollzugriff.
create policy damage_calculations_admin_full
  on damage_calculations
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Sanierer: Lesen, wenn zugewiesen und Schaden genehmigt.
create policy damage_calculations_sanierer_read
  on damage_calculations
  for select
  using (
    exists (
      select 1
      from damage_reports dr
      join assignments a
        on a.damage_report_id = dr.id
      where damage_calculations.damage_report_id = dr.id
        and dr.status = 'approved'
        and a.assignee_id = auth.uid()
    )
  );

-- Owners: Lesen ihrer eigenen Schäden.
create policy damage_calculations_owner_read
  on damage_calculations
  for select
  using (
    exists (
      select 1
      from damage_reports dr
      where dr.id = damage_calculations.damage_report_id
        and dr.owner_id = auth.uid()
    )
  );


-- 5.7 CALCULATION_LINE_ITEMS

-- Lesen erlaubt, wenn Nutzer den zugehörigen damage_calculation sehen darf (via Unterabfrage).
create policy calculation_line_items_inherit_damage_calculations
  on calculation_line_items
  for select
  using (
    exists (
      select 1
      from damage_calculations dc
      where dc.id = calculation_line_items.calculation_id
    )
  );


-- 5.8 ASSIGNMENTS

-- Admins: Vollzugriff.
create policy assignments_admin_full
  on assignments
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Sanierer: Lesezugriff auf eigene Assignments.
create policy assignments_sanierer_read_own
  on assignments
  for select
  using (assignee_id = auth.uid());


-- 5.9 SANIERER_INVOICES

-- Admins: Vollzugriff.
create policy sanierer_invoices_admin_full
  on sanierer_invoices
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Sanierer: Lesezugriff auf eigene Rechnungen.
create policy sanierer_invoices_sanierer_read_own
  on sanierer_invoices
  for select
  using (sanitizer_id = auth.uid());


-- 5.10 STROM_CLEARING

-- Admins: Vollzugriff.
create policy strom_clearing_admin_full
  on strom_clearing
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Owners: Lesezugriff auf Strom-Clearing ihrer Schäden.
create policy strom_clearing_owner_read
  on strom_clearing
  for select
  using (
    exists (
      select 1
      from damage_reports dr
      where dr.id = strom_clearing.damage_report_id
        and dr.owner_id = auth.uid()
    )
  );


-- 5.11 DAMAGE_INVITATIONS

-- Admins: Vollzugriff.
create policy damage_invitations_admin_full
  on damage_invitations
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Lesezugriff für eingeladene Tenants über Token (Claim "invite_token").
create policy damage_invitations_tenant_read_via_token
  on damage_invitations
  for select
  using (
    token = (current_setting('request.jwt.claims', true)::json->>'invite_token')
    and expires_at > now()
  );


-- 5.12 ACTIVITY_FEED

-- Admins: Vollzugriff.
create policy activity_feed_admin_full
  on activity_feed
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Owners/Sanierer/Tenants: Nur Einträge sehen, zu Schäden, auf die sie Zugriff haben.
create policy activity_feed_shared_read
  on activity_feed
  for select
  using (
    exists (
      select 1
      from damage_reports dr
      where dr.id = activity_feed.damage_report_id
        and (
          -- Owner
          dr.owner_id = auth.uid()
          -- Admin
          or exists (
            select 1 from user_roles ur
            where ur.user_id = auth.uid()
              and ur.role = 'admin'
          )
          -- Sanierer mit Assignment
          or exists (
            select 1
            from assignments a
            where a.damage_report_id = dr.id
              and a.assignee_id = auth.uid()
          )
          -- Tenant via Einladungstoken
          or exists (
            select 1
            from damage_invitations di
            where di.damage_report_id = dr.id
              and di.token = (current_setting('request.jwt.claims', true)::json->>'invite_token')
              and di.expires_at > now()
          )
        )
    )
  );


-- 5.13 CREDIT_TRANSACTIONS

-- Admins: Vollzugriff.
create policy credit_transactions_admin_full
  on credit_transactions
  for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- Nutzer: Lesezugriff auf eigene Transaktionen.
create policy credit_transactions_owner_read_own
  on credit_transactions
  for select
  using (profile_id = auth.uid());

