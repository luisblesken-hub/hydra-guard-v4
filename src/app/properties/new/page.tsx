import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPropertyForm } from "./new-property-form";

export default async function NewPropertyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Neues Objekt anlegen</h1>
        <p className="text-sm text-slate-500">
          Liegenschaft registrieren und QR-Code für Meldungen erhalten.
        </p>
      </header>
      <NewPropertyForm />
    </main>
  );
}
