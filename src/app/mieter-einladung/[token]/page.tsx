import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function MieterInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("damage_invitations")
    .select("id, email, report_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) notFound();

  const expired = new Date(invitation.expires_at) < new Date();

  // Wenn schon eingeloggt: automatisch als "verwendet" markieren + zum Dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Profile-Email mit invitation-email abgleichen
    const { data: profile } = await admin
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle();

    const matchesEmail =
      (profile?.email ?? user.email)?.toLowerCase() === invitation.email?.toLowerCase();

    if (matchesEmail && !invitation.used_at) {
      await admin
        .from("damage_invitations")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invitation.id);

      // Rolle auf "mieter" setzen (falls noch nicht gesetzt)
      if (!profile?.role || profile.role === "owner") {
        await admin
          .from("profiles")
          .update({ role: "mieter" })
          .eq("id", user.id);
      }

      redirect("/dashboard/mieter");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Mieter-Einladung</h1>

        {expired ? (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Diese Einladung ist abgelaufen. Bitte wende dich an deinen Vermieter für einen neuen Link.
          </div>
        ) : invitation.used_at ? (
          <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            Diese Einladung wurde bereits angenommen. Melde dich an, um fortzufahren.
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Du wurdest zu einem Schadenfall eingeladen. Melde dich mit deiner E-Mail
            <strong className="font-semibold"> {invitation.email}</strong> an
            oder erstelle ein Konto, um den Schaden einzusehen.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Anmelden
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Konto erstellen
          </Link>
        </div>
      </div>
    </div>
  );
}
