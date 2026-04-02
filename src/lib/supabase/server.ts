import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

// Anon-Client für reguläre Nutzer-Queries (RLS bleibt aktiv).
// Verwendet nur die öffentlichen NEXT_PUBLIC_* Variablen.
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  // createServerClient can set cookies; in Server Components this is best-effort.
  // Cookie writes may throw in some rendering contexts, so we catch and
  // silently continue.
  const client = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      async setAll(
        cookiesToSet: { name: string; value: string; options: any }[]
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            // Next's cookieStore.set can throw depending on render mode.
            cookieStore.set(name, value, options);
          }
        } catch {
          // Intentionally ignore to avoid breaking server rendering.
        }
      },
    },
  });

  return client as SupabaseClient;
}

