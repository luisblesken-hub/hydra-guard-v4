import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

// Browser-/Client-Supabase-Client.
// Achtung: Nur mit dem öffentlichen Anon-Key verwenden, niemals mit Service-Role.
export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
}

