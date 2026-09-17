import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignupForm } from "./signup-form";

const ROLE_VALUES = new Set(["owner", "sanierer", "versicherung"]);

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const defaultRole = ROLE_VALUES.has(params.role ?? "")
    ? (params.role as "owner" | "sanierer" | "versicherung")
    : "owner";

  return <SignupForm defaultRole={defaultRole} />;
}

