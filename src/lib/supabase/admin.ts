import { createServerClient, type SupabaseClient } from "@supabase/ssr";
import { env } from "../env";

// Admin-Client mit Service-Role-Key.
// Nur für Admin-/Backend-Operationen verwenden (z. B. Webhooks, Migrations-Helper),
// niemals aus Client-Komponenten heraus.
export function createAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient darf nur serverseitig verwendet werden.");
  }

  return createServerClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

