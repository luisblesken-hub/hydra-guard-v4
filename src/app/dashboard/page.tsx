import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRedirect } from "@/lib/auth/get-user-redirect";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const target = getUserRedirect(profile?.role ?? null);
  redirect(target);
}

