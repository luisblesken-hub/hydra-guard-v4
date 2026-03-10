// Hydra Guard V4 – Env-Validierung
// Erwartete Variablen:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY (nur serverseitig verwenden)

const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

type EnvKeys = keyof typeof requiredEnv;

function getEnv(key: EnvKeys): string {
  const value = requiredEnv[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getServerOnlyEnv(key: "SUPABASE_SERVICE_ROLE_KEY"): string {
  if (typeof window !== "undefined") {
    throw new Error(`${key} darf nur serverseitig gelesen werden.`);
  }
  return getEnv(key);
}

export const env = {
  supabaseUrl: () => getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => getServerOnlyEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

