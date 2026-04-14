import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRedirect } from "@/lib/auth/get-user-redirect";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(getUserRedirect(profile?.role));
}
