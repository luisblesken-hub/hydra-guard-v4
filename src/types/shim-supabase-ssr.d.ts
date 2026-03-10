declare module "@supabase/ssr" {
  import type { SupabaseClient as JsClient } from "@supabase/supabase-js";

  // Shim type so existing imports of SupabaseClient from '@supabase/ssr'
  // compile cleanly. At runtime, only the concrete client factories are used.
  export type SupabaseClient<Database = any> = JsClient<Database>;
}

