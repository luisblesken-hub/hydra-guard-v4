import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateClaimForm } from "../create-claim-form";

export default async function NewClaimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Neuen Schaden melden
        </h1>
        <p className="text-sm text-slate-500">
          Bitte gib die wichtigsten Eckdaten zum Schaden ein. Du kannst Details später ergänzen.
        </p>
      </header>
      <CreateClaimForm />
    </main>
  );
}

