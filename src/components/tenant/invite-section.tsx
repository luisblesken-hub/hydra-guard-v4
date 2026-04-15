import { createAdminClient } from "@/lib/supabase/admin";
import { InviteClient } from "./invite-client";

type Invitation = {
  id: string;
  email: string | null;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

export async function InviteTenantSection({
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
  if (role !== "owner" || ownerId !== userId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("damage_invitations")
    .select("id, email, token, created_at, expires_at, used_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  const invitations: Invitation[] = (data ?? []) as Invitation[];

  return <InviteClient reportId={reportId} invitations={invitations} />;
}
