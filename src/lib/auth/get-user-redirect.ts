// Must match DB enum values in `profiles.role`: owner | sanierer | versicherung | mieter
const ROLE_PATHS: Record<"owner" | "sanierer" | "versicherung" | "mieter", string> =
  {
    owner: "/dashboard/owner",
    sanierer: "/dashboard/sanierer",
    versicherung: "/dashboard/insurance",
    mieter: "/dashboard/owner",
  };

export function getUserRedirect(role: string | null | undefined): string {
  // Avoid redirect loops back to `/dashboard` (this page redirects itself).
  if (!role) return "/dashboard/owner";
  return (ROLE_PATHS as Record<string, string>)[role] ?? "/dashboard/owner";
}

