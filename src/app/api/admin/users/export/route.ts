import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: users } = await admin
    .from("profiles")
    .select("id, email, role, updated_at")
    .order("updated_at", { ascending: false });

  const rows = [
    ["ID", "E-Mail", "Rolle", "Zuletzt aktualisiert"].join(";"),
    ...(users ?? []).map((u) =>
      [u.id, u.email ?? "", u.role ?? "", u.updated_at ?? ""].join(";")
    ),
  ];

  return new NextResponse("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nutzer-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
