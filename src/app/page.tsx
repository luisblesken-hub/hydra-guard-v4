import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRedirect } from "@/lib/auth/get-user-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicLanding } from "@/components/landing/public-landing";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirect(getUserRedirect(profile?.role));
  }

  return <PublicLanding />;
}
