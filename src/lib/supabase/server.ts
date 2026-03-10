import { cookies } from "next/headers";
import { createServerClient, type SupabaseClient } from "@supabase/ssr";
import { env } from "../env";

// Anon-Client für reguläre Nutzer-Queries (RLS bleibt aktiv).
// Verwendet nur die öffentlichen NEXT_PUBLIC_* Variablen.
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  // createServerClient kann Cookies setzen; in Server Components ist das
  // best effort – Fehler beim Setzen dürfen den Request nicht crashen.
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // Ignorieren im reinen Server-Render-Kontext.
      },
      remove() {
        // Ignorieren im reinen Server-Render-Kontext.
      },
    },
  });
}

