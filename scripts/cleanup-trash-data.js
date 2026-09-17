/**
 * One-shot cleanup: delete incomplete trash properties/claims + orphan storage.
 * Keeps Musterstraße demo property and its valid claims.
 */
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    }),
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const trashClaimIds = [
  "0fbb3ede-b945-466b-8c2a-ef35f5586738", // property Aachen without street
  "1e25415a-49e4-4349-908c-7eff47421ac4", // property köln without street
  "c7794a10-efe3-4f4d-aee7-7ece584cbaf7", // estimated_amount 0 / unknown
];

const trashPropIds = [
  "59dd84d4-6c54-4f8a-87e5-9ff09fd4440b",
  "f2d7ad98-0063-4220-b24e-51058e2742dd",
];

async function del(table, col, ids) {
  if (!ids.length) return { table, skipped: true };
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .in(col, ids);
  return { table, col, count, error: error?.message || null };
}

async function main() {
  const log = [];

  const photos = await admin
    .from("damage_photos")
    .select("id,storage_path")
    .in("report_id", trashClaimIds);
  const photoPaths = (photos.data || []).map((p) => p.storage_path);
  log.push({ photos: photos.data, photoErr: photos.error?.message || null });

  // Related tables — probe + delete by common FK names
  const attempts = [
    ["drying_log_entries", "report_id"],
    ["drying_logs", "report_id"],
    ["drying_logs", "damage_report_id"],
    ["assignments", "damage_report_id"],
    ["assignments", "report_id"],
    ["sanierer_invoices", "damage_report_id"],
    ["sanierer_invoices", "report_id"],
    ["activity_feed", "damage_report_id"],
    ["activity_feed", "report_id"],
    ["claim_notes", "damage_report_id"],
    ["claim_notes", "report_id"],
    ["damage_invitations", "property_id"],
  ];

  for (const [table, col] of attempts) {
    const ids = col === "property_id" ? trashPropIds : trashClaimIds;
    log.push(await del(table, col, ids));
  }

  log.push(await del("damage_photos", "report_id", trashClaimIds));
  log.push(await del("damage_reports", "id", trashClaimIds));
  log.push(await del("properties", "id", trashPropIds));

  if (photoPaths.length) {
    const rem = await admin.storage.from("damage-photos").remove(photoPaths);
    log.push({ storageRemove: rem.data, storageErr: rem.error?.message || null });
  }

  // Remove empty claim folders leftovers (list + delete files)
  for (const claimId of trashClaimIds) {
    const listed = await admin.storage
      .from("damage-photos")
      .list(`claims/${claimId}`, { limit: 100 });
    const files = (listed.data || []).map((f) => `claims/${claimId}/${f.name}`);
    if (files.length) {
      const rem = await admin.storage.from("damage-photos").remove(files);
      log.push({ folder: claimId, files: files.length, err: rem.error?.message || null });
    } else {
      log.push({ folder: claimId, files: 0, listErr: listed.error?.message || null });
    }
  }

  const leftClaims = await admin
    .from("damage_reports")
    .select("id,status,estimated_amount,property_id");
  const leftProps = await admin
    .from("properties")
    .select("id,label,street,city,postal_code");

  console.log(
    JSON.stringify(
      { log, leftClaims: leftClaims.data, leftProps: leftProps.data },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
