import { createAdminClient } from "@/lib/supabase/admin";
import { DispatcherSearch } from "./dispatcher-search";

type SaniererOption = {
  id: string;
  email: string | null;
  specializations?: string[];
  radius_km?: number;
  availability_status?: string;
};

type ExistingAssignment = {
  id: string;
  status: string;
  sanierer_id: string;
  sanierer_email: string | null;
  created_at: string;
};

export async function DispatcherSection({
  reportId,
  role,
  ownerId,
  userId,
}: {
  reportId: string;
  role: string | null;
  ownerId: string | null;
  userId: string;
}) {
  // Nur Owner des Schadens sehen diese Sektion
  if (role !== "owner" || ownerId !== userId) return null;

  const admin = createAdminClient();

  // Alle verfügbaren Sanierer laden inkl. Pool-Profil
  const { data: saniererProfiles } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "sanierer");

  const saniererIds = (saniererProfiles ?? []).map((p) => p.id);
  const poolProfilesMap: Record<string, { specializations: string[]; radius_km: number; availability_status: string }> = {};
  if (saniererIds.length > 0) {
    const { data: poolData } = await admin
      .from("sanierer_pool_profiles")
      .select("profile_id, specializations, radius_km, availability_status")
      .in("profile_id", saniererIds);
    for (const p of poolData ?? []) {
      poolProfilesMap[p.profile_id] = {
        specializations: p.specializations ?? [],
        radius_km: p.radius_km,
        availability_status: p.availability_status,
      };
    }
  }

  const sanierer: SaniererOption[] = (saniererProfiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    ...(poolProfilesMap[p.id] ?? {}),
  }));

  // Bestehende Assignments für diesen Report
  const { data: assignmentsData } = await admin
    .from("assignments")
    .select("id, status, sanierer_id, created_at")
    .eq("report_id", reportId);

  const assignments = assignmentsData ?? [];
  const saniererIds = assignments.map((a) => a.sanierer_id);

  const saniererEmailMap: Record<string, string | null> = {};
  if (saniererIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", saniererIds);
    for (const p of profs ?? []) {
      saniererEmailMap[p.id] = p.email;
    }
  }

  const existingAssignments: ExistingAssignment[] = assignments.map((a) => ({
    id: a.id,
    status: a.status,
    sanierer_id: a.sanierer_id,
    sanierer_email: saniererEmailMap[a.sanierer_id] ?? null,
    created_at: a.created_at,
  }));

  return (
    <DispatcherSearch
      reportId={reportId}
      sanierer={sanierer}
      existingAssignments={existingAssignments}
    />
  );
}
