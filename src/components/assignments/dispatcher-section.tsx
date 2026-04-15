import { createAdminClient } from "@/lib/supabase/admin";
import { DispatcherClient } from "./dispatcher-client";

type SaniererOption = {
  id: string;
  email: string | null;
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

  // Alle verfügbaren Sanierer laden
  const { data: saniererProfiles } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "sanierer");

  const sanierer: SaniererOption[] = (saniererProfiles ?? []) as SaniererOption[];

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
    <DispatcherClient
      reportId={reportId}
      sanierer={sanierer}
      existingAssignments={existingAssignments}
    />
  );
}
